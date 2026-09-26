export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * POST /api/wavecore/procurement/requisitions/[id]/submit
 *
 * Transitions requisition from DRAFT -> SUBMITTED and creates the
 * approval chain from ProcurementApprovalRule rows.
 *
 * If no rules match, auto-approves the requisition.
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  // 1. Load requisition
  const reqRes = await pool.query(
    `SELECT * FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (reqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  const req = reqRes.rows[0]

  if (req.status !== 'DRAFT') {
    return NextResponse.json({
      error: 'Only DRAFT requisitions can be submitted (current: ' + req.status + ')',
    }, { status: 409 })
  }

  // 2. Ensure at least one line exists
  const lineCount = await pool.query(
    `SELECT COUNT(*)::int AS n FROM "PurchaseRequisitionLine"
     WHERE "requisitionId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if ((lineCount.rows[0]?.n || 0) === 0) {
    return NextResponse.json({ error: 'Cannot submit: requisition has no lines' }, { status: 400 })
  }

  const amount = Number(req.totalAmount || 0)

  // 3. Load approval rules for the org
  const rulesRes = await pool.query(
    `SELECT * FROM "ProcurementApprovalRule"
     WHERE "organizationId" = $1 AND "appliesTo" = 'REQUISITION' AND "isActive" = TRUE
     ORDER BY "stepNumber" ASC`,
    [g.organizationId]
  )

  // 4. Filter rules by:
  //    - amount in [minAmount, maxAmount)
  //    - category matches (null = any)
  //    - departmentId matches (null = any)
  const matching = rulesRes.rows.filter((r: any) => {
    const minOk = amount >= Number(r.minAmount || 0)
    const maxOk = r.maxAmount === null || r.maxAmount === undefined || amount < Number(r.maxAmount)
    const catOk = !r.category || r.category === req.category
    const depOk = !r.departmentId || r.departmentId === req.departmentId
    return minOk && maxOk && catOk && depOk
  })

  const crypto = require('crypto')

  // 5a. No matching rules -> auto-approve
  if (matching.length === 0) {
    await pool.query(
      `UPDATE "PurchaseRequisition"
       SET status = 'APPROVED',
           "submittedAt" = NOW(),
           "approvedAt" = NOW(),
           "totalApprovalSteps" = 0,
           "currentApprovalStep" = 0,
           "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [id, g.organizationId]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'REQUISITION_AUTO_APPROVED',
      entityType: 'PurchaseRequisition',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Auto-approved (no matching approval rules) — ' + req.requisitionNumber,
      metadata: { amount, matchedRules: 0 },
    })

    return NextResponse.json({
      status: 'APPROVED',
      message: 'Auto-approved: no matching approval rules',
      steps: 0,
    })
  }

  // 5b. Rules matched -> create approval rows
  // De-duplicate by stepNumber — merge approvers within the same step.
  const byStep: Record<number, any[]> = {}
  for (const r of matching) {
    const step = Number(r.stepNumber) || 1
    if (!byStep[step]) byStep[step] = []
    byStep[step].push(r)
  }
  const steps = Object.keys(byStep).map(n => Number(n)).sort((a, b) => a - b)
  const totalSteps = steps.length

  // Delete existing approval rows (should be none for DRAFT, but be safe)
  await pool.query(
    `DELETE FROM "PurchaseRequisitionApproval" WHERE "requisitionId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )

  const created: any[] = []
  for (const step of steps) {
    for (const rule of byStep[step]) {
      const approvalId = crypto.randomUUID()
      const slaHours = Number(rule.slaHours) || 48
      const r = await pool.query(
        `INSERT INTO "PurchaseRequisitionApproval"
           (id, "organizationId", "requisitionId", "stepNumber", "approverId", "approverRole",
            status, "slaHours", "dueAt", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7,NOW() + ($8 || ' hours')::interval,NOW(),NOW())
         RETURNING *`,
        [
          approvalId, g.organizationId, id, step,
          rule.approverUserId || null,
          rule.approverRole || null,
          slaHours,
          String(slaHours),
        ]
      )
      created.push(r.rows[0])
    }
  }

  // 6. Update requisition status
  await pool.query(
    `UPDATE "PurchaseRequisition"
     SET status = 'SUBMITTED',
         "submittedAt" = NOW(),
         "totalApprovalSteps" = $3,
         "currentApprovalStep" = 1,
         "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId, totalSteps]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_SUBMITTED',
    entityType: 'PurchaseRequisition',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Submitted ' + req.requisitionNumber + ' for approval (' + totalSteps + ' step(s))',
    metadata: { amount, totalSteps, ruleIds: matching.map((r: any) => r.id) },
  })

  return NextResponse.json({
    status: 'SUBMITTED',
    totalSteps,
    approvals: created,
  })
})