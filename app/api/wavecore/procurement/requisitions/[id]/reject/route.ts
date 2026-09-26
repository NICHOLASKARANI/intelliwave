export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { canActOnStep } from '@/lib/wavecore/procurement-approval'

/**
 * POST /api/wavecore/procurement/requisitions/[id]/reject
 * Body: { reason*: string }
 *
 * Rejects the current pending step and the whole requisition.
 * All other pending steps → CANCELLED.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'APPROVE')
  const id = ctx.params.id

  let body: any = {}
  try { body = await request.json() } catch { /* empty */ }
  const reason = String(body?.reason || '').trim()
  if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 })

  const reqRes = await pool.query(
    `SELECT * FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (reqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  const req = reqRes.rows[0]
  if (req.status !== 'SUBMITTED') {
    return NextResponse.json({ error: 'Requisition is not awaiting approval' }, { status: 409 })
  }

  const stepsRes = await pool.query(
    `SELECT * FROM "PurchaseRequisitionApproval"
     WHERE "requisitionId" = $1 AND "organizationId" = $2
     ORDER BY "stepNumber" ASC`,
    [id, g.organizationId]
  )
  const current = stepsRes.rows.find((s: any) => s.status === 'PENDING')
  if (!current) return NextResponse.json({ error: 'No pending approval step' }, { status: 409 })

  const authz = canActOnStep(current, {
    userId: g.userId,
    userName: g.userName,
    role: (g.session as any)?.role || '',
  }, g.tier)
  if (!authz.allowed) {
    return NextResponse.json({ error: authz.reason || 'Not authorized' }, { status: 403 })
  }

  // Mark current step rejected
  await pool.query(
    `UPDATE "PurchaseRequisitionApproval"
     SET status = 'REJECTED', decision = 'REJECTED', comment = $3,
         "decidedAt" = NOW(), "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [current.id, g.organizationId, reason]
  )

  // Cancel other pending steps
  await pool.query(
    `UPDATE "PurchaseRequisitionApproval"
     SET status = 'CANCELLED', "updatedAt" = NOW()
     WHERE "requisitionId" = $1 AND "organizationId" = $2 AND status = 'PENDING'`,
    [id, g.organizationId]
  )

  // Mark requisition rejected
  await pool.query(
    `UPDATE "PurchaseRequisition"
     SET status = 'REJECTED', "rejectedAt" = NOW(), "rejectionReason" = $3, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId, reason]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_REJECTED',
    entityType: 'PurchaseRequisition',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Rejected at step ' + current.stepNumber + ' — ' + req.requisitionNumber,
    metadata: { stepNumber: current.stepNumber, reason },
  })

  return NextResponse.json({ status: 'REJECTED' })
})