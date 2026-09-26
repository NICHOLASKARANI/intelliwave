export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
// Local numbering helper for supplier invoices.
// Matches real ProcurementNumbering schema:
//   columns: id, organizationId, scope, prefix, year, counter, timestamps
async function nextSupplierInvoiceNumber(pool: any, organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const crypto = require('crypto')
  const id = crypto.randomUUID()

  // Try atomic increment first (row exists)
  const upd = await pool.query(
    `UPDATE "ProcurementNumbering"
     SET counter = counter + 1, "updatedAt" = NOW()
     WHERE "organizationId" = $1 AND scope = 'SINV' AND year = $2
     RETURNING counter, prefix`,
    [organizationId, year]
  )

  let seq: number
  let prefix = 'INV'

  if (upd.rowCount > 0) {
    seq = upd.rows[0].counter
    prefix = upd.rows[0].prefix || 'INV'
  } else {
    // Insert first row for this org/year
    const ins = await pool.query(
      `INSERT INTO "ProcurementNumbering"
         (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
       VALUES ($1, $2, 'SINV', 'INV', $3, 1, NOW(), NOW())
       RETURNING counter, prefix`,
      [id, organizationId, year]
    )
    seq = ins.rows[0].counter
    prefix = ins.rows[0].prefix || 'INV'
  }

  const padded = String(seq).padStart(4, '0')
  return `${prefix}-${year}-${padded}`
}

