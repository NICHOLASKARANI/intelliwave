export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraft(orgId: string, runId: string) {
  const r = await pool.query(
    `SELECT status FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`,
    [runId, orgId]
  )
  if (r.rowCount === 0) return { ok: false, code: 404, error: 'Payment run not found' }
  if (r.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Only DRAFT runs can be edited' }
  return { ok: true }
}

async function recalcRun(orgId: string, runId: string) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total,
            COUNT(*)::int AS n
     FROM "PaymentRunLine"
     WHERE "paymentRunId" = $1 AND "organizationId" = $2`,
    [runId, orgId]
  )
  const total = Number(r.rows[0]?.total || 0)
  const n = r.rows[0]?.n || 0
  await pool.query(
    `UPDATE "PaymentRun"
     SET "totalAmount" = $1, "invoiceCount" = $2, "updatedAt" = NOW()
     WHERE id = $3 AND "organizationId" = $4`,
    [total, n, runId, orgId]
  )
  return { total, n }
}

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "PaymentRunLine"
     WHERE "paymentRunId" = $1 AND "organizationId" = $2
     ORDER BY "createdAt" ASC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ lines: r.rows })
})

/**
 * POST /api/wavecore/procurement/payment-runs/[id]/lines
 * Body: { supplierInvoiceIds: string[] }   (one or many)
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const chk = await assertDraft(g.organizationId, id)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const ids: string[] = Array.isArray(body?.supplierInvoiceIds)
    ? body.supplierInvoiceIds.map((s: any) => String(s)).filter(Boolean)
    : (body?.supplierInvoiceId ? [String(body.supplierInvoiceId)] : [])
  if (ids.length === 0) return NextResponse.json({ error: 'supplierInvoiceIds required' }, { status: 400 })

  const invRes = await pool.query(
    `SELECT * FROM "SupplierInvoice"
     WHERE id = ANY($1::text[]) AND "organizationId" = $2`,
    [ids, g.organizationId]
  )
  if (invRes.rowCount !== ids.length) {
    return NextResponse.json({ error: 'One or more invoices not found' }, { status: 404 })
  }
  for (const inv of invRes.rows) {
    if (inv.status !== 'APPROVED') {
      return NextResponse.json({ error: `Invoice ${inv.invoiceNumber} is ${inv.status} — only APPROVED can be added` }, { status: 409 })
    }
  }

  // Check not already on this or another active run
  const dup = await pool.query(
    `SELECT l."supplierInvoiceId"
     FROM "PaymentRunLine" l
     JOIN "PaymentRun" pr ON pr.id = l."paymentRunId"
     WHERE l."supplierInvoiceId" = ANY($1::text[])
       AND pr.status NOT IN ('CANCELLED','FAILED')
       AND pr.id <> $2`,
    [ids, id]
  )
  if (dup.rowCount > 0) {
    return NextResponse.json({ error: 'One or more invoices already on another run' }, { status: 409 })
  }
  const onThis = await pool.query(
    `SELECT "supplierInvoiceId" FROM "PaymentRunLine" WHERE "paymentRunId" = $1`,
    [id]
  )
  const already = new Set(onThis.rows.map((r: any) => r.supplierInvoiceId))

  const crypto = require('crypto')
  const inserted: any[] = []
  for (const inv of invRes.rows) {
    if (already.has(inv.id)) continue
    const r = await pool.query(
      `INSERT INTO "PaymentRunLine"
         (id, "organizationId", "paymentRunId",
          "supplierInvoiceId", "supplierId", "supplierName", "invoiceNumber",
          amount, currency, status, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,
               $4,$5,$6,$7,
               $8,$9,'PENDING',NOW(),NOW())
       RETURNING *`,
      [
        crypto.randomUUID(), g.organizationId, id,
        inv.id, inv.supplierId, inv.supplierName, inv.invoiceNumber,
        Number(inv.total || 0), inv.currency || 'KES',
      ]
    )
    inserted.push(r.rows[0])
  }

  const totals = await recalcRun(g.organizationId, id)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PAYMENT_RUN_LINES_ADDED',
    entityType: 'PaymentRun',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added ' + inserted.length + ' invoice(s)',
    metadata: { count: inserted.length, totals },
  })

  return NextResponse.json({ lines: inserted, totals }, { status: 201 })
})