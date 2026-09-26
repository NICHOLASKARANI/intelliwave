export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "SupplierDocument" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ documents: r.rows })
})

export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')

  const owner = await pool.query(
    `SELECT id FROM "Supplier" WHERE id = $1 AND "organizationId" = $2`,
    [ctx.params.id, g.organizationId]
  )
  if (owner.rowCount === 0) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  for (const k of ['documentType', 'name', 'fileUrl']) {
    if (!body[k]) return NextResponse.json({ error: k + ' is required' }, { status: 400 })
  }

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const r = await pool.query(
    `INSERT INTO "SupplierDocument"
       (id, "organizationId", "supplierId", "documentType", "name", "fileUrl",
        "fileSize", "mimeType", "issueDate", "expiryDate", "status", "notes",
        "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING',$11,NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, ctx.params.id,
      body.documentType, body.name, body.fileUrl,
      body.fileSize || null, body.mimeType || null,
      body.issueDate || null, body.expiryDate || null,
      body.notes || null,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_DOCUMENT_ADDED',
    entityType: 'Supplier',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Uploaded document: ' + body.name,
    metadata: { documentType: body.documentType },
  })

  return NextResponse.json({ document: r.rows[0] }, { status: 201 })
})