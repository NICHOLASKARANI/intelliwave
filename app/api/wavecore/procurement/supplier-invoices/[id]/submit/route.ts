export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/supplier-invoices/[id]/submit
 * DRAFT → SUBMITTED. Lines locked. Logs event.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const invRes = await pool.query(
    `SELECT * FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (invRes.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier invoice not found' }, { status: 404 })
  }
  const invoice = invRes.rows[0]
  if (invoice.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Invoice is already ' + invoice.status }, { status: 409 })
  }

  const lineCount = await pool.query(
    `SELECT COUNT(*)::int AS n FROM "SupplierInvoiceLine"
     WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if ((lineCount.rows[0]?.n || 0) === 0) {
    return NextResponse.json({ error: 'Cannot submit invoice with no lines' }, { status: 400 })
  }

  await pool.query(
    `UPDATE "SupplierInvoice"
     SET status = 'SUBMITTED', "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_INVOICE_SUBMITTED',
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Submitted invoice ' + invoice.invoiceNumber,
    metadata: { invoiceNumber: invoice.invoiceNumber, total: invoice.total },
  })

  return NextResponse.json({ ok: true, status: 'SUBMITTED' })
})