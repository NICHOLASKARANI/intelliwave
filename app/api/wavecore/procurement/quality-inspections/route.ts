export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/quality-inspections
 * Filters: q, status, goodsReceiptId, purchaseOrderId, limit, offset
 * Sort: createdAt (default desc) | inspectedAt | status
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status')
  const grnId = searchParams.get('goodsReceiptId')
  const poId  = searchParams.get('purchaseOrderId')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['qi."organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(qi.findings ILIKE $' + n + ' OR qi."inspectorName" ILIKE $' + n + ')')
  }
  if (status) { params.push(status); where.push('qi.status = $' + params.length) }
  if (grnId)  { params.push(grnId);  where.push('qi."goodsReceiptId" = $' + params.length) }
  if (poId)   { params.push(poId);   where.push('po.id = $' + params.length) }

  const sortCol: Record<string, string> = {
    createdAt: 'qi."createdAt"',
    inspectedAt: 'qi."inspectedAt"',
    status: 'qi.status',
  }
  const sortSQL = sortCol[sort] || 'qi."createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM "QualityInspection" qi
     LEFT JOIN "GoodsReceipt" gr ON gr.id = qi."goodsReceiptId"
     LEFT JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
     WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT
       qi.id, qi.status, qi."inspectorId", qi."inspectorName",
       qi."inspectedAt", qi."sampleSize", qi."passedQty", qi."failedQty",
       qi.findings, qi."correctiveAction",
       qi."goodsReceiptId", qi."goodsReceiptLineId", qi."purchaseOrderItemId",
       qi."createdAt", qi."updatedAt",
       gr."grnNumber" AS "grnNumber",
       po.id   AS "purchaseOrderId",
       po.number AS "poNumber",
       poi.description AS "poItemDescription"
     FROM "QualityInspection" qi
     LEFT JOIN "GoodsReceipt" gr ON gr.id = qi."goodsReceiptId"
     LEFT JOIN "PurchaseOrder" po ON po.id = gr."purchaseOrderId"
     LEFT JOIN "PurchaseOrderItem" poi ON poi.id = qi."purchaseOrderItemId"
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    inspections: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/quality-inspections
 * Manual creation — normally auto-created on GRN submit.
 * Body: { goodsReceiptLineId*, purchaseOrderItemId?, goodsReceiptId? }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const lineId = String(body?.goodsReceiptLineId || '').trim()
  if (!lineId) return NextResponse.json({ error: 'goodsReceiptLineId required' }, { status: 400 })

  const lineRes = await pool.query(
    `SELECT * FROM "GoodsReceiptLine"
     WHERE id = $1 AND "organizationId" = $2`,
    [lineId, g.organizationId]
  )
  if (lineRes.rowCount === 0) {
    return NextResponse.json({ error: 'Goods receipt line not found' }, { status: 404 })
  }
  const line = lineRes.rows[0]

  const existing = await pool.query(
    `SELECT id FROM "QualityInspection"
     WHERE "goodsReceiptLineId" = $1 AND "organizationId" = $2 LIMIT 1`,
    [lineId, g.organizationId]
  )
  if (existing.rowCount > 0) {
    return NextResponse.json({ error: 'Inspection already exists for this line' }, { status: 409 })
  }

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const ins = await pool.query(
    `INSERT INTO "QualityInspection"
       (id, "organizationId", "goodsReceiptId", "goodsReceiptLineId",
        "purchaseOrderItemId", status, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,'PENDING',NOW(),NOW())
     RETURNING *`,
    [
      id,
      g.organizationId,
      body?.goodsReceiptId || line.goodsReceiptId,
      lineId,
      body?.purchaseOrderItemId || line.purchaseOrderItemId,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'QUALITY_INSPECTION_CREATED',
    entityType: 'QualityInspection',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created inspection for GRN line ' + line.lineNumber,
    metadata: { goodsReceiptLineId: lineId },
  })

  return NextResponse.json({ inspection: ins.rows[0] }, { status: 201 })
})