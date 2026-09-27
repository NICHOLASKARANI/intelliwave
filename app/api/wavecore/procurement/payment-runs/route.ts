export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

// Local numbering helper — PRUN prefix — matches real ProcurementNumbering schema.
async function nextPaymentRunNumber(pool: any, organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const upd = await pool.query(
    `UPDATE "ProcurementNumbering"
     SET counter = counter + 1, "updatedAt" = NOW()
     WHERE "organizationId" = $1 AND scope = 'PRUN' AND year = $2
     RETURNING counter, prefix`,
    [organizationId, year]
  )

  let seq: number
  let prefix = 'PRUN'
  if (upd.rowCount > 0) {
    seq = upd.rows[0].counter
    prefix = upd.rows[0].prefix || 'PRUN'
  } else {
    const ins = await pool.query(
      `INSERT INTO "ProcurementNumbering"
         (id, "organizationId", scope, prefix, year, counter, "createdAt", "updatedAt")
       VALUES ($1, $2, 'PRUN', 'PRUN', $3, 1, NOW(), NOW())
       RETURNING counter, prefix`,
      [id, organizationId, year]
    )
    seq = ins.rows[0].counter
    prefix = ins.rows[0].prefix || 'PRUN'
  }
  const padded = String(seq).padStart(4, '0')
  return `${prefix}-${year}-${padded}`
}

const RUN_METHODS = ['BANK_TRANSFER','CHEQUE','MOBILE_MONEY','MIXED']
const RUN_STATUSES = ['DRAFT','PENDING_APPROVAL','APPROVED','EXECUTING','EXECUTED','FAILED','CANCELLED']

/**
 * GET /api/wavecore/procurement/payment-runs
 * Filters: q, status, method, fromDate, toDate, limit, offset
 * Sort: paymentDate | createdAt | totalAmount
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = searchParams.get('status')
  const method = searchParams.get('method')
  const fromDate = searchParams.get('fromDate')
  const toDate = searchParams.get('toDate')
  const sort = searchParams.get('sort') || 'createdAt'
  const order = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['pr."organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(pr."runNumber" ILIKE $' + n + ' OR pr.notes ILIKE $' + n + ')')
  }
  if (status) { params.push(status); where.push('pr.status = $' + params.length) }
  if (method) { params.push(method); where.push('pr.method = $' + params.length) }
  if (fromDate) { params.push(fromDate); where.push('pr."paymentDate" >= $' + params.length + '::timestamp') }
  if (toDate) { params.push(toDate); where.push('pr."paymentDate" <= $' + params.length + '::timestamp') }

  const sortCol: Record<string, string> = {
    createdAt: 'pr."createdAt"',
    paymentDate: 'pr."paymentDate"',
    totalAmount: 'pr."totalAmount"',
  }
  const sortSQL = sortCol[sort] || 'pr."createdAt"'
  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "PaymentRun" pr WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT
       pr.id, pr."runNumber", pr."paymentDate", pr."cutoffDate",
       pr.currency, pr."totalAmount", pr."invoiceCount",
       pr.status, pr.method, pr."bankAccountId",
       pr."approvedAt", pr."approvedByName",
       pr."executedAt", pr."failureReason", pr.notes,
       pr."createdAt", pr."updatedAt"
     FROM "PaymentRun" pr
     WHERE ${whereSQL}
     ORDER BY ${sortSQL} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    paymentRuns: listRes.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/payment-runs
 * Body: {
 *   paymentDate*: ISO date,
 *   cutoffDate?: ISO date,
 *   method?: 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY' | 'MIXED',
 *   currency?: string,
 *   bankAccountId?: string,
 *   notes?: string,
 *   supplierInvoiceIds*: string[]   // invoices to include
 * }
 *
 * Validations:
 *   - Each invoice belongs to this org.
 *   - Each invoice.status = APPROVED.
 *   - No invoice is on another non-cancelled payment run.
 *   - Total = sum of invoice.total.
 *   - Auto-numbers PRUN-YYYY-NNNN.
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const paymentDate = body?.paymentDate ? String(body.paymentDate) : null
  if (!paymentDate) return NextResponse.json({ error: 'paymentDate is required' }, { status: 400 })

  const method = String(body?.method || 'BANK_TRANSFER').toUpperCase()
  if (!RUN_METHODS.includes(method)) {
    return NextResponse.json({ error: 'method must be one of ' + RUN_METHODS.join(' | ') }, { status: 400 })
  }

  const invoiceIds: string[] = Array.isArray(body?.supplierInvoiceIds)
    ? body.supplierInvoiceIds.map((s: any) => String(s)).filter(Boolean)
    : []
  if (invoiceIds.length === 0) return NextResponse.json({ error: 'At least one invoice required' }, { status: 400 })
  if (invoiceIds.length > 1000) return NextResponse.json({ error: 'Too many invoices (max 1000)' }, { status: 400 })

  // Load invoices + validate ownership/status
  const invRes = await pool.query(
    `SELECT * FROM "SupplierInvoice"
     WHERE id = ANY($1::text[]) AND "organizationId" = $2`,
    [invoiceIds, g.organizationId]
  )
  if (invRes.rowCount !== invoiceIds.length) {
    return NextResponse.json({ error: 'One or more invoices not found in this organization' }, { status: 404 })
  }

  for (const inv of invRes.rows) {
    if (inv.status !== 'APPROVED') {
      return NextResponse.json({
        error: `Invoice ${inv.invoiceNumber} is ${inv.status} — only APPROVED invoices can be paid`,
      }, { status: 409 })
    }
  }

  // Check none are already on a non-cancelled run
  const inUse = await pool.query(
    `SELECT l."supplierInvoiceId", pr."runNumber"
     FROM "PaymentRunLine" l
     JOIN "PaymentRun" pr ON pr.id = l."paymentRunId"
     WHERE l."supplierInvoiceId" = ANY($1::text[])
       AND pr.status NOT IN ('CANCELLED','FAILED')`,
    [invoiceIds]
  )
  if (inUse.rowCount > 0) {
    const names = inUse.rows.map((r: any) => r.runNumber).join(', ')
    return NextResponse.json({ error: 'One or more invoices already on a payment run (' + names + ')' }, { status: 409 })
  }

  let runNumber: string
  try {
    runNumber = await nextPaymentRunNumber(pool, g.organizationId)
  } catch (err) {
    console.error('[prun] numbering failed:', (err as Error).message)
    return NextResponse.json({ error: 'Numbering table missing. Run procurement-paymentrun-extension.sql first.' }, { status: 500 })
  }

  const currency = body?.currency || invRes.rows[0]?.currency || 'KES'
  const totalAmount = invRes.rows.reduce((s: number, inv: any) => s + Number(inv.total || 0), 0)

  const crypto = require('crypto')
  const runId = crypto.randomUUID()

  const client = await pool.connect()
  const insertedLines: any[] = []
  try {
    await client.query('BEGIN')

    const insRes = await client.query(
      `INSERT INTO "PaymentRun"
         (id, "organizationId", "runNumber", "paymentDate", "cutoffDate",
          currency, "totalAmount", "invoiceCount", status, method,
          "bankAccountId", notes, "createdBy", "createdByName",
          "createdAt", "updatedAt")
       VALUES ($1,$2,$3,
               $4::timestamp,$5::timestamp,
               $6,$7,$8,'DRAFT',$9,
               $10,$11,$12,$13,
               NOW(),NOW())
       RETURNING *`,
      [
        runId, g.organizationId, runNumber,
        paymentDate, body?.cutoffDate || null,
        currency, totalAmount, invRes.rowCount, method,
        body?.bankAccountId || null, body?.notes || null,
        g.userId, g.userName,
      ]
    )
    const run = insRes.rows[0]

    for (const inv of invRes.rows) {
      const lineId = crypto.randomUUID()
      const r = await client.query(
        `INSERT INTO "PaymentRunLine"
           (id, "organizationId", "paymentRunId",
            "supplierInvoiceId", "supplierId", "supplierName", "invoiceNumber",
            amount, currency, status, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,
                 $4,$5,$6,$7,
                 $8,$9,'PENDING',NOW(),NOW())
         RETURNING *`,
        [
          lineId, g.organizationId, runId,
          inv.id, inv.supplierId, inv.supplierName, inv.invoiceNumber,
          Number(inv.total || 0), inv.currency || currency,
        ]
      )
      insertedLines.push(r.rows[0])
    }

    await client.query('COMMIT')

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'PAYMENT_RUN_CREATED',
      entityType: 'PaymentRun',
      entityId: runId,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Created ' + runNumber + ' — ' + invRes.rowCount + ' invoice(s)',
      metadata: { runNumber, method, totalAmount, invoiceCount: invRes.rowCount },
    })

    return NextResponse.json({
      paymentRun: run,
      lines: insertedLines,
    }, { status: 201 })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[prun-create]', (err as Error).message)
    return NextResponse.json({ error: 'Create failed: ' + (err as Error).message }, { status: 500 })
  } finally {
    client.release()
  }
})