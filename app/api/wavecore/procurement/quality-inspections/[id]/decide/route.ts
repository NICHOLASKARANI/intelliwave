export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/quality-inspections/[id]/decide
 * Body: {
 *   decision*: 'PASSED' | 'FAILED' | 'CONDITIONAL'
 *   sampleSize?: number
 *   passedQty?: number
 *   failedQty?: number
 *   findings?: string
 *   correctiveAction?: string
 * }
 *
 * Effects:
 * - Sets inspection status + inspectedAt + inspector info.
 * - If FAILED: adds failedQty to GRN line.rejectedQty, adjusts line.lineTotal.
 * - If PASSED / CONDITIONAL: no changes to GRN line counts.
 * - Rolls up GRN status:
 *     * any line has failedQty > 0  → REJECTED (overridable)
 *     * all lines accepted          → ACCEPTED
 *     * mixed                        → INSPECTED
 *   (never downgrades from CANCELLED).
 * - Logs QUALITY_INSPECTION_DECIDED.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const decision = String(body?.decision || '').toUpperCase()
  if (!['PASSED','FAILED','CONDITIONAL'].includes(decision)) {
    return NextResponse.json({ error: 'decision must be PASSED | FAILED | CONDITIONAL' }, { status: 400 })
  }

  const inspectionRes = await pool.query(
    `SELECT * FROM "QualityInspection"
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (inspectionRes.rowCount === 0) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
  }
  const inspection = inspectionRes.rows[0]
  if (inspection.status !== 'PENDING') {
    return NextResponse.json({ error: 'Inspection already decided (' + inspection.status + ')' }, { status: 409 })
  }

  const failedQty = Math.max(0, Number(body?.failedQty) || 0)
  const passedQty = Math.max(0, Number(body?.passedQty) || 0)
  const sampleSize = body?.sampleSize != null ? Number(body.sampleSize) : null

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Update the inspection record
    await client.query(
      `UPDATE "QualityInspection" SET
         status            = $1,
         "inspectorId"     = COALESCE("inspectorId", $2),
         "inspectorName"   = COALESCE("inspectorName", $3),
         "inspectedAt"     = NOW(),
         "sampleSize"      = COALESCE($4, "sampleSize"),
         "passedQty"       = COALESCE($5, "passedQty"),
         "failedQty"       = COALESCE($6, "failedQty"),
         findings          = COALESCE($7, findings),
         "correctiveAction"= COALESCE($8, "correctiveAction"),
         "updatedAt"       = NOW()
       WHERE id = $9 AND "organizationId" = $10`,
      [
        decision,
        g.userId, g.userName,
        sampleSize, passedQty, failedQty,
        body?.findings || null,
        body?.correctiveAction || null,
        id, g.organizationId,
      ]
    )

    // 2. If FAILED and there is a line, bump rejectedQty + recompute lineTotal
    if (decision === 'FAILED' && inspection.goodsReceiptLineId && failedQty > 0) {
      const lineRes = await client.query(
        `SELECT * FROM "GoodsReceiptLine"
         WHERE id = $1 AND "organizationId" = $2`,
        [inspection.goodsReceiptLineId, g.organizationId]
      )
      if (lineRes.rowCount > 0) {
        const line = lineRes.rows[0]
        const newRejected = Number(line.rejectedQty || 0) + failedQty
        const acceptedQty = Math.max(0,
          Number(line.receivedQty || 0) - newRejected - Number(line.damagedQty || 0)
        )
        const newLineTotal = acceptedQty * Number(line.unitPrice || 0) * (1 + Number(line.taxRate || 0) / 100)

        await client.query(
          `UPDATE "GoodsReceiptLine"
           SET "rejectedQty" = $1, "lineTotal" = $2, "updatedAt" = NOW()
           WHERE id = $3 AND "organizationId" = $4`,
          [newRejected, newLineTotal, inspection.goodsReceiptLineId, g.organizationId]
        )
      }
    }

    // 3. Roll up GRN status (if the inspection is linked to a GRN)
    if (inspection.goodsReceiptId) {
      const linesRes = await client.query(
        `SELECT COUNT(*)::int AS total,
                SUM(CASE WHEN COALESCE("rejectedQty",0) > 0 THEN 1 ELSE 0 END)::int AS rejected_lines,
                SUM(CASE WHEN COALESCE("rejectedQty",0) = 0 AND COALESCE("receivedQty",0) > 0 THEN 1 ELSE 0 END)::int AS accepted_lines
         FROM "GoodsReceiptLine"
         WHERE "goodsReceiptId" = $1 AND "organizationId" = $2`,
        [inspection.goodsReceiptId, g.organizationId]
      )
      const { total, rejected_lines, accepted_lines } = linesRes.rows[0]

      let newStatus: string | null = null
      if (rejected_lines > 0) newStatus = 'REJECTED'
      else if (total > 0 && accepted_lines === total) newStatus = 'ACCEPTED'
      else newStatus = 'INSPECTED'

      await client.query(
        `UPDATE "GoodsReceipt"
         SET status = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3
           AND status <> 'CANCELLED'`,
        [newStatus, inspection.goodsReceiptId, g.organizationId]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[qi-decide]', (err as Error).message)
    return NextResponse.json({ error: 'Decide failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'QUALITY_INSPECTION_DECIDED',
    entityType: 'QualityInspection',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Inspection ' + decision + (failedQty ? ' (' + failedQty + ' failed)' : ''),
    metadata: { decision, failedQty, passedQty, sampleSize, goodsReceiptId: inspection.goodsReceiptId },
  })

  return NextResponse.json({ ok: true, decision })
})