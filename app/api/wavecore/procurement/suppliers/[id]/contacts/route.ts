export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "SupplierContact" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ contacts: r.rows })
})

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')

  const owner = await pool.query(
    `SELECT id FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (!body || !body.name) return NextResponse.json({ error: 'Contact name required' }, { status: 400 })

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  // If marking primary, unset other primaries first
  if (body.isPrimary) {
    await pool.query(
      `UPDATE "SupplierContact" SET "isPrimary" = FALSE WHERE "supplierId" = $1 AND "organizationId" = $2`,
      [ctx.params.id, g.organizationId]
    )
  }

  const r = await pool.query(
    `INSERT INTO "SupplierContact"
       (id, "organizationId", "supplierId", "name", "role", "email", "phone", "isPrimary", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, ctx.params.id,
      String(body.name).trim(),
      body.role || null,
      body.email || null,
      body.phone || null,
      Boolean(body.isPrimary),
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CONTACT_ADDED',
    entityType: 'Supplier',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added contact: ' + r.rows[0].name,
  })

  return NextResponse.json({ contact: r.rows[0] }, { status: 201 })
})