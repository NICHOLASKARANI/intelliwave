export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/goods-receipts/[id]/cancel
 * Body: { reason?: string }
 *
 * Effects:
 * - If GRN was SUBMITTED/INSPECTED/ACCEPTED/REJECTED, reverts the receivedQty
 *   increments that were applied to PurchaseOrderItem.
 * - Recomputes PO status (PARTIALLY_RECEIVED | APPROVED | SENT | ACKNOWLEDGED).
 * - Sets GRN status = CANCELLED.
 * - Logs event.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  let body: any = {}
  try { body = await request.json() } catch { /* optional */ }

  const grnRes = await pool.query(
    `SELECT * FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (grnRes.rowCount === 0) {
    return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
  }
  const grn = grnRes.rows[0]
  if (grn.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Already cancelled' }, { status: 409 })
  }

  const applied = ['SUBMITTED', 'INSPECTED', 'ACCEPTED', 'REJECTED'].includes(grn.status)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (applied) {
      const linesRes = await client.query(
        `SELECT * FROM "GoodsReceiptLine"
         WHERE "goodsReceiptId" = $1 AND "organizationId" = $2`,
        [id, g.organizationId]
      )
      for (const l of linesRes.rows) {
        const acceptedQty = Math.max(0,
          Number(l.receivedQty || 0) - Number(l.rejectedQty || 0) - Number(l.damagedQty || 0)
        )
        if (acceptedQty <= 0) continue

        await client.query(
          `UPDATE "PurchaseOrderItem"
           SET "receivedQty" = GREATEST(0, COALESCE("receivedQty", 0) - $1)
           WHERE id = $2 AND "purchaseOrderId" = $3`,
          [acceptedQty, l.purchaseOrderItemId, grn.purchaseOrderId]
        )
      }

      // Recompute PO status
      if (grn.purchaseOrderId) {
        const totals = await client.query(
          `SELECT
             COUNT(*)::int AS lines,
             SUM(CASE WHEN COALESCE("receivedQty", 0) >= quantity THEN 1 ELSE 0 END)::int AS fully,
             SUM(CASE WHEN COALESCE("receivedQty", 0) > 0 THEN 1 ELSE 0 END)::int AS any_recv
           FROM "PurchaseOrderItem"
           WHERE "purchaseOrderId" = $1`,
          [grn.purchaseOrderId]
        )
        const { lines: totalLines, fully, any_recv } = totals.rows[0]
        let newStatus = 'ACKNOWLEDGED'
        if (totalLines > 0 && fully === totalLines) newStatus = 'FULLY_RECEIVED'
        else if (any_recv > 0) newStatus = 'PARTIALLY_RECEIVED'
        else {
          // fall back to pre-receipt state
          const poRes = await client.query(
            `SELECT status FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
            [grn.purchaseOrderId, g.organizationId]
          )
          const cur = poRes.rows[0]?.status
          newStatus = (cur === 'PARTIALLY_RECEIVED' || cur === 'FULLY_RECEIVED') ? 'ACKNOWLEDGED' : cur
        }

        await client.query(
          `UPDATE "PurchaseOrder"
           SET status = $1, "updatedAt" = NOW()
           WHERE id = $2 AND "organizationId" = $3
             AND status NOT IN ('CLOSED','CANCELLED','INVOICED','MATCHED')`,
          [newStatus, grn.purchaseOrderId, g.organizationId]
        )
      }
    }

    await client.query(
      `UPDATE "GoodsReceipt"
       SET status = 'CANCELLED', notes = COALESCE($1, notes), "updatedAt" = NOW()
       WHERE id = $2 AND "organizationId" = $3`,
      [body?.reason ? ('CANCELLED: ' + body.reason) : null, id, g.organizationId]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[grn-cancel]', (err as Error).message)
    return NextResponse.json({ error: 'Cancel failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_CANCELLED',
    entityType: 'GoodsReceipt',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Cancelled GRN ' + grn.grnNumber,
    metadata: { reason: body?.reason || null, reverted: applied },
  })

  return NextResponse.json({ ok: true })
})