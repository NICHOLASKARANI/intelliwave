export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "SupplierRisk" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "detectedAt" DESC`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ risks: r.rows })
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
  if (!body.riskType || !body.title) {
    return NextResponse.json({ error: 'riskType and title are required' }, { status: 400 })
  }
  const validSeverity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const severity = validSeverity.includes(body.severity) ? body.severity : 'LOW'

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const r = await pool.query(
    `INSERT INTO "SupplierRisk"
       (id, "organizationId", "supplierId", "riskType", "severity", "title",
        "description", "detectedBy", "status", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'OPEN',NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, ctx.params.id,
      body.riskType, severity, String(body.title).trim(),
      body.description || null,
      g.userName,
    ]
  )

  // Bump supplier's riskScore/riskLevel if HIGH or CRITICAL
  if (severity === 'HIGH' || severity === 'CRITICAL') {
    await pool.query(
      `UPDATE "Supplier"
       SET "riskLevel" = CASE
             WHEN $1 = 'CRITICAL' THEN 'CRITICAL'
             WHEN "riskLevel" = 'CRITICAL' THEN 'CRITICAL'
             WHEN $1 = 'HIGH' THEN 'HIGH'
             ELSE "riskLevel" END,
           "riskScore" = LEAST(100, COALESCE("riskScore", 0) + CASE WHEN $1 = 'CRITICAL' THEN 30 ELSE 15 END),
           "updatedAt" = NOW()
       WHERE id = $2 AND "organizationId" = $3`,
      [severity, ctx.params.id, g.organizationId]
    )
  }

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_RISK_FLAGGED',
    entityType: 'Supplier',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Flagged risk [' + severity + ']: ' + body.title,
    metadata: { riskType: body.riskType, severity },
  })

  return NextResponse.json({ risk: r.rows[0] }, { status: 201 })
})