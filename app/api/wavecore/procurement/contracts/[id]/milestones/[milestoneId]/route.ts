export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const ALLOWED_STATUS = ['PENDING','DONE','MISSED']

async function assertDraftOwned(orgId: string, contractId: string, msId: string) {
  const c = await pool.query(
    `SELECT status FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
    [contractId, orgId]
  )
  if (c.rowCount === 0) return { ok: false, code: 404, error: 'Contract not found' }
  if (c.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Milestones can only be edited while DRAFT' }

  const m = await pool.query(
    `SELECT * FROM "SupplierContractMilestone"
     WHERE id = $1 AND "contractId" = $2 AND "organizationId" = $3`,
    [msId, contractId, orgId]
  )
  if (m.rowCount === 0) return { ok: false, code: 404, error: 'Milestone not found' }
  return { ok: true, milestone: m.rows[0] }
}

export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; milestoneId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, milestoneId } = ctx.params
  const chk = await assertDraftOwned(g.organizationId, id, milestoneId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })
  const m = chk.milestone

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = 'name' in body ? String(body.name).trim() : m.name
  if (!name) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })

  const dueDate = 'dueDate' in body ? (body.dueDate || null) : m.dueDate
  const amount = 'amount' in body ? Number(body.amount) : Number(m.amount)
  const status = 'status' in body ? String(body.status).toUpperCase() : m.status
  if (!ALLOWED_STATUS.includes(status)) {
    return NextResponse.json({ error: 'status must be PENDING | DONE | MISSED' }, { status: 400 })
  }
  const notes = 'notes' in body ? body.notes : m.notes

  const upd = await pool.query(
    `UPDATE "SupplierContractMilestone" SET
       name      = $1,
       "dueDate" = $2::timestamp,
       amount    = $3,
       status    = $4,
       notes     = $5,
       "updatedAt" = NOW()
     WHERE id = $6 AND "contractId" = $7 AND "organizationId" = $8
     RETURNING *`,
    [name, dueDate, amount, status, notes, milestoneId, id, g.organizationId]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_MILESTONE_UPDATED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated milestone ' + name,
    metadata: { milestoneId, status },
  })
  return NextResponse.json({ milestone: upd.rows[0] })
})

export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string; milestoneId: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const { id, milestoneId } = ctx.params
  const chk = await assertDraftOwned(g.organizationId, id, milestoneId)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  await pool.query(
    `DELETE FROM "SupplierContractMilestone"
     WHERE id = $1 AND "contractId" = $2 AND "organizationId" = $3`,
    [milestoneId, id, g.organizationId]
  )
  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_MILESTONE_REMOVED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Removed milestone ' + chk.milestone.name,
    metadata: { milestoneId },
  })
  return NextResponse.json({ ok: true })
})