export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraftAndOwned(orgId: string, invId: string, lineId: string) {
  const invRes = await pool.query(
    `SELECT status FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [invId, orgId]
  )
  if (invRes.rowCount === 0) return { ok: false, code: 404, error: 'Supplier invoice not found' }
  if (invRes.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Only DRAFT invoices can be edited' }

  const lineRes = await pool.query(
    `SELECT * FROM "SupplierInvoiceLine"
     WHERE id = $1 AND "supplierInvoiceId" = $2 AND "organizationId" = $3`,
    [lineId, invId, orgId]
  )
  if (lineRes.rowCount === 0) return { ok: false, code: 404, error: 'Line not found' }
  return { ok: true, line: lineRes.rows[0] }
}

async function recalcTotals(orgId: string, invId: string) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(quantity * "unitPrice"), 0)::numeric AS sub,
            COALESCE(SUM(quantity * "unitPrice" * ("taxRate" / 100)), 0)::numeric AS tax
     FROM "SupplierInvoiceLine"
     WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2`,
    [invId, orgId]
  )
  const sub = Number(r.rows[0]?.sub || 0)
  const tax = Number(r.rows[0]?.tax || 0)
  const total = sub + tax
  await pool.query(
    `UPDATE "SupplierInvoice"
     SET subtotal = $1, "taxAmount" = $2, total = $3, "updatedAt" = NOW()
     WHERE id = $4 AND "organizationId" = $5`,
    [sub, tax, total, invId, orgId]
  )
  return { sub, tax, total }
}

/**
 * PATCH /api/wavecore/procurement/supplier-invoices/[id]/lines/[lineId]
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params

  const chk = await assertDraftAndOwned(g.organizationId, id, lineId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })
  const existing = chk.line

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const qty = 'quantity' in body ? Number(body.quantity) : Number(existing.quantity)
  const price = 'unitPrice' in body ? Number(body.unitPrice) : Number(existing.unitPrice)
  const tax = 'taxRate' in body ? Number(body.taxRate) : Number(existing.taxRate)
  if (!Number.isFinite(qty) || qty < 0) return NextResponse.json({ error: 'quantity must be >= 0' }, { status: 400 })
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'unitPrice must be >= 0' }, { status: 400 })
  const lineTotal = qty * price * (1 + tax / 100)

  const upd = await pool.query(
    `UPDATE "SupplierInvoiceLine" SET
       description           = COALESCE($1, description),
       "purchaseOrderItemId" = COALESCE($2, "purchaseOrderItemId"),
       "goodsReceiptLineId"  = COALESCE($3, "goodsReceiptLineId"),
       quantity              = $4,
       "unitPrice"           = $5,
       "taxRate"             = $6,
       "lineTotal"           = $7,
       notes                 = COALESCE($8, notes),
       "updatedAt"           = NOW()
     WHERE id = $9 AND "supplierInvoiceId" = $10 AND "organizationId" = $11
     RETURNING *`,
    [
      body.description || null,
      body.purchaseOrderItemId || null,
      body.goodsReceiptLineId || null,
      qty, price, tax, lineTotal,
      body.notes || null,
      lineId, id, g.organizationId,
    ]
  )

  const totals = await recalcTotals(g.organizationId, id)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_LINE_UPDATED',
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated line ' + existing.lineNumber,
    metadata: { lineId, totals },
  })

  return NextResponse.json({ line: upd.rows[0], totals })
})

/**
 * DELETE /api/wavecore/procurement/supplier-invoices/[id]/lines/[lineId]
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params

  const chk = await assertDraftAndOwned(g.organizationId, id, lineId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  await pool.query(
    `DELETE FROM "SupplierInvoiceLine"
     WHERE id = $1 AND "supplierInvoiceId" = $2 AND "organizationId" = $3`,
    [lineId, id, g.organizationId]
  )

  const totals = await recalcTotals(g.organizationId, id)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_LINE_REMOVED',
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed line ' + chk.line.lineNumber,
    metadata: { lineId, totals },
  })

  return NextResponse.json({ ok: true, totals })
})