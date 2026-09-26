export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/supplier-invoices/[id]
 * Returns: invoice header + lines + PO summary + GRN summary + supplier
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const invRes = await pool.query(
    `SELECT * FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (invRes.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier invoice not found' }, { status: 404 })
  }
  const invoice = invRes.rows[0]

  const [linesRes, poRes, grnRes, supplierRes] = await Promise.all([
    pool.query(
      `SELECT * FROM "SupplierInvoiceLine"
       WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2
       ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
      [id, g.organizationId]
    ),
    invoice.purchaseOrderId
      ? pool.query(
          `SELECT id, number, status, "supplierName", currency, subtotal,
                  "taxAmount", total, amount, "deliveryDate", "createdAt"
           FROM "PurchaseOrder"
           WHERE id = $1 AND "organizationId" = $2`,
          [invoice.purchaseOrderId, g.organizationId]
        )
      : Promise.resolve({ rows: [] }),
    invoice.goodsReceiptId
      ? pool.query(
          `SELECT id, "grnNumber", status, "receivedAt", "totalReceived"
           FROM "GoodsReceipt"
           WHERE id = $1 AND "organizationId" = $2`,
          [invoice.goodsReceiptId, g.organizationId]
        )
      : Promise.resolve({ rows: [] }),
    invoice.supplierId
      ? pool.query(
          `SELECT id, name, "legalName", email, phone, address, city, country, "taxPin"
           FROM "Supplier"
           WHERE id = $1`,
          [invoice.supplierId]
        )
      : Promise.resolve({ rows: [] }),
  ])

  return NextResponse.json({
    supplierInvoice: invoice,
    lines: linesRes.rows,
    purchaseOrder: poRes.rows[0] || null,
    goodsReceipt: grnRes.rows[0] || null,
    supplier: supplierRes.rows[0] || null,
  })
})

/**
 * PATCH /api/wavecore/procurement/supplier-invoices/[id]
 * Only editable while DRAFT.
 * Editable: supplierInvoiceRef, invoiceDate, dueDate, currency, notes.
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const existing = await pool.query(
    `SELECT status FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (existing.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier invoice not found' }, { status: 404 })
  }
  if (existing.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT invoices can be edited' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const editable: Record<string, string> = {
    supplierInvoiceRef: 'supplierInvoiceRef',
    invoiceDate: 'invoiceDate',
    dueDate: 'dueDate',
    currency: 'currency',
    notes: 'notes',
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
    `UPDATE "SupplierInvoice" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_UPDATED',
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated invoice header',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ supplierInvoice: upd.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/supplier-invoices/[id]
 * Only while DRAFT. Cascade-deletes lines.
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const existing = await pool.query(
    `SELECT status, "invoiceNumber" FROM "SupplierInvoice"
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (existing.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier invoice not found' }, { status: 404 })
  }
  if (existing.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT invoices can be deleted' }, { status: 409 })
  }

  await pool.query(
    `DELETE FROM "SupplierInvoiceLine" WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  await pool.query(
    `DELETE FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_DELETED',
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted invoice ' + existing.rows[0].invoiceNumber,
    metadata: { invoiceNumber: existing.rows[0].invoiceNumber },
  })

  return NextResponse.json({ ok: true })
})