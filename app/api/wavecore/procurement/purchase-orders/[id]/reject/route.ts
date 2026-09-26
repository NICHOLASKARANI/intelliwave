export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { canActOnStep } from '@/lib/wavecore/procurement-approval'

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'APPROVE')
  const id = ctx.params.id

  let body: any = {}
  try { body = await request.json() } catch { /* empty */ }
  const reason = String(body?.reason || '').trim()
  if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 })

  const poRes = await pool.query(
    `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (poRes.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  const po = poRes.rows[0]
  if (po.status !== 'SUBMITTED') return NextResponse.json({ error: 'PO is not awaiting approval' }, { status: 409 })

  const stepsRes = await pool.query(
    `SELECT * FROM "ProcurementApproval"
     WHERE "entityType" = 'PurchaseOrder' AND "entityId" = $1 AND "organizationId" = $2
       AND status = 'PENDING'
     ORDER BY "stepNumber" ASC LIMIT 1`,
    [id, g.organizationId]
  )
  if (stepsRes.rowCount === 0) return NextResponse.json({ error: 'No pending approval step' }, { status: 409 })
  const current = stepsRes.rows[0]

  const authz = canActOnStep(current, {
    userId: g.userId,
    userName: g.userName,
    role: (g.session as any)?.role || '',
  }, g.tier)
  if (!authz.allowed) return NextResponse.json({ error: authz.reason || 'Not authorized' }, { status: 403 })

  await pool.query(
    `UPDATE "ProcurementApproval"
     SET status = 'REJECTED', decision = 'REJECTED', comment = $3, "decidedAt" = NOW(), "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [current.id, g.organizationId, reason]
  )

  await pool.query(
    `UPDATE "ProcurementApproval"
     SET status = 'CANCELLED', "updatedAt" = NOW()
     WHERE "entityType" = 'PurchaseOrder' AND "entityId" = $1 AND "organizationId" = $2 AND status = 'PENDING'`,
    [id, g.organizationId]
  )

  await pool.query(
    `UPDATE "PurchaseOrder"
     SET status = 'REJECTED', "rejectedAt" = NOW(), "rejectedBy" = $3, "rejectionReason" = $4, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId, g.userId, reason]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_REJECTED',
    entityType: 'PurchaseOrder',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Rejected PO ' + po.number + ' at step ' + current.stepNumber,
    metadata: { stepNumber: current.stepNumber, reason },
  })

  return NextResponse.json({ status: 'REJECTED' })
})