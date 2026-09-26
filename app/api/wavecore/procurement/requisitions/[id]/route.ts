export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function ensureOwnership(id: string, orgId: string) {
  const r = await pool.query(
    `SELECT * FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
    [id, orgId]
  )
  return r.rowCount! > 0 ? r.rows[0] : null
}

/**
 * GET /api/wavecore/procurement/requisitions/[id]
 * Returns full detail: requisition + lines + approvals + events.
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const req = await ensureOwnership(id, g.organizationId)
  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })

  const [linesRes, approvalsRes, eventsRes] = await Promise.all([
    pool.query(
      `SELECT * FROM "PurchaseRequisitionLine"
       WHERE "requisitionId" = $1 AND "organizationId" = $2
       ORDER BY "lineNumber" ASC`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT * FROM "PurchaseRequisitionApproval"
       WHERE "requisitionId" = $1 AND "organizationId" = $2
       ORDER BY "stepNumber" ASC`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT id, "eventType", "summary", "actorName", metadata, "createdAt"
       FROM "ProcurementEvent"
       WHERE "entityType" = 'PurchaseRequisition' AND "entityId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [id, g.organizationId]
    ),
  ])

  return NextResponse.json({
    requisition: req,
    lines: linesRes.rows,
    approvals: approvalsRes.rows,
    activity: eventsRes.rows,
  })
})

/**
 * PATCH /api/wavecore/procurement/requisitions/[id]
 * Update draft requisitions. Non-draft → 409.
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const req = await ensureOwnership(id, g.organizationId)
  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  if (req.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT requisitions can be edited (current: ' + req.status + ')' }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = ['title', 'description', 'category', 'priority', 'type', 'departmentId',
                   'projectId', 'costCenter', 'location', 'currency', 'neededBy',
                   'budgetId', 'isEmergency', 'isRecurring', 'notes']

  const sets: string[] = []
  const params: any[] = []
  const fields: string[] = []

  for (const k of allowed) {
    if (k in body) {
      params.push(body[k])
      sets.push('"' + k + '" = $' + params.length)
      fields.push(k)
    }
  }

  if (sets.length === 0) return NextResponse.json({ error: 'No updatable fields' }, { status: 400 })

  params.push(id, g.organizationId)
  const n = params.length

  const r = await pool.query(
    `UPDATE "PurchaseRequisition" SET ${sets.join(', ')}, "updatedAt" = NOW()
     WHERE id = $${n - 1} AND "organizationId" = $${n}
     RETURNING *`,
    params
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_UPDATED',
    entityType: 'PurchaseRequisition',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated requisition ' + (r.rows[0]?.requisitionNumber || id),
    metadata: { fields },
  })

  return NextResponse.json({ requisition: r.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/requisitions/[id]
 * Only DRAFT requisitions can be deleted.
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const req = await ensureOwnership(id, g.organizationId)
  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  if (req.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT requisitions can be deleted (current: ' + req.status + ')' }, { status: 409 })
  }

  // Delete lines first (they have FK ON DELETE CASCADE anyway, but be explicit)
  await pool.query(
    `DELETE FROM "PurchaseRequisitionLine" WHERE "requisitionId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  await pool.query(
    `DELETE FROM "PurchaseRequisitionApproval" WHERE "requisitionId" = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  await pool.query(
    `DELETE FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_DELETED',
    entityType: 'PurchaseRequisition',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted draft requisition ' + (req.requisitionNumber || id),
  })

  return NextResponse.json({ success: true })
})