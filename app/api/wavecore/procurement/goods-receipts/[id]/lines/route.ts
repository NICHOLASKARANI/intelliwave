export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraft(grnId: string, orgId: string) {
  const r = await pool.query(
    `SELECT status FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
    [grnId, orgId]
  )
  if (r.rowCount === 0) return { ok: false, code: 404, error: 'Goods receipt not found' }
  if (r.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Only DRAFT goods receipts can be edited' }
  return { ok: true }
}

/**
 * GET /api/wavecore/procurement/goods-receipts/[id]/lines
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const r = await pool.query(
    `SELECT * FROM "GoodsReceiptLine"
     WHERE "goodsReceiptId" = $1 AND "organizationId" = $2
     ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
    [id, g.organizationId]
  )
  return NextResponse.json({ lines: r.rows })
})

/**
 * POST /api/wavecore/procurement/goods-receipts/[id]/lines
 * Body: {
 *   purchaseOrderItemId*, receivedQty*, rejectedQty?, damagedQty?,
 *   unitPrice?, taxRate?, productId?, unitOfMeasure?,
 *   batchNumber?, lotNumber?, expiryDate?, serialNumbers?,
 *   condition?, notes?
 * }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const chk = await assertDraft(id, g.organizationId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const poItemId = String(body?.purchaseOrderItemId || '').trim()
  if (!poItemId) return NextResponse.json({ error: 'purchaseOrderItemId required' }, { status: 400 })

  const grnRes = await pool.query(
    `SELECT "purchaseOrderId" FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  const poId = grnRes.rows[0].purchaseOrderId

  const poItemRes = await pool.query(
    `SELECT * FROM "PurchaseOrderItem" WHERE id = $1 AND "purchaseOrderId" = $2`,
    [poItemId, poId]
  )
  if (poItemRes.rowCount === 0) {
    return NextResponse.json({ error: 'PO item not found on this receipt\'s PO' }, { status: 400 })
  }
  const poItem = poItemRes.rows[0]

  const receivedQty = Number(body?.receivedQty)
  if (!Number.isFinite(receivedQty) || receivedQty < 0) {
    return NextResponse.json({ error: 'receivedQty must be >= 0' }, { status: 400 })
  }

  const rejectedQty = Number(body?.rejectedQty) || 0
  const damagedQty = Number(body?.damagedQty) || 0
  const unitPrice = Number(body?.unitPrice) || Number(poItem.unitPrice || 0)
  const taxRate = Number(body?.taxRate) || Number(poItem.taxRate || 0)
  const acceptedQty = Math.max(0, receivedQty - rejectedQty - damagedQty)
  const lineTotal = acceptedQty * unitPrice * (1 + taxRate / 100)

  const maxOrder = await pool.query(
    `SELECT COALESCE(MAX("lineNumber"), 0)::int AS maxno
     FROM "GoodsReceiptLine" WHERE "goodsReceiptId" = $1`,
    [id]
  )
  const nextNo = (maxOrder.rows[0]?.maxno || 0) + 1

  const crypto = require('crypto')
  const lineId = crypto.randomUUID()

  const ins = await pool.query(
    `INSERT INTO "GoodsReceiptLine"
       (id, "organizationId", "goodsReceiptId", "purchaseOrderItemId",
        "lineNumber", description, "productId", "unitOfMeasure",
        "orderedQty", "receivedQty", "rejectedQty", "damagedQty",
        "unitPrice", "taxRate", "lineTotal",
        "serialNumbers", "batchNumber", "lotNumber", "expiryDate",
        condition, notes, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,
             $5,$6,$7,$8,
             $9,$10,$11,$12,
             $13,$14,$15,
             $16,$17,$18,$19,
             $20,$21,NOW(),NOW())
     RETURNING *`,
    [
      lineId, g.organizationId, id, poItemId,
      nextNo, body?.description || poItem.description || 'Line ' + nextNo,
      body?.productId || poItem.productId || null,
      body?.unitOfMeasure || poItem.unitOfMeasure || 'UNIT',
      Number(poItem.quantity) || 0, receivedQty, rejectedQty, damagedQty,
      unitPrice, taxRate, lineTotal,
      body?.serialNumbers || null,
      body?.batchNumber || null,
      body?.lotNumber || null,
      body?.expiryDate || null,
      ['GOOD','DAMAGED','REJECTED'].includes(body?.condition) ? body.condition : 'GOOD',
      body?.notes || null,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_LINE_ADDED',
    entityType: 'GoodsReceipt',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added line ' + nextNo,
    metadata: { lineId, poItemId, receivedQty },
  })

  return NextResponse.json({ line: ins.rows[0] }, { status: 201 })
})