export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { nextProcurementNumber } from '@/lib/wavecore/procurement-numbering'
import { PO_TYPES } from '@/lib/wavecore/procurement-po'

/**
 * GET /api/wavecore/procurement/purchase-orders/from-requisition/[requisitionId]
 *
 * Returns a preview payload with:
 *   - requisition header
 *   - candidate PO lines (from requisition lines)
 *   - suggested supplierId (from first preferredSupplierId found, else null)
 *   - list of suggested suppliers (distinct from line preferredSupplierIds)
 *
 * Requires requisition status = APPROVED.
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { requisitionId: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const reqId = ctx.params.requisitionId

  const reqRes = await pool.query(
    `SELECT * FROM "PurchaseRequisition"
     WHERE id = $1 AND "organizationId" = $2`,
    [reqId, g.organizationId]
  )
  if (reqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  const req = reqRes.rows[0]
  if (req.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Requisition must be APPROVED (current: ' + req.status + ')' }, { status: 409 })
  }

  const linesRes = await pool.query(
    `SELECT * FROM "PurchaseRequisitionLine"
     WHERE "requisitionId" = $1 AND "organizationId" = $2
     ORDER BY "lineNumber" ASC`,
    [reqId, g.organizationId]
  )

  // Suggested suppliers: distinct preferredSupplierIds
  const supplierIds = Array.from(new Set(
    linesRes.rows
      .map((l: any) => l.preferredSupplierId)
      .filter((id: any) => id && typeof id === 'string')
  )) as string[]

  let suppliers: any[] = []
  if (supplierIds.length > 0) {
    const sRes = await pool.query(
      `SELECT id, name, "legalName", currency, "paymentTerms", status FROM "Supplier"
       WHERE id = ANY($1::text[]) AND "organizationId" = $2 AND status = 'ACTIVE'`,
      [supplierIds, g.organizationId]
    )
    suppliers = sRes.rows
  }

  const suggestedSupplierId = suppliers[0]?.id || null

  return NextResponse.json({
    requisition: req,
    candidateLines: linesRes.rows,
    suggestedSupplierId,
    suggestedSuppliers: suppliers,
  })
})

/**
 * POST /api/wavecore/procurement/purchase-orders/from-requisition/[requisitionId]
 *
 * Converts an approved requisition into a Purchase Order.
 * Body: {
 *   supplierId*:        string
 *   lineIds?:           string[]  // subset of requisition line ids; omit = all
 *   type?:              STANDARD | ...
 *   currency?:          string
 *   paymentTerms?:      number
 *   deliveryDate?:      ISO date
 *   deliveryLocation?:  string
 *   incoterms?:         string
 *   notes?:             string
 * }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { requisitionId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const reqId = ctx.params.requisitionId

  const reqRes = await pool.query(
    `SELECT * FROM "PurchaseRequisition"
     WHERE id = $1 AND "organizationId" = $2`,
    [reqId, g.organizationId]
  )
  if (reqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  const req = reqRes.rows[0]
  if (req.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Requisition must be APPROVED (current: ' + req.status + ')' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supplierId = String(body?.supplierId || '').trim()
  if (!supplierId) return NextResponse.json({ error: 'supplierId is required' }, { status: 400 })

  const supRes = await pool.query(
    `SELECT id, name, currency, "paymentTerms" FROM "Supplier"
     WHERE id = $1 AND "organizationId" = $2`,
    [supplierId, g.organizationId]
  )
  if (supRes.rowCount === 0) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  const supplier = supRes.rows[0]
  const supplierName = supplier.name

  const selectedIds: string[] = Array.isArray(body?.lineIds) ? body.lineIds.map(String) : []

  const whereLine = ['"requisitionId" = $1', '"organizationId" = $2']
  const paramsLine: any[] = [reqId, g.organizationId]
  if (selectedIds.length > 0) {
    paramsLine.push(selectedIds)
    whereLine.push('id = ANY($' + paramsLine.length + '::text[])')
  }

  const linesRes = await pool.query(
    `SELECT * FROM "PurchaseRequisitionLine"
     WHERE ${whereLine.join(' AND ')}
     ORDER BY "lineNumber" ASC`,
    paramsLine
  )
  if (linesRes.rowCount === 0) {
    return NextResponse.json({ error: 'No matching requisition lines to convert' }, { status: 400 })
  }

  // Compute totals
  let subtotal = 0
  let taxTotal = 0
  const poLines: any[] = []
  for (let i = 0; i < linesRes.rows.length; i++) {
    const rl = linesRes.rows[i]
    const qty = Number(rl.quantity)
    const price = Number(rl.unitPrice)
    const taxRate = Number(rl.taxRate || 0)
    const lineSub = qty * price
    const lineTax = lineSub * (taxRate / 100)
    const lineTotal = lineSub + lineTax
    subtotal += lineSub
    taxTotal += lineTax
    poLines.push({
      lineNumber: i + 1,
      description: rl.description,
      productId: rl.productId || null,
      quantity: qty,
      unitOfMeasure: rl.unitOfMeasure || 'UNIT',
      unitPrice: price,
      taxRate,
      total: lineTotal,
      specifications: rl.specifications || null,
    })
  }
  const total = subtotal + taxTotal

  let number: string
  try {
    number = await nextProcurementNumber(pool, g.organizationId, 'PO')
  } catch (err) {
    return NextResponse.json({ error: 'Numbering table missing' }, { status: 500 })
  }

  const type = PO_TYPES.includes(body?.type) ? body.type : 'STANDARD'
  const crypto = require('crypto')
  const poId = crypto.randomUUID()

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
      poId, g.organizationId, number, type,
      subtotal, taxTotal, total,
      supplierId, supplierName, reqId,
      body?.currency || req.currency || 'KES',
      Number.isFinite(Number(body?.paymentTerms)) ? Number(body.paymentTerms) : (supplier.paymentTerms || 30),
      body?.deliveryDate || null,
      body?.deliveryLocation || null,
      body?.incoterms || null,
      body?.notes || ('Auto-converted from requisition ' + req.requisitionNumber),
      g.userId, g.userName,
    ]
  )

  const insertedLines: any[] = []
  for (const l of poLines) {
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
        lineId, g.organizationId, poId, l.lineNumber, l.description,
        l.productId, l.quantity, l.unitOfMeasure, l.unitPrice, l.taxRate,
        l.total, l.specifications,
      ]
    )
    insertedLines.push(r.rows[0])
  }

  // Mark requisition CONVERTED
  await pool.query(
    `UPDATE "PurchaseRequisition"
     SET status = 'CONVERTED', "convertedToPOId" = $3, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [reqId, g.organizationId, poId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_CREATED_FROM_REQUISITION',
    entityType: 'PurchaseOrder',
    entityId: poId,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created ' + number + ' from requisition ' + req.requisitionNumber,
    metadata: {
      requisitionId: reqId,
      requisitionNumber: req.requisitionNumber,
      supplierId, supplierName, type, total,
      linesCount: insertedLines.length,
    },
  })

  return NextResponse.json({
    purchaseOrder: poRes.rows[0],
    lines: insertedLines,
  }, { status: 201 })
})