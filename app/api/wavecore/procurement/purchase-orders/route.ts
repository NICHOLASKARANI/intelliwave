export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { nextProcurementNumber } from '@/lib/wavecore/procurement-numbering'
import { PO_TYPES } from '@/lib/wavecore/procurement-po'

/**
 * GET /api/wavecore/procurement/purchase-orders
 * Query:
 *   q             — search number / supplierName / notes
 *   status        — DRAFT | SUBMITTED | APPROVED | ...
 *   supplierId    — filter by supplier
 *   requisitionId — filter by source requisition
 *   limit, offset, sort, order
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const q             = (searchParams.get('q') || '').trim()
  const status        = searchParams.get('status')
  const supplierId    = searchParams.get('supplierId')
  const requisitionId = searchParams.get('requisitionId')
  const sort          = searchParams.get('sort') || 'createdAt'
  const order         = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit         = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset        = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['po."organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(po.number ILIKE $' + n + ' OR po."supplierName" ILIKE $' + n + ' OR po.notes ILIKE $' + n + ')')
  }
  if (status)        { params.push(status);        where.push('po.status = $' + params.length) }
  if (supplierId)    { params.push(supplierId);    where.push('po."supplierId" = $' + params.length) }
  if (requisitionId) { params.push(requisitionId); where.push('po."requisitionId" = $' + params.length) }

  const sortCol: Record<string, string> = {
    createdAt: 'po."createdAt"',
    date: 'po.date',
    total: 'po.total',
    status: 'po.status',
  }
  const sortSQL = sortCol[sort] || 'po."createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "PurchaseOrder" po WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT
       po.id, po.number, po.date, po.status, po.type,
       po.subtotal, po."taxAmount", po.total, po.amount,
       po.currency, po."paymentTerms",
       po."supplierId", po."supplierName",
       po."requisitionId",
       po."deliveryDate", po."deliveryLocation",
       po."sentAt", po."acknowledgedAt",
       po."approvedAt", po."rejectedAt", po."rejectionReason",
       po."currentApprovalStep", po."totalApprovalSteps",
       po."closedAt", po.notes,
       po."createdAt", po."updatedAt",
       (SELECT COUNT(*)::int FROM "PurchaseOrderItem" poi
          WHERE poi."purchaseOrderId" = po.id) AS "linesCount",
       (SELECT COUNT(*)::int FROM "PurchaseOrderItem" poi
          WHERE poi."purchaseOrderId" = po.id
            AND COALESCE(poi."receivedQty", 0) >= COALESCE(poi.quantity, 0)) AS "fullyReceivedLines"
     FROM "PurchaseOrder" po
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    purchaseOrders: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/purchase-orders
 * Body: {
 *   supplierId*:        string
 *   supplierName?:      string  (denormalized; auto-filled from supplier if omitted)
 *   type?:              STANDARD | BLANKET | ... (default STANDARD)
 *   requisitionId?:     string
 *   currency?:          string  (default KES)
 *   paymentTerms?:      number  (default 30)
 *   deliveryDate?:      ISO date
 *   deliveryLocation?:  string
 *   incoterms?:         string
 *   notes?:             string
 *   lines?:             Array<{
 *     description*, quantity*, unitPrice?, taxRate?,
 *     unitOfMeasure?, productId?, specifications?
 *   }>
 * }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supplierId = String(body?.supplierId || '').trim()
  if (!supplierId) return NextResponse.json({ error: 'supplierId is required' }, { status: 400 })

  // Verify supplier belongs to org
  const supRes = await pool.query(
    `SELECT id, name, "legalName", currency, "paymentTerms" FROM "Supplier"
     WHERE id = $1 AND "organizationId" = $2`,
    [supplierId, g.organizationId]
  )
  if (supRes.rowCount === 0) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  const supplier = supRes.rows[0]

  const supplierName = String(body?.supplierName || supplier.name || '').trim() || supplier.name

  // Validate optional requisition link
  const requisitionId = body?.requisitionId ? String(body.requisitionId) : null
  if (requisitionId) {
    const rqRes = await pool.query(
      `SELECT id, status FROM "PurchaseRequisition"
       WHERE id = $1 AND "organizationId" = $2`,
      [requisitionId, g.organizationId]
    )
    if (rqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
    if (rqRes.rows[0].status !== 'APPROVED') {
      return NextResponse.json({
        error: 'Requisition must be APPROVED to convert to PO (current: ' + rqRes.rows[0].status + ')',
      }, { status: 409 })
    }
  }

  // Validate lines
  const rawLines = Array.isArray(body?.lines) ? body.lines : []
  if (rawLines.length > 500) return NextResponse.json({ error: 'Too many lines (max 500)' }, { status: 400 })

  const lines: any[] = []
  let subtotal = 0
  let taxTotal = 0
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i]
    const desc = String(l?.description || '').trim()
    if (!desc) return NextResponse.json({ error: 'Line ' + (i+1) + ': description required' }, { status: 400 })
    const qty = Number(l?.quantity)
    if (!Number.isFinite(qty) || qty <= 0) return NextResponse.json({ error: 'Line ' + (i+1) + ': quantity must be > 0' }, { status: 400 })
    const price = Number(l?.unitPrice) || 0
    const taxRate = Number(l?.taxRate) || 0
    const lineSub = qty * price
    const lineTax = lineSub * (taxRate / 100)
    const lineTotal = lineSub + lineTax
    subtotal += lineSub
    taxTotal += lineTax
    lines.push({
      lineNumber: i + 1,
      description: desc,
      productId: l?.productId || null,
      quantity: qty,
      unitOfMeasure: l?.unitOfMeasure || 'UNIT',
      unitPrice: price,
      taxRate,
      lineTotal,
      specifications: l?.specifications || null,
    })
  }
  const total = subtotal + taxTotal

  // Generate PO number
  let number: string
  try {
    number = await nextProcurementNumber(pool, g.organizationId, 'PO')
  } catch (err) {
    console.error('[po] numbering failed:', (err as Error).message)
    return NextResponse.json({ error: 'Numbering table missing. Run procurement-numbering.sql first.' }, { status: 500 })
  }

  const type = PO_TYPES.includes(body?.type) ? body.type : 'STANDARD'
  const crypto = require('crypto')
  const id = crypto.randomUUID()

  // Insert PO
  const poRes = await pool.query(
    `INSERT INTO "PurchaseOrder"
       (id, "organizationId", number, date, status, type,
        subtotal, "taxAmount", total, amount,
        "supplierId", "supplierName", "requisitionId",
        currency, "paymentTerms",
        "deliveryDate", "deliveryLocation", incoterms,
        notes,
        "currentApprovalStep", "totalApprovalSteps",
        "createdBy", "createdByName",
        "createdAt", "updatedAt")
     VALUES ($1,$2,$3,NOW(),'DRAFT',$4,
             $5,$6,$7,$7,
             $8,$9,$10,
             $11,$12,
             $13,$14,$15,
             $16,
             0,0,
             $17,$18,
             NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, number, type,
      subtotal, taxTotal, total,
      supplierId, supplierName, requisitionId,
      body?.currency || 'KES',
      Number.isFinite(Number(body?.paymentTerms)) ? Number(body.paymentTerms) : (supplier.paymentTerms || 30),
      body?.deliveryDate || null,
      body?.deliveryLocation || null,
      body?.incoterms || null,
      body?.notes || null,
      g.userId, g.userName,
    ]
  )
  const po = poRes.rows[0]

  // Insert lines
  const insertedLines: any[] = []
  for (const l of lines) {
    const lineId = crypto.randomUUID()
    const r = await pool.query(
      `INSERT INTO "PurchaseOrderItem"
         (id, "organizationId", "purchaseOrderId", "lineNumber", description,
          "productId", quantity, "unitOfMeasure", "unitPrice", "taxRate",
          total, "receivedQty", "invoicedQty", specifications, "createdAt")
       VALUES ($1,$2,$3,$4,$5,
               $6,$7,$8,$9,$10,
               $11,0,0,$12,NOW())
       RETURNING *`,
      [
        lineId, g.organizationId, id, l.lineNumber, l.description,
        l.productId, l.quantity, l.unitOfMeasure, l.unitPrice, l.taxRate,
        l.lineTotal, l.specifications,
      ]
    )
    insertedLines.push(r.rows[0])
  }

  // If linked to requisition, mark requisition CONVERTED
  if (requisitionId) {
    await pool.query(
      `UPDATE "PurchaseRequisition"
       SET status = 'CONVERTED', "convertedToPOId" = $3, "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [requisitionId, g.organizationId, id]
    )
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_CREATED',
    entityType: 'PurchaseOrder',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created ' + number + ' for ' + supplierName,
    metadata: {
      supplierId, supplierName, type, total,
      linesCount: insertedLines.length,
      requisitionId,
    },
  })

  return NextResponse.json({
    purchaseOrder: po,
    lines: insertedLines,
  }, { status: 201 })
})