export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraftAndOwned(grnId: string, lineId: string, orgId: string) {
  const grnRes = await pool.query(
    `SELECT status FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
    [grnId, orgId]
  )
  if (grnRes.rowCount === 0) return { ok: false, code: 404, error: 'Goods receipt not found' }
  if (grnRes.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Only DRAFT goods receipts can be edited' }

  const lineRes = await pool.query(
    `SELECT * FROM "GoodsReceiptLine"
     WHERE id = $1 AND "goodsReceiptId" = $2 AND "organizationId" = $3`,
    [lineId, grnId, orgId]
  )
  if (lineRes.rowCount === 0) return { ok: false, code: 404, error: 'Line not found' }
  return { ok: true, line: lineRes.rows[0] }
}

/**
 * PATCH /api/wavecore/procurement/goods-receipts/[id]/lines/[lineId]
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params

  const chk = await assertDraftAndOwned(id, lineId, g.organizationId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })
  const existing = chk.line

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const receivedQty = 'receivedQty' in body ? Number(body.receivedQty) : Number(existing.receivedQty)
  const rejectedQty = 'rejectedQty' in body ? Number(body.rejectedQty) : Number(existing.rejectedQty)
  const damagedQty  = 'damagedQty'  in body ? Number(body.damagedQty)  : Number(existing.damagedQty)
  const unitPrice   = 'unitPrice'   in body ? Number(body.unitPrice)   : Number(existing.unitPrice)
  const taxRate     = 'taxRate'     in body ? Number(body.taxRate)     : Number(existing.taxRate)
  const acceptedQty = Math.max(0, receivedQty - rejectedQty - damagedQty)
  const lineTotal   = acceptedQty * unitPrice * (1 + taxRate / 100)

  const upd = await pool.query(
    `UPDATE "GoodsReceiptLine" SET
       description    = COALESCE($1, description),
       "productId"    = COALESCE($2, "productId"),
       "unitOfMeasure"= COALESCE($3, "unitOfMeasure"),
       "receivedQty"  = $4,
       "rejectedQty"  = $5,
       "damagedQty"   = $6,
       "unitPrice"    = $7,
       "taxRate"      = $8,
       "lineTotal"    = $9,
       "serialNumbers"= COALESCE($10, "serialNumbers"),
       "batchNumber"  = COALESCE($11, "batchNumber"),
       "lotNumber"    = COALESCE($12, "lotNumber"),
       "expiryDate"   = COALESCE($13, "expiryDate"),
       condition      = COALESCE($14, condition),
       notes          = COALESCE($15, notes),
       "updatedAt"    = NOW()
     WHERE id = $16 AND "goodsReceiptId" = $17 AND "organizationId" = $18
     RETURNING *`,
    [
      body.description || null,
      body.productId || null,
      body.unitOfMeasure || null,
      receivedQty, rejectedQty, damagedQty, unitPrice, taxRate, lineTotal,
      body.serialNumbers || null,
      body.batchNumber || null,
      body.lotNumber || null,
      body.expiryDate || null,
      ['GOOD','DAMAGED','REJECTED'].includes(body.condition) ? body.condition : null,
      body.notes || null,
      lineId, id, g.organizationId,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_LINE_UPDATED',
    entityType: 'GoodsReceipt',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated line ' + existing.lineNumber,
    metadata: { lineId },
  })

  return NextResponse.json({ line: upd.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/goods-receipts/[id]/lines/[lineId]
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params

  const chk = await assertDraftAndOwned(id, lineId, g.organizationId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  await pool.query(
    `DELETE FROM "GoodsReceiptLine"
     WHERE id = $1 AND "goodsReceiptId" = $2 AND "organizationId" = $3`,
    [lineId, id, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_LINE_REMOVED',
    entityType: 'GoodsReceipt',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed line ' + chk.line.lineNumber,
    metadata: { lineId },
  })

  return NextResponse.json({ ok: true })
})