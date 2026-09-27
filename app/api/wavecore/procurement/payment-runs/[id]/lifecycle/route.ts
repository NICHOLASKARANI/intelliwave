export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const ALLOWED: Record<string, { from: string[]; to: string }> = {
  SUBMIT:  { from: ['DRAFT'],                              to: 'PENDING_APPROVAL' },
  APPROVE: { from: ['PENDING_APPROVAL'],                   to: 'APPROVED' },
  EXECUTE: { from: ['APPROVED'],                           to: 'EXECUTED' },
  FAIL:    { from: ['APPROVED','EXECUTING'],               to: 'FAILED' },
  CANCEL:  { from: ['DRAFT','PENDING_APPROVAL','APPROVED'], to: 'CANCELLED' },
}

/**
 * POST /api/wavecore/procurement/payment-runs/[id]/lifecycle
 * Body: { action: 'SUBMIT'|'APPROVE'|'EXECUTE'|'FAIL'|'CANCEL', reason? }
 *
 * EXECUTE side effects:
 *   - Each PaymentRunLine → status PAID + paidAt NOW
 *   - Each linked SupplierInvoice → status PAID + paidAt NOW
 *                                  + paymentReference = runNumber
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const action = String(body?.action || '').toUpperCase()
  if (!Object.keys(ALLOWED).includes(action)) {
    return NextResponse.json({ error: 'action must be SUBMIT | APPROVE | EXECUTE | FAIL | CANCEL' }, { status: 400 })
  }

  const cur = await pool.query(
    `SELECT * FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'Payment run not found' }, { status: 404 })
  const run = cur.rows[0]

  if (!ALLOWED[action].from.includes(run.status)) {
    return NextResponse.json({ error: `Cannot ${action} run in status ${run.status}` }, { status: 409 })
  }

  const to = ALLOWED[action].to
  const reason = body?.reason ? String(body.reason).slice(0, 2000) : null

  // Execute = heavier: mark lines paid + cascade to invoices
  if (action === 'EXECUTE') {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Fetch lines
      const linesRes = await client.query(
        `SELECT * FROM "PaymentRunLine"
         WHERE "paymentRunId" = $1 AND "organizationId" = $2`,
        [id, g.organizationId]
      )
      if (linesRes.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Cannot execute empty run' }, { status: 400 })
      }

      // Mark lines paid
      await client.query(
        `UPDATE "PaymentRunLine"
         SET status = 'PAID', "paidAt" = NOW(), "updatedAt" = NOW()
         WHERE "paymentRunId" = $1 AND "organizationId" = $2`,
        [id, g.organizationId]
      )

      // Cascade to invoices
      for (const line of linesRes.rows) {
        if (!line.supplierInvoiceId) continue
        await client.query(
          `UPDATE "SupplierInvoice"
           SET status = 'PAID',
               "paidAt" = NOW(),
               "paymentReference" = COALESCE("paymentReference", $1),
               "updatedAt" = NOW()
           WHERE id = $2 AND "organizationId" = $3
             AND status <> 'CANCELLED'`,
          [run.runNumber, line.supplierInvoiceId, g.organizationId]
        )
      }

      // Update run
      await client.query(
        `UPDATE "PaymentRun"
         SET status = $1, "executedAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [to, id, g.organizationId]
      )

      await client.query('COMMIT')
    } catch (err) {
      try { await client.query('ROLLBACK') } catch {}
      console.error('[prun-execute]', (err as Error).message)
      return NextResponse.json({ error: 'Execute failed: ' + (err as Error).message }, { status: 500 })
    } finally {
      client.release()
    }

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'PAYMENT_RUN_EXECUTED',
      entityType: 'PaymentRun',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Executed ' + run.runNumber + ' — ' + run.invoiceCount + ' invoice(s) marked PAID',
      metadata: { runNumber: run.runNumber, invoiceCount: run.invoiceCount, totalAmount: run.totalAmount },
    })

    return NextResponse.json({ ok: true, status: to })
  }

  // Non-EXECUTE actions — simple status update
  const sets: string[] = ['status = $1', '"updatedAt" = NOW()']
  const values: any[] = [to]

  if (action === 'APPROVE') {
    values.push(g.userId); sets.push(`"approvedBy" = $${values.length}`)
    values.push(g.userName); sets.push(`"approvedByName" = $${values.length}`)
    sets.push(`"approvedAt" = NOW()`)
  } else if (action === 'FAIL') {
    if (reason) {
      values.push(reason); sets.push(`"failureReason" = $${values.length}`)
    }
  } else if (action === 'CANCEL' && reason) {
    values.push(reason); sets.push(`notes = COALESCE(notes, '') || E'\n[CANCEL] ' || $${values.length}`)
  }

  values.push(id); const idParam = values.length
  values.push(g.organizationId); const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "PaymentRun" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  const eventType = {
    SUBMIT:  'PAYMENT_RUN_SUBMITTED',
    APPROVE: 'PAYMENT_RUN_APPROVED',
    FAIL:    'PAYMENT_RUN_FAILED',
    CANCEL:  'PAYMENT_RUN_CANCELLED',
  }[action] || 'PAYMENT_RUN_STATUS_CHANGED'

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType,
    entityType: 'PaymentRun',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: action + ' ' + run.runNumber,
    metadata: { fromStatus: run.status, toStatus: to, reason },
  })

  return NextResponse.json({ ok: true, paymentRun: upd.rows[0] })
})