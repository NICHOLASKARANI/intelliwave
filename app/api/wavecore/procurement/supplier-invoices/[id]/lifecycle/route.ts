export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const ALLOWED: Record<string, string[]> = {
  APPROVE: ['SUBMITTED', 'MATCHED', 'PARTIAL_MATCH', 'MISMATCH'],
  REJECT:  ['SUBMITTED', 'MATCHED', 'PARTIAL_MATCH', 'MISMATCH', 'APPROVED'],
  PAID:    ['APPROVED'],
  CANCEL:  ['DRAFT', 'SUBMITTED', 'MATCHED', 'PARTIAL_MATCH', 'MISMATCH', 'APPROVED', 'REJECTED'],
}

const NEW_STATUS: Record<string, string> = {
  APPROVE: 'APPROVED',
  REJECT:  'REJECTED',
  PAID:    'PAID',
  CANCEL:  'CANCELLED',
}

/**
 * POST /api/wavecore/procurement/supplier-invoices/[id]/lifecycle
 * Body: { action*, reason?, paymentReference? }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = String(body?.action || '').toUpperCase()
  if (!Object.keys(ALLOWED).includes(action)) {
    return NextResponse.json({ error: 'action must be APPROVE | REJECT | PAID | CANCEL' }, { status: 400 })
  }

  const invRes = await pool.query(
    `SELECT * FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (invRes.rowCount === 0) {
    return NextResponse.json({ error: 'Supplier invoice not found' }, { status: 404 })
  }
  const inv = invRes.rows[0]

  if (!ALLOWED[action].includes(inv.status)) {
    return NextResponse.json({
      error: `Cannot ${action} invoice in status ${inv.status}`,
    }, { status: 409 })
  }

  const newStatus = NEW_STATUS[action]
  const reason = body?.reason ? String(body.reason).slice(0, 2000) : null
  const paymentReference = body?.paymentReference ? String(body.paymentReference).slice(0, 200) : null

  // Build update
  const sets: string[] = ['status = $1', '"updatedAt" = NOW()']
  const values: any[] = [newStatus]

  if (action === 'APPROVE') {
    values.push(g.userId); sets.push(`"approvedBy" = $${values.length}`)
    values.push(g.userName); sets.push(`"approvedByName" = $${values.length}`)
    sets.push(`"approvedAt" = NOW()`)
  } else if (action === 'PAID') {
    sets.push(`"paidAt" = NOW()`)
    if (paymentReference) {
      values.push(paymentReference); sets.push(`"paymentReference" = $${values.length}`)
    }
  } else if (action === 'REJECT' || action === 'CANCEL') {
    if (reason) {
      values.push(reason); sets.push(`"matchNotes" = COALESCE("matchNotes", '') || E'\n' || $${values.length}`)
    }
  }

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

  const eventType =
    action === 'APPROVE' ? 'SUPPLIER_INVOICE_APPROVED'
    : action === 'REJECT' ? 'SUPPLIER_INVOICE_REJECTED'
    : action === 'PAID'   ? 'SUPPLIER_INVOICE_PAID'
    :                        'SUPPLIER_INVOICE_CANCELLED'

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType,
    entityType: 'SupplierInvoice',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: `${action} invoice ${inv.invoiceNumber}`,
    metadata: { reason, paymentReference, fromStatus: inv.status, toStatus: newStatus },
  })

  return NextResponse.json({ ok: true, supplierInvoice: upd.rows[0] })
})