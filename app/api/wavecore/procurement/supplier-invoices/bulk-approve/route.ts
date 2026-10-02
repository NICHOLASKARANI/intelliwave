export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/supplier-invoices/bulk-approve
 * Body: { ids: string[] }
 *
 * Approves multiple supplier invoices in one call. Uses the exact same
 * allowed transitions as the single-invoice lifecycle endpoint
 * (APPROVE from SUBMITTED / MATCHED / PARTIAL_MATCH / MISMATCH).
 * Writes the same columns (approvedBy, approvedByName, approvedAt),
 * logs one SUPPLIER_INVOICE_APPROVED event per invoice. Tenant-scoped.
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }
  if (body.ids.length > 200) {
    return NextResponse.json({ error: 'Too many ids (max 200 per call)' }, { status: 400 })
  }

  const ids: string[] = body.ids.map((x: any) => String(x)).filter(Boolean)
  if (ids.length === 0) return NextResponse.json({ error: 'No valid ids' }, { status: 400 })

  const APPROVABLE = ['SUBMITTED', 'MATCHED', 'PARTIAL_MATCH', 'MISMATCH']

  // Load the candidate rows, scoped to this org
  const current = await pool.query(
    `SELECT id, "invoiceNumber", status FROM "SupplierInvoice"
     WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
    [g.organizationId, ids]
  )

  const foundIds = new Set(current.rows.map((r: any) => r.id))
  const notInOrg = ids.filter(i => !foundIds.has(i))

  const approvableRows = current.rows.filter((r: any) => APPROVABLE.includes(r.status))
  const wrongStatus = current.rows
    .filter((r: any) => !APPROVABLE.includes(r.status))
    .map((r: any) => ({ id: r.id, invoiceNumber: r.invoiceNumber, status: r.status }))

  const approvableIds: string[] = approvableRows.map((r: any) => r.id)

  if (approvableIds.length === 0) {
    return NextResponse.json({
      approved: 0,
      skipped: wrongStatus.length + notInOrg.length,
      wrongStatus,
      notInOrg,
      message: 'No invoices in an approvable status',
    })
  }

  // Single UPDATE — same columns as the lifecycle endpoint
  const upd = await pool.query(
    `UPDATE "SupplierInvoice"
     SET status = 'APPROVED',
         "approvedBy" = $2,
         "approvedByName" = $3,
         "approvedAt" = NOW(),
         "updatedAt" = NOW()
     WHERE "organizationId" = $1 AND id = ANY($4::text[])
     RETURNING id, "invoiceNumber"`,
    [g.organizationId, g.userId, g.userName, approvableIds]
  )

  const approved = upd.rowCount || 0

  // One event per approved invoice (same eventType as single-approve)
  await Promise.all(upd.rows.map((r: any) =>
    logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'SUPPLIER_INVOICE_APPROVED',
      entityType: 'SupplierInvoice',
      entityId: r.id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Bulk approved ' + (r.invoiceNumber || r.id),
      metadata: { bulk: true, fromStatus: current.rows.find((x: any) => x.id === r.id)?.status, toStatus: 'APPROVED' },
    })
  ))

  return NextResponse.json({
    approved,
    skipped: wrongStatus.length + notInOrg.length,
    approvedIds: upd.rows.map((r: any) => r.id),
    wrongStatus,
    notInOrg,
  })
})