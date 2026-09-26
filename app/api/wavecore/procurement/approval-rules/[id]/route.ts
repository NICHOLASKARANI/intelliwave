export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * PATCH /api/wavecore/procurement/approval-rules/[id]
 */
export const PATCH = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const existing = await pool.query(
    `SELECT * FROM "ProcurementApprovalRule" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (existing.rowCount === 0) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = ['name', 'appliesTo', 'minAmount', 'maxAmount', 'category',
                   'departmentId', 'location', 'currency', 'approverRole',
                   'approverUserId', 'stepNumber', 'isRequired', 'slaHours', 'isActive']

  const sets: string[] = []
  const params: any[] = []
  const changes: string[] = []

  for (const k of allowed) {
    if (k in body) {
      params.push(body[k])
      sets.push('"' + k + '" = $' + params.length)
      changes.push(k)
    }
  }

  if (sets.length === 0) return NextResponse.json({ error: 'No updatable fields' }, { status: 400 })

  params.push(ctx.params.id, g.organizationId)
  const n = params.length

  const r = await pool.query(
    `UPDATE "ProcurementApprovalRule"
     SET ${sets.join(', ')}, "updatedAt" = NOW()
     WHERE id = $${n - 1} AND "organizationId" = $${n}
     RETURNING *`,
    params
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PROCUREMENT_APPROVAL_RULE_UPDATED',
    entityType: 'ProcurementApprovalRule',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated approval rule: ' + (r.rows[0]?.name || ctx.params.id),
    metadata: { fields: changes },
  })

  return NextResponse.json({ rule: r.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/approval-rules/[id]
 */
export const DELETE = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const r = await pool.query(
    `DELETE FROM "ProcurementApprovalRule"
     WHERE id = $1 AND "organizationId" = $2
     RETURNING name`,
    [ctx.params.id, g.organizationId]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'PROCUREMENT_APPROVAL_RULE_DELETED',
    entityType: 'ProcurementApprovalRule',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted approval rule: ' + (r.rows[0]?.name || ctx.params.id),
  })

  return NextResponse.json({ success: true })
})