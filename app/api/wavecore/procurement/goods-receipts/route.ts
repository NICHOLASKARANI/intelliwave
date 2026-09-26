export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { nextProcurementNumber } from '@/lib/wavecore/procurement-numbering'

/**
 * GET /api/wavecore/procurement/goods-receipts
 * Query: q, status, purchaseOrderId, limit, offset, sort, order
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status')
  const poId = searchParams.get('purchaseOrderId')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['gr."organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(gr."grnNumber" ILIKE $' + n + ' OR gr."deliveryNoteNumber" ILIKE $' + n + ' OR gr.notes ILIKE $' + n + ')')
  }
  if (status) { params.push(status); where.push('gr.status = $' + params.length) }
  if (poId)   { params.push(poId);   where.push('gr."purchaseOrderId" = $' + params.length) }

  const sortCol: Record<string, string> = {
    createdAt: 'gr."createdAt"',
    receivedAt: 'gr."receivedAt"',
    status: 'gr.status',
  }
  const sortSQL = sortCol[sort] || 'gr."createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "GoodsReceipt" gr WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT
       gr.id, gr."grnNumber", gr."purchaseOrderId", gr.status,
       gr."receivedAt", gr."receivedByName", gr."deliveryNoteNumber",
       gr."warehouseId", gr."locationId",
       gr.currency, gr."totalReceived", gr."hasVariance",
       gr.notes, gr."createdAt", gr."updatedAt",
       po.number AS "poNumber",
       po."supplierName" AS "supplierName",
       (SELECT COUNT(*)::int FROM "GoodsReceiptLine" l
          WHERE l."goodsReceiptId" = gr.id) AS "linesCount"
     FROM "GoodsReceipt" gr
     LEFT JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    goodsReceipts: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/goods-receipts
 * Body: {
 *   purchaseOrderId*:   string
 *   deliveryNoteNumber?: string
 *   vehicleNumber?:     string
 *   driverName?:        string
 *   warehouseId?:       string
 *   locationId?:        string
 *   receivedAt?:        ISO date (default: NOW)
 *   notes?:             string
 *   lines?:             Array<{
 *     purchaseOrderItemId*: string
 *     receivedQty*: number
 *     rejectedQty?: number
 *     damagedQty?: number
 *     unitPrice?: number
 *     taxRate?: number
 *     productId?: string
 *     unitOfMeasure?: string
 *     batchNumber?: string
 *     lotNumber?: string
 *     expiryDate?: ISO date
 *     serialNumbers?: string
 *     condition?: GOOD | DAMAGED | REJECTED
 *     notes?: string
 *   }>
 * }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const poId = String(body?.purchaseOrderId || '').trim()
  if (!poId) return NextResponse.json({ error: 'purchaseOrderId is required' }, { status: 400 })

  const poRes = await pool.query(
    `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [poId, g.organizationId]
  )
  if (poRes.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  const po = poRes.rows[0]

  // Reject POs that can't receive goods
  const receivableStatuses = ['APPROVED', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED']
  if (!receivableStatuses.includes(po.status)) {
    return NextResponse.json({
      error: 'Cannot receive against PO in status ' + po.status + '. Must be APPROVED, SENT, ACKNOWLEDGED or PARTIALLY_RECEIVED.',
    }, { status: 409 })
  }

  const rawLines = Array.isArray(body?.lines) ? body.lines : []
  if (rawLines.length === 0) return NextResponse.json({ error: 'At least one line is required' }, { status: 400 })
  if (rawLines.length > 200) return NextResponse.json({ error: 'Too many lines (max 200)' }, { status: 400 })

  // Validate lines — verify each references a real PO item
  const lines: any[] = []
  let totalReceived = 0
  let hasVariance = false

  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i]
    const poItemId = String(l?.purchaseOrderItemId || '').trim()
    if (!poItemId) return NextResponse.json({ error: 'Line ' + (i+1) + ': purchaseOrderItemId required' }, { status: 400 })

    const poItemRes = await pool.query(
      `SELECT * FROM "PurchaseOrderItem"
       WHERE id = $1 AND "purchaseOrderId" = $2`,
      [poItemId, poId]
    )
    if (poItemRes.rowCount === 0) {
      return NextResponse.json({ error: 'Line ' + (i+1) + ': PO item not found' }, { status: 400 })
    }
    const poItem = poItemRes.rows[0]

    const receivedQty = Number(l?.receivedQty)
    if (!Number.isFinite(receivedQty) || receivedQty < 0) {
      return NextResponse.json({ error: 'Line ' + (i+1) + ': receivedQty must be >= 0' }, { status: 400 })
    }

    const orderedQty = Number(poItem.quantity || 0)
    const alreadyReceived = Number(poItem.receivedQty || 0)
    const rejectedQty = Number(l?.rejectedQty) || 0
    const damagedQty = Number(l?.damagedQty) || 0
    const unitPrice = Number(l?.unitPrice) || Number(poItem.unitPrice || 0)
    const taxRate = Number(l?.taxRate) || Number(poItem.taxRate || 0)
    const acceptedQty = Math.max(0, receivedQty - rejectedQty - damagedQty)
    const lineTotal = acceptedQty * unitPrice * (1 + taxRate / 100)

    if (alreadyReceived + receivedQty > orderedQty + 0.001) {
      hasVariance = true
    }

    totalReceived += lineTotal

    lines.push({
      purchaseOrderItemId: poItemId,
      productId: l?.productId || poItem.productId || null,
      unitOfMeasure: l?.unitOfMeasure || poItem.unitOfMeasure || 'UNIT',
      orderedQty,
      receivedQty,
      rejectedQty,
      damagedQty,
      unitPrice,
      taxRate,
      lineTotal,
      serialNumbers: l?.serialNumbers || null,
      batchNumber: l?.batchNumber || null,
      lotNumber: l?.lotNumber || null,
      expiryDate: l?.expiryDate || null,
      condition: ['GOOD','DAMAGED','REJECTED'].includes(l?.condition) ? l.condition : 'GOOD',
      notes: l?.notes || null,
    })
  }

  let grnNumber: string
  try {
    grnNumber = await nextProcurementNumber(pool, g.organizationId, 'GRN')
  } catch (err) {
    console.error('[grn] numbering failed:', (err as Error).message)
    return NextResponse.json({ error: 'Numbering table missing. Run procurement-numbering.sql first.' }, { status: 500 })
  }

  const crypto = require('crypto')
  const grnId = crypto.randomUUID()

  const grnRes = await pool.query(
    `INSERT INTO "GoodsReceipt"
       (id, "organizationId", "grnNumber", "purchaseOrderId", status,
        "receivedBy", "receivedByName", "receivedAt",
        "deliveryNoteNumber", "vehicleNumber", "driverName",
        "warehouseId", "locationId",
        currency, "totalReceived", "hasVariance", notes,
        "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,'DRAFT',
             $5,$6,COALESCE($7::timestamp, NOW()),
             $8,$9,$10,
             $11,$12,
             $13,$14,$15,$16,
             NOW(),NOW())
     RETURNING *`,
    [
      grnId, g.organizationId, grnNumber, poId,
      g.userId, g.userName, body?.receivedAt || null,
      body?.deliveryNoteNumber || null,
      body?.vehicleNumber || null,
      body?.driverName || null,
      body?.warehouseId || null,
      body?.locationId || null,
      po.currency || 'KES',
      totalReceived, hasVariance, body?.notes || null,
    ]
  )
  const grn = grnRes.rows[0]

  const insertedLines: any[] = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const lineId = crypto.randomUUID()
    const r = await pool.query(
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
        lineId, g.organizationId, grnId, l.purchaseOrderItemId,
        i + 1, 'Line ' + (i + 1), l.productId, l.unitOfMeasure,
        l.orderedQty, l.receivedQty, l.rejectedQty, l.damagedQty,
        l.unitPrice, l.taxRate, l.lineTotal,
        l.serialNumbers, l.batchNumber, l.lotNumber, l.expiryDate,
        l.condition, l.notes,
      ]
    )
    insertedLines.push(r.rows[0])
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'GOODS_RECEIPT_CREATED',
    entityType: 'GoodsReceipt',
    entityId: grnId,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created ' + grnNumber + ' against PO ' + po.number,
    metadata: {
      grnNumber, poId, poNumber: po.number,
      linesCount: insertedLines.length,
      hasVariance,
      totalReceived,
    },
  })

  return NextResponse.json({
    goodsReceipt: grn,
    lines: insertedLines,
  }, { status: 201 })
})