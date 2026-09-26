export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/quality-inspections/[id]
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const r = await pool.query(
    `SELECT * FROM "QualityInspection"
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
  const inspection = r.rows[0]

  const [lineRes, grnRes] = await Promise.all([
    inspection.goodsReceiptLineId
      ? pool.query(
          `SELECT * FROM "GoodsReceiptLine"
           WHERE id = $1 AND "organizationId" = $2`,
          [inspection.goodsReceiptLineId, g.organizationId]
        )
      : Promise.resolve({ rows: [] }),
    inspection.goodsReceiptId
      ? pool.query(
          `SELECT id, "grnNumber", status, "purchaseOrderId", "receivedByName", "receivedAt"
           FROM "GoodsReceipt"
           WHERE id = $1 AND "organizationId" = $2`,
          [inspection.goodsReceiptId, g.organizationId]
        )
      : Promise.resolve({ rows: [] }),
  ])

  return NextResponse.json({
    inspection,
    line: lineRes.rows[0] || null,
    goodsReceipt: grnRes.rows[0] || null,
  })
})

/**
 * PATCH /api/wavecore/procurement/quality-inspections/[id]
 * Editable while status = PENDING.
 * Fields: sampleSize, passedQty, failedQty, findings, correctiveAction, inspectorName
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const existing = await pool.query(
    `SELECT status FROM "QualityInspection"
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (existing.rowCount === 0) return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
  if (existing.rows[0].status !== 'PENDING') {
    return NextResponse.json({ error: 'Only PENDING inspections can be edited' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const editable: Record<string, string> = {
    sampleSize: 'sampleSize',
    passedQty: 'passedQty',
    failedQty: 'failedQty',
    findings: 'findings',
    correctiveAction: 'correctiveAction',
    inspectorName: 'inspectorName',
  }

  const sets: string[] = []
  const values: any[] = []
  for (const [k, col] of Object.entries(editable)) {
    if (k in body) {
      values.push(body[k] === '' ? null : body[k])
      sets.push(`"${col}" = $${values.length}`)
    }
  }
  if (sets.length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  }
  sets.push(`"updatedAt" = NOW()`)

  values.push(id)
  const idParam = values.length
  values.push(g.organizationId)
  const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "QualityInspection" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'QUALITY_INSPECTION_UPDATED',
    entityType: 'QualityInspection',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated inspection',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ inspection: upd.rows[0] })
})