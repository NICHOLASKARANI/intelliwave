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
  const comment = String(body?.comment || '').trim() || null

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
     ORDER BY "stepNumber" ASC`,
    [id, g.organizationId]
  )
  const steps = stepsRes.rows
  if (steps.length === 0) return NextResponse.json({ error: 'No approval steps defined' }, { status: 409 })

  const current = steps.find((s: any) => s.status === 'PENDING')
  if (!current) return NextResponse.json({ error: 'No pending approval step' }, { status: 409 })

  const authz = canActOnStep(current, {
    userId: g.userId,
    userName: g.userName,
    role: (g.session as any)?.role || '',
  }, g.tier)
  if (!authz.allowed) return NextResponse.json({ error: authz.reason || 'Not authorized' }, { status: 403 })

  await pool.query(
    `UPDATE "ProcurementApproval"
     SET status = 'APPROVED', decision = 'APPROVED', comment = $3, "decidedAt" = NOW(), "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [current.id, g.organizationId, comment]
  )

  const remaining = steps.filter((s: any) => s.status === 'PENDING' && s.id !== current.id)
  if (remaining.length === 0) {
    await pool.query(
      `UPDATE "PurchaseOrder"
       SET status = 'APPROVED', "approvedAt" = NOW(), "approvedBy" = $3,
           "currentApprovalStep" = "totalApprovalSteps", "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [id, g.organizationId, g.userId]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'PURCHASE_ORDER_APPROVED',
      entityType: 'PurchaseOrder',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Approved PO ' + po.number,
      metadata: { stepNumber: current.stepNumber, comment },
    })

    return NextResponse.json({ status: 'APPROVED', message: 'Final approval complete' })
  } else {
    const nextStep = Math.min(...remaining.map((s: any) => s.stepNumber))
    await pool.query(
      `UPDATE "PurchaseOrder" SET "currentApprovalStep" = $3, "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [id, g.organizationId, nextStep]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'PURCHASE_ORDER_STEP_APPROVED',
      entityType: 'PurchaseOrder',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Approved step ' + current.stepNumber + ' of ' + po.totalApprovalSteps,
      metadata: { stepNumber: current.stepNumber, nextStep, comment },
    })

    return NextResponse.json({ status: 'SUBMITTED', nextStep, message: 'Step approved — awaiting next approver' })
  }
})