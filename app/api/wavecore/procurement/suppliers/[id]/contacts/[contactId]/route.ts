export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const PATCH = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string; contactId: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const allowed = ['name', 'role', 'email', 'phone', 'isPrimary']
  const sets: string[] = []
  const params: any[] = []
  for (const k of allowed) {
    if (k in body) { params.push(body[k]); sets.push(`"${k}" = $${params.length}`) }
  }
  if (sets.length === 0) return NextResponse.json({ error: 'No updatable fields' }, { status: 400 })

  if (body.isPrimary === true) {
    await pool.query(
      `UPDATE "SupplierContact" SET "isPrimary" = FALSE
       WHERE "supplierId" = $1 AND "organizationId" = $2 AND id <> $3`,
      [ctx.params.id, g.organizationId, ctx.params.contactId]
    )
  }

  params.push(ctx.params.contactId, ctx.params.id, g.organizationId)
  const n = params.length

  const r = await pool.query(
    `UPDATE "SupplierContact" SET ${sets.join(', ')}, "updatedAt" = NOW()
     WHERE id = $${n - 2} AND "supplierId" = $${n - 1} AND "organizationId" = $${n}
     RETURNING *`,
    params
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTACT_UPDATED',
    entityType: 'Supplier',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Updated contact: ' + r.rows[0].name,
  })

  return NextResponse.json({ contact: r.rows[0] })
})

export const DELETE = procurementHandler(async (
  request: NextRequest,
  ctx: { params: { id: string; contactId: string } }
) => {
  const g = await assertProcurement(request, 'WRITE')

  const r = await pool.query(
    `DELETE FROM "SupplierContact"
     WHERE id = $1 AND "supplierId" = $2 AND "organizationId" = $3`,
    [ctx.params.contactId, ctx.params.id, g.organizationId]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTACT_DELETED',
    entityType: 'Supplier',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Deleted contact: ' + ctx.params.contactId,
  })

  return NextResponse.json({ success: true })
})