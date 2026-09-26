export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const poRes = await pool.query(
    `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (poRes.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  const po = poRes.rows[0]

  if (po.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT POs can be submitted (current: ' + po.status + ')' }, { status: 409 })
  }

  const lineCount = await pool.query(
    `SELECT COUNT(*)::int AS n FROM "PurchaseOrderItem" WHERE "purchaseOrderId" = $1`,
    [id]
  )
  if ((lineCount.rows[0]?.n || 0) === 0) {
    return NextResponse.json({ error: 'Cannot submit: PO has no lines' }, { status: 400 })
  }

  const amount = Number(po.total || po.amount || 0)

  const rulesRes = await pool.query(
    `SELECT * FROM "ProcurementApprovalRule"
     WHERE "organizationId" = $1 AND "appliesTo" = 'PURCHASE_ORDER' AND "isActive" = TRUE
     ORDER BY "stepNumber" ASC`,
    [g.organizationId]
  )

  const matching = rulesRes.rows.filter((r: any) => {
    const minOk = amount >= Number(r.minAmount || 0)
    const maxOk = r.maxAmount === null || r.maxAmount === undefined || amount < Number(r.maxAmount)
    const catOk = !r.category
    const depOk = !r.departmentId
    return minOk && maxOk && catOk && depOk
  })

  const crypto = require('crypto')

  if (matching.length === 0) {
    await pool.query(
      `UPDATE "PurchaseOrder"
       SET status = 'APPROVED', "approvedAt" = NOW(),
           "totalApprovalSteps" = 0, "currentApprovalStep" = 0, "updatedAt" = NOW()
       WHERE id = $1 AND "organizationId" = $2`,
      [id, g.organizationId]
    )

    await logProcurementEvent(pool, {
      organizationId: g.organizationId,
      eventType: 'PURCHASE_ORDER_AUTO_APPROVED',
      entityType: 'PurchaseOrder',
      entityId: id,
      actorId: g.userId,
      actorName: g.userName,
      summary: 'Auto-approved PO ' + po.number + ' (no rules matched)',
      metadata: { amount },
    })

    return NextResponse.json({ status: 'APPROVED', message: 'Auto-approved', steps: 0 })
  }

  const byStep: Record<number, any[]> = {}
  for (const r of matching) {
    const step = Number(r.stepNumber) || 1
    if (!byStep[step]) byStep[step] = []
    byStep[step].push(r)
  }
  const steps = Object.keys(byStep).map(n => Number(n)).sort((a, b) => a - b)
  const totalSteps = steps.length

  await pool.query(
    `DELETE FROM "ProcurementApproval" WHERE "entityType" = 'PurchaseOrder' AND "entityId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )

  const created: any[] = []
  for (const step of steps) {
    for (const rule of byStep[step]) {
      const approvalId = crypto.randomUUID()
      const slaHours = Number(rule.slaHours) || 48
      const r = await pool.query(
        `INSERT INTO "ProcurementApproval"
           (id, "organizationId", "entityType", "entityId", "stepNumber",
            "approverId", "approverRole", status, "dueAt", "createdAt", "updatedAt")
         VALUES ($1,$2,'PurchaseOrder',$3,$4,$5,$6,'PENDING',
                 NOW() + ($7 || ' hours')::interval, NOW(), NOW())
         RETURNING *`,
        [
          approvalId, g.organizationId, id, step,
          rule.approverUserId || null,
          rule.approverRole || null,
          String(slaHours),
        ]
      )
      created.push(r.rows[0])
    }
  }

  await pool.query(
    `UPDATE "PurchaseOrder"
     SET status = 'SUBMITTED',
         "totalApprovalSteps" = $3, "currentApprovalStep" = 1, "updatedAt" = NOW()
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId, totalSteps]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PURCHASE_ORDER_SUBMITTED',
    entityType: 'PurchaseOrder',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Submitted PO ' + po.number + ' (' + totalSteps + ' step(s))',
    metadata: { amount, totalSteps },
  })

  return NextResponse.json({ status: 'SUBMITTED', totalSteps, approvals: created })
})