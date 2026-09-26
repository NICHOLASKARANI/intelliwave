export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

async function assertDraft(orgId: string, contractId: string) {
  const r = await pool.query(
    `SELECT status FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
    [contractId, orgId]
  )
  if (r.rowCount === 0) return { ok: false, code: 404, error: 'Contract not found' }
  if (r.rows[0].status !== 'DRAFT') return { ok: false, code: 409, error: 'Milestones can only be edited while DRAFT' }
  return { ok: true }
}

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "SupplierContractMilestone"
     WHERE "contractId" = $1 AND "organizationId" = $2
     ORDER BY "dueDate" ASC NULLS LAST, "createdAt" ASC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ milestones: r.rows })
})

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id
  const chk = await assertDraft(g.organizationId, id)
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: chk.code })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const crypto = require('crypto')
  const ins = await pool.query(
    `INSERT INTO "SupplierContractMilestone"
       (id, "organizationId", "contractId", name, "dueDate", amount, status, notes,
        "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,
             $5::timestamp,$6,'PENDING',$7,NOW(),NOW())
     RETURNING *`,
    [
      crypto.randomUUID(), g.organizationId, id, name,
      body?.dueDate || null, Number(body?.amount) || 0,
      body?.notes || null,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_MILESTONE_ADDED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added milestone ' + name,
    metadata: { milestoneId: ins.rows[0].id },
  })
  return NextResponse.json({ milestone: ins.rows[0] }, { status: 201 })
})