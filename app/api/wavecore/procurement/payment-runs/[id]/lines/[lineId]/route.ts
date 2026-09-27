export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

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

export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; lineId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, lineId } = ctx.params

  const runRes = await pool.query(
    `SELECT status FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (runRes.rowCount === 0) return NextResponse.json({ error: 'Payment run not found' }, { status: 404 })
  if (runRes.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT runs can be edited' }, { status: 409 })
  }

  const lineRes = await pool.query(
    `SELECT * FROM "PaymentRunLine"
     WHERE id = $1 AND "paymentRunId" = $2 AND "organizationId" = $3`,
    [lineId, id, g.organizationId]
  )
  if (lineRes.rowCount === 0) return NextResponse.json({ error: 'Line not found' }, { status: 404 })

  await pool.query(
    `DELETE FROM "PaymentRunLine" WHERE id = $1 AND "paymentRunId" = $2 AND "organizationId" = $3`,
    [lineId, id, g.organizationId]
  )

  const totals = await recalcRun(g.organizationId, id)

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PAYMENT_RUN_LINE_REMOVED',
    entityType: 'PaymentRun',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed invoice ' + lineRes.rows[0].invoiceNumber,
    metadata: { lineId, totals },
  })

  return NextResponse.json({ ok: true, totals })
})