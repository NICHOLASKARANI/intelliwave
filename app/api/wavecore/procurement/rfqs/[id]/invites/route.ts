export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT i.*, s.name AS "supplierName", s."legalName" AS "supplierLegalName",
            s.email AS "supplierEmail"
     FROM "RFQSupplierInvite" i
     LEFT JOIN "Supplier" s ON s.id = i."supplierId"
     WHERE i."rfqId" = $1 AND i."organizationId" = $2
     ORDER BY i."invitedAt" ASC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ invites: r.rows })
})

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const id = ctx.params.id

  const cur = await pool.query(
    `SELECT status FROM "RFQ" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (cur.rowCount === 0) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  if (!['DRAFT','PUBLISHED'].includes(cur.rows[0].status)) {
    return NextResponse.json({ error: 'Cannot add invites in status ' + cur.rows[0].status }, { status: 409 })
  }

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supplierIds: string[] = Array.isArray(body?.supplierIds)
    ? body.supplierIds.map((s: any) => String(s)).filter(Boolean)
    : (body?.supplierId ? [String(body.supplierId)] : [])
  if (supplierIds.length === 0) return NextResponse.json({ error: 'supplierId or supplierIds required' }, { status: 400 })

  const crypto = require('crypto')
  const inserted: any[] = []
  for (const sid of supplierIds) {
    const exists = await pool.query(
      `SELECT id FROM "RFQSupplierInvite"
       WHERE "rfqId" = $1 AND "supplierId" = $2 AND "organizationId" = $3`,
      [id, sid, g.organizationId]
    )
    if (exists.rowCount > 0) continue

    const r = await pool.query(
      `INSERT INTO "RFQSupplierInvite"
         (id, "organizationId", "rfqId", "supplierId", status, "invitedAt",
          "inviteToken", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,'INVITED',NOW(),$5,NOW(),NOW())
       RETURNING *`,
      [crypto.randomUUID(), g.organizationId, id, sid, crypto.randomUUID()]
    )
    inserted.push(r.rows[0])
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'RFQ_INVITES_ADDED',
    entityType: 'RFQ',
    entityId: id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added ' + inserted.length + ' invite(s)',
    metadata: { count: inserted.length },
  })

  return NextResponse.json({ invites: inserted }, { status: 201 })
})