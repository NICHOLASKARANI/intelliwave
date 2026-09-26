export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { canActOnStep, summariseChain } from '@/lib/wavecore/procurement-approval'

/**
 * POST /api/wavecore/procurement/requisitions/[id]/approve
 * Body: { comment?: string }
 *
 * Approves the current pending approval step.
 * If it was the last step → requisition becomes APPROVED.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'APPROVE')
  const id = ctx.params.id

  let body: any = {}
  try { body = await request.json() } catch { /* allow empty */ }
  const comment = String(body?.comment || '').trim() || null

  // Load requisition
  const reqRes = await pool.query(
    `SELECT * FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (reqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  const req = reqRes.rows[0]

  if (req.status !== 'SUBMITTED') {
    return NextResponse.json({ error: 'Requisition is not awaiting approval (current: ' + req.status + ')' }, { status: 409 })
  }

  // Load all approval steps
  const stepsRes = await pool.query(
    `SELECT * FROM "PurchaseRequisitionApproval"
     WHERE "requisitionId" = $1 AND "organizationId" = $2
     ORDER BY "stepNumber" ASC`,
    [id, g.organizationId]
  )
  const steps = stepsRes.rows
  if (steps.length === 0) {
    return NextResponse.json({ error: 'No approval steps defined' }, { status: 409 })
  }

  // Find current pending step (lowest stepNumber with status=PENDING)
  const current = steps.find((s: any) => s.status === 'PENDING')
  if (!current) {
    return NextResponse.json({ error: 'No pending approval step' }, { status: 409 })
  }

  // Authorization
  const authz = canActOnStep(current, {
    userId: g.userId,
    userName: g.userName,
    role: (g.session as any)?.role || '',
  }, g.tier)
  if (!authz.allowed) {
    return NextResponse.json({ error: authz.reason || 'Not authorized' }, { status: 403 })
  }

  // Mark this step approved
  await pool.query(
    `UPDATE "PurchaseRequisitionApproval"
     SET status = 'APPROVED', decision = 'APPROVED', comment = $3,
         "decidedAt" = NOW(), "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [current.id, g.organizationId, comment]
  )

  // Re-check chain
  const newSteps = steps.map((s: any) => s.id === current.id ? { ...s, status: 'APPROVED' } : s)
  const summary = summariseChain(newSteps)

  // If any remaining pending → advance currentApprovalStep
  // If none pending → requisition approved
  if (summary.pending === 0) {
    await pool.query(
      `UPDATE "PurchaseRequisition"
       SET status = 'APPROVED', "approvedAt" = NOW(),
           "currentApprovalStep" = "totalApprovalSteps",
           "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [id, g.organizationId]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'REQUISITION_APPROVED',
      entityType: 'PurchaseRequisition',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Approved (final step ' + current.stepNumber + ') — ' + req.requisitionNumber,
      metadata: { stepNumber: current.stepNumber, comment },
    })

    return NextResponse.json({
      status: 'APPROVED',
      stepNumber: current.stepNumber,
      message: 'Final approval complete',
    })
  } else {
    await pool.query(
      `UPDATE "PurchaseRequisition"
       SET "currentApprovalStep" = $3, "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [id, g.organizationId, summary.currentStep]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'REQUISITION_STEP_APPROVED',
      entityType: 'PurchaseRequisition',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Approved step ' + current.stepNumber + ' of ' + req.totalApprovalSteps + ' — ' + req.requisitionNumber,
      metadata: { stepNumber: current.stepNumber, nextStep: summary.currentStep, comment },
    })

    return NextResponse.json({
      status: 'SUBMITTED',
      stepNumber: current.stepNumber,
      nextStep: summary.currentStep,
      message: 'Step approved — awaiting next approver',
    })
  }
})