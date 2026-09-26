export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/contracts/[id]
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const id = ctx.params.id

  const cRes = await pool.query(
    `SELECT * FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cRes.rowCount === 0) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }
  const contract = cRes.rows[0]

  const [linesRes, msRes, supplierRes] = await Promise.all([
    pool.query(
      `SELECT * FROM "SupplierContractLine"
       WHERE "contractId" = $1 AND "organizationId" = $2
       ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
      [id, g.organizationId]
    ),
    pool.query(
      `SELECT * FROM "SupplierContractMilestone"
       WHERE "contractId" = $1 AND "organizationId" = $2
       ORDER BY "dueDate" ASC NULLS LAST, "createdAt" ASC`,
      [id, g.organizationId]
    ),
    contract.supplierId
      ? pool.query(
          `SELECT id, name, "legalName", email, phone, address, city, country, "taxPin"
           FROM "Supplier" WHERE id = $1`,
          [contract.supplierId]
        )
      : Promise.resolve({ rows: [] }),
  ])

  return NextResponse.json({
    contract,
    lines: linesRes.rows,
    milestones: msRes.rows,
    supplier: supplierRes.rows[0] || null,
  })
})

/**
 * PATCH /api/wavecore/procurement/contracts/[id]
 * Editable while status ∈ { DRAFT, ACTIVE }.
 */
export const PATCH = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const cur = await pool.query(
    `SELECT status FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  if (!['DRAFT', 'ACTIVE'].includes(cur.rows[0].status)) {
    return NextResponse.json({ error: 'Cannot edit contract in status ' + cur.rows[0].status }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const editable: Record<string, string> = {
    title: 'title',
    startDate: 'startDate',
    endDate: 'endDate',
    value: 'value',
    currency: 'currency',
    paymentTerms: 'paymentTerms',
    autoRenew: 'autoRenew',
    renewalNoticeDays: 'renewalNoticeDays',
    contractFileUrl: 'contractFileUrl',
    notes: 'notes',
  }
  const sets: string[] = []
  const values: any[] = []
  for (const [k, col] of Object.entries(editable)) {
    if (k in body) {
      values.push(body[k] === '' ? null : body[k])
      sets.push(`"${col}" = $${values.length}`)
    }
  }
  if (sets.length === 0) return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  sets.push(`"updatedAt" = NOW()`)

  values.push(id)
  const idParam = values.length
  values.push(g.organizationId)
  const orgParam = values.length

  const upd = await pool.query(
    `UPDATE "SupplierContract" SET ${sets.join(', ')}
     WHERE id = $${idParam} AND "organizationId" = $${orgParam}
     RETURNING *`,
    values
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_UPDATED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated contract header',
    metadata: { fields: Object.keys(body) },
  })

  return NextResponse.json({ contract: upd.rows[0] })
})

/**
 * DELETE /api/wavecore/procurement/contracts/[id]
 * DRAFT only. Cascades lines + milestones.
 */
export const DELETE = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const cur = await pool.query(
    `SELECT status, "contractNumber" FROM "SupplierContract"
     WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  if (cur.rows[0].status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT contracts can be deleted' }, { status: 409 })
  }

  await pool.query(`DELETE FROM "SupplierContractLine" WHERE "contractId" = $1 AND "organizationId" = $2`, [id, g.organizationId])
  await pool.query(`DELETE FROM "SupplierContractMilestone" WHERE "contractId" = $1 AND "organizationId" = $2`, [id, g.organizationId])
  await pool.query(`DELETE FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`, [id, g.organizationId])

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTRACT_DELETED',
    entityType: 'SupplierContract',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted contract ' + cur.rows[0].contractNumber,
    metadata: { contractNumber: cur.rows[0].contractNumber },
  })

  return NextResponse.json({ ok: true })
})