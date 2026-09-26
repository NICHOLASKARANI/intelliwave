export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { canActOnStep } from '@/lib/wavecore/procurement-approval'

/**
 * POST /api/wavecore/procurement/requisitions/[id]/delegate
 * Body: { delegateToUserId*: string, comment?: string }
 *
 * The current approver reassigns their approval step to another user.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'APPROVE')
  const id = ctx.params.id

  let body: any = {}
  try { body = await request.json() } catch { /* empty */ }
  const target = String(body?.delegateToUserId || '').trim()
  if (!target) return NextResponse.json({ error: 'delegateToUserId is required' }, { status: 400 })
  if (target === g.userId) return NextResponse.json({ error: 'Cannot delegate to yourself' }, { status: 400 })

  const reqRes = await pool.query(
    `SELECT * FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (reqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  const req = reqRes.rows[0]
  if (req.status !== 'SUBMITTED') return NextResponse.json({ error: 'Requisition is not awaiting approval' }, { status: 409 })

  const stepsRes = await pool.query(
    `SELECT * FROM "PurchaseRequisitionApproval"
     WHERE "requisitionId" = $1 AND "organizationId" = $2 AND status = 'PENDING'
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
  if (!authz.allowed) {
    return NextResponse.json({ error: authz.reason || 'Not authorized to delegate this step' }, { status: 403 })
  }

  // Verify target user belongs to the same organization
  const userRes = await pool.query(
    `SELECT id, name, email FROM "User" WHERE id = $1 AND "organizationId" = $2`,
    [target, g.organizationId]
  )
  if (userRes.rowCount === 0) {
    return NextResponse.json({ error: 'Target user not found in your organization' }, { status: 404 })
  }
  const targetUser = userRes.rows[0]

  await pool.query(
    `UPDATE "PurchaseRequisitionApproval"
     SET "delegatedTo" = $3, "delegatedAt" = NOW(), "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [current.id, g.organizationId, target]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_DELEGATED',
    entityType: 'PurchaseRequisition',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Delegated step ' + current.stepNumber + ' to ' + (targetUser.name || targetUser.email),
    metadata: { stepNumber: current.stepNumber, delegateToUserId: target, comment: body?.comment || null },
  })

  return NextResponse.json({ success: true, delegatedTo: target })
})