/**
 * GET /api/wavecore/procurement/supplier-invoices
 * Filters: q, status, matchStatus, purchaseOrderId, supplierId, limit, offset
 * Sort: createdAt (default desc) | invoiceDate | total
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status')
  const matchStatus = searchParams.get('matchStatus')
  const poId = searchParams.get('purchaseOrderId')
  const supplierId = searchParams.get('supplierId')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['si."organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(si."invoiceNumber" ILIKE $' + n + ' OR si."supplierInvoiceRef" ILIKE $' + n + ' OR si."supplierName" ILIKE $' + n + ' OR si.notes ILIKE $' + n + ')')
  }
  if (status) { params.push(status); where.push('si.status = $' + params.length) }
  if (matchStatus) { params.push(matchStatus); where.push('si."matchStatus" = $' + params.length) }
  if (poId) { params.push(poId); where.push('si."purchaseOrderId" = $' + params.length) }
  if (supplierId) { params.push(supplierId); where.push('si."supplierId" = $' + params.length) }

  const sortCol: Record<string, string> = {
    createdAt: 'si."createdAt"',
    invoiceDate: 'si."invoiceDate"',
    total: 'si.total',
    status: 'si.status',
  }
  const sortSQL = sortCol[sort] || 'si."createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "SupplierInvoice" si WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT
       si.id, si."invoiceNumber", si."supplierInvoiceRef",
       si."purchaseOrderId", si."goodsReceiptId", si."supplierId",
       si."supplierName", si."invoiceDate", si."dueDate",
       si.currency, si.subtotal, si."taxAmount", si.total,
       si.status, si."matchStatus", si."matchNotes",
       si."approvedAt", si."paidAt", si."paymentReference",
       si.notes, si."createdAt", si."updatedAt",
       po.number AS "poNumber",
       gr."grnNumber" AS "grnNumber",
       (SELECT COUNT(*)::int FROM "SupplierInvoiceLine" l
          WHERE l."supplierInvoiceId" = si.id) AS "linesCount"
     FROM "SupplierInvoice" si
     LEFT JOIN "PurchaseOrder" po ON po.id = si."purchaseOrderId"
     LEFT JOIN "GoodsReceipt" gr ON gr.id = si."goodsReceiptId"
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    supplierInvoices: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/supplier-invoices
 * Body: {
 *   supplierInvoiceRef?: string
 *   purchaseOrderId?: string
 *   goodsReceiptId?: string
 *   supplierId?: string
 *   invoiceDate?: ISO date
 *   dueDate?: ISO date
 *   currency?: string
 *   notes?: string
 *   lines?: Array<{
 *     description*: string
 *     purchaseOrderItemId?: string
 *     goodsReceiptLineId?: string
 *     quantity*: number
 *     unitPrice*: number
 *     taxRate?: number
 *   }>
 * }
 *
 * At least one of purchaseOrderId or supplierId is required.
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const poId = body?.purchaseOrderId ? String(body.purchaseOrderId).trim() : null
  const grnId = body?.goodsReceiptId ? String(body.goodsReceiptId).trim() : null
  const supplierIdInput = body?.supplierId ? String(body.supplierId).trim() : null

  if (!poId && !supplierIdInput) {
    return NextResponse.json({ error: 'At least one of purchaseOrderId or supplierId is required' }, { status: 400 })
  }

  // Validate PO if given
  let po: any = null
  if (poId) {
    const r = await pool.query(
      `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
      [poId, g.organizationId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    po = r.rows[0]
  }

  // Validate GRN if given
  if (grnId) {
    const r = await pool.query(
      `SELECT id FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
      [grnId, g.organizationId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
  }

  // Resolve supplier
  let supplierId = supplierIdInput
  let supplierName: string | null = null
  if (!supplierId && po?.supplierId) {
    supplierId = po.supplierId
  }
  if (supplierId) {
    const r = await pool.query(
      `SELECT id, name, "legalName" FROM "Supplier" WHERE id = $1`,
      [supplierId]
    )
    if (r.rowCount > 0) {
      supplierName = r.rows[0].name || r.rows[0].legalName || null
    }
  }
  if (!supplierName && po?.supplierName) supplierName = po.supplierName

  const rawLines = Array.isArray(body?.lines) ? body.lines : []
  if (rawLines.length === 0) {
    return NextResponse.json({ error: 'At least one line is required' }, { status: 400 })
  }
  if (rawLines.length > 200) {
    return NextResponse.json({ error: 'Too many lines (max 200)' }, { status: 400 })
  }

  // Compute totals + validate
  let subtotal = 0
  let taxAmount = 0
  const preparedLines: any[] = []
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i]
    const desc = String(l?.description || '').trim()
    if (!desc) return NextResponse.json({ error: 'Line ' + (i+1) + ': description required' }, { status: 400 })

    const qty = Number(l?.quantity)
    const price = Number(l?.unitPrice)
    if (!Number.isFinite(qty) || qty < 0) return NextResponse.json({ error: 'Line ' + (i+1) + ': quantity must be >= 0' }, { status: 400 })
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Line ' + (i+1) + ': unitPrice must be >= 0' }, { status: 400 })
    const tax = Number(l?.taxRate) || 0

    const lineSubtotal = qty * price
    const lineTax = lineSubtotal * (tax / 100)
    const lineTotal = lineSubtotal + lineTax

    subtotal += lineSubtotal
    taxAmount += lineTax

    preparedLines.push({
      lineNumber: i + 1,
      description: desc,
      purchaseOrderItemId: l?.purchaseOrderItemId ? String(l.purchaseOrderItemId) : null,
      goodsReceiptLineId: l?.goodsReceiptLineId ? String(l.goodsReceiptLineId) : null,
      quantity: qty,
      unitPrice: price,
      taxRate: tax,
      lineTotal,
      notes: l?.notes || null,
    })
  }
  const total = subtotal + taxAmount

  let invoiceNumber: string
  try {
    invoiceNumber = await nextSupplierInvoiceNumber(pool, g.organizationId)
  } catch (err) {
    console.error('[sinv] numbering failed:', (err as Error).message)
    return NextResponse.json({ error: 'Numbering table missing. Run procurement-invoice-extension.sql first.' }, { status: 500 })
  }

  const crypto = require('crypto')
  const invoiceId = crypto.randomUUID()

  const insRes = await pool.query(
    `INSERT INTO "SupplierInvoice"
       (id, "organizationId", "invoiceNumber", "supplierInvoiceRef",
        "purchaseOrderId", "goodsReceiptId", "supplierId", "supplierName",
        "invoiceDate", "dueDate", currency,
        subtotal, "taxAmount", total,
        status, "matchStatus",
        "receivedBy", "receivedByName", notes,
        "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,
             $5,$6,$7,$8,
             COALESCE($9::timestamp, NOW()), $10::timestamp, $11,
             $12, $13, $14,
             'DRAFT', 'UNMATCHED',
             $15, $16, $17,
             NOW(), NOW())
     RETURNING *`,
    [
      invoiceId, g.organizationId, invoiceNumber, body?.supplierInvoiceRef || null,
      poId, grnId, supplierId, supplierName,
      body?.invoiceDate || null, body?.dueDate || null, body?.currency || po?.currency || 'KES',
      subtotal, taxAmount, total,
      g.userId, g.userName, body?.notes || null,
    ]
  )
  const invoice = insRes.rows[0]

  const insertedLines: any[] = []
  for (const l of preparedLines) {
    const lineId = crypto.randomUUID()
    const r = await pool.query(
      `INSERT INTO "SupplierInvoiceLine"
         (id, "organizationId", "supplierInvoiceId",
          "lineNumber", description, "purchaseOrderItemId", "goodsReceiptLineId",
          quantity, "unitPrice", "taxRate", "lineTotal",
          "matchedQty", "matchedAmount", "matchStatus",
          notes, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,
               $4,$5,$6,$7,
               $8,$9,$10,$11,
               0,0,'UNMATCHED',
               $12,NOW(),NOW())
       RETURNING *`,
      [
        lineId, g.organizationId, invoiceId,
        l.lineNumber, l.description, l.purchaseOrderItemId, l.goodsReceiptLineId,
        l.quantity, l.unitPrice, l.taxRate, l.lineTotal,
        l.notes,
      ]
    )
    insertedLines.push(r.rows[0])
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_CREATED',
    entityType: 'SupplierInvoice',
    entityId: invoiceId,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created ' + invoiceNumber + (po ? ' against PO ' + po.number : ''),
    metadata: {
      invoiceNumber,
      purchaseOrderId: poId,
      goodsReceiptId: grnId,
      supplierId,
      linesCount: insertedLines.length,
      total,
    },
  })

  return NextResponse.json({ supplierInvoice: invoice, lines: insertedLines }, { status: 201 })
})