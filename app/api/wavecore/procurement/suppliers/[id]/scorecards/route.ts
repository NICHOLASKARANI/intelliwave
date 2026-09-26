export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const r = await pool.query(
    `SELECT * FROM "SupplierScorecard" WHERE "supplierId" = $1 AND "organizationId" = $2 ORDER BY "periodEnd" DESC LIMIT 24`,
    [ctx.params.id, g.organizationId]
  )
  return NextResponse.json({ scorecards: r.rows })
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
  if (!body.periodStart || !body.periodEnd) {
    return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
  }

  const num = (v: any, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d
  const clamp = (v: number) => Math.max(0, Math.min(100, v))

  const delivery       = clamp(num(body.deliveryScore))
  const quality        = clamp(num(body.qualityScore))
  const price          = clamp(num(body.priceScore))
  const responsiveness = clamp(num(body.responsivenessScore))
  const compliance     = clamp(num(body.complianceScore))
  const overall        = Math.round((delivery + quality + price + responsiveness + compliance) / 5)

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const r = await pool.query(
    `INSERT INTO "SupplierScorecard"
       (id, "organizationId", "supplierId", "periodStart", "periodEnd",
        "deliveryScore", "qualityScore", "priceScore", "responsivenessScore",
        "complianceScore", "overallScore", "onTimeDeliveryPct", "fillRatePct",
        "defectRatePct", "notes", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
     RETURNING *`,
    [
      id, g.organizationId, ctx.params.id,
      body.periodStart, body.periodEnd,
      delivery, quality, price, responsiveness, compliance, overall,
      body.onTimeDeliveryPct ?? null,
      body.fillRatePct ?? null,
      body.defectRatePct ?? null,
      body.notes || null,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_SCORECARD_ADDED',
    entityType: 'Supplier',
    entityId: ctx.params.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Added scorecard — overall ' + overall,
    metadata: { periodStart: body.periodStart, periodEnd: body.periodEnd, overall },
  })

  return NextResponse.json({ scorecard: r.rows[0] }, { status: 201 })
})