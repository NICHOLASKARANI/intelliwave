export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/payment-runs/[id]
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const r = await pool.query(
    `SELECT * FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Payment run not found' }, { status: 404 })
  const run = r.rows[0]

  const [linesRes, bankRes] = await Promise.all([
    pool.query(
      `SELECT l.*, si.status AS "invoiceStatus", si."dueDate" AS "invoiceDueDate"
       FROM "PaymentRunLine" l
       LEFT JOIN "SupplierInvoice" si ON si.id = l."supplierInvoiceId"
       WHERE l."paymentRunId" = $1 AND l."organizationId" = $2
       ORDER BY l."createdAt" ASC`,
      [id, g.organizationId]
    ),
    run.bankAccountId
      ? pool.query(`SELECT * FROM "BankAccount" WHERE id = $1 LIMIT 1`, [run.bankAccountId])
      : Promise.resolve({ rows: [] }),
  ])

  return NextResponse.json({
    paymentRun: run,
    lines: linesRes.rows,
    bankAccount: bankRes.rows[0] || null,
  })
})

/**
 * PATCH /api/wavecore/procurement/payment-runs/[id]
 * DRAFT only. Editable: paymentDate, cutoffDate, method, bankAccountId, notes.
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const cur = await pool.query(
    `SELECT status FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'Payment run not found' }, { status: 404 })
  if (cur.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT runs can be edited' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const editable: Record<string, string> = {
    paymentDate: 'paymentDate',
    cutoffDate: 'cutoffDate',
    method: 'method',
    bankAccountId: 'bankAccountId',
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
  if (sets.length === 0) return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  sets.push(`"updatedAt" = NOW()`)

  values.push(id); const idParam = values.length
  values.push(g.organizationId); const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "PaymentRun" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PAYMENT_RUN_UPDATED',
    entityType: 'PaymentRun',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated run header',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ paymentRun: upd.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/payment-runs/[id]
 * DRAFT only. Cascade-deletes lines.
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const cur = await pool.query(
    `SELECT status, "runNumber" FROM "PaymentRun"
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'Payment run not found' }, { status: 404 })
  // Deletable statuses:
  //   DRAFT     - never submitted
  //   FAILED    - execution attempted, bank rejected
  //   CANCELLED - already cancelled
  // Blocked (payment record must not vanish mid-flight or after settlement):
  //   PENDING_APPROVAL, APPROVED, EXECUTING, EXECUTED
  const deletable = ['DRAFT', 'FAILED', 'CANCELLED']
  if (!deletable.includes(cur.rows[0].status)) {
    return NextResponse.json({
      error: 'Cannot delete payment run in status ' + cur.rows[0].status + '. Cancel it first.',
    }, { status: 409 })
  }

  await pool.query(`DELETE FROM "PaymentRunLine" WHERE "paymentRunId" = $1 AND "organizationId" = $2`, [id, g.organizationId])
  await pool.query(`DELETE FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`, [id, g.organizationId])

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PAYMENT_RUN_DELETED',
    entityType: 'PaymentRun',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted ' + cur.rows[0].runNumber,
    metadata: { runNumber: cur.rows[0].runNumber },
  })

  return NextResponse.json({ ok: true })
})