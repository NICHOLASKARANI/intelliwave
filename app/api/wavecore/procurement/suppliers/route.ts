export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/suppliers
 * Query params:
 *   q         — search by name/legalName/taxPin
 *   status    — filter by status
 *   category  — filter by category
 *   limit     — max 100, default 50
 *   offset    — default 0
 *   sort      — name | createdAt | riskScore (default: createdAt desc)
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')

  const { searchParams } = new URL(request.url)
  const q        = (searchParams.get('q') || '').trim()
  const status   = searchParams.get('status')
  const category = searchParams.get('category')
  const sort     = searchParams.get('sort') || 'createdAt'
  const order    = (searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const limit    = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100)
  const offset   = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['"organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    where.push('("name" ILIKE $' + params.length + ' OR "legalName" ILIKE $' + params.length + ' OR "taxPin" ILIKE $' + params.length + ')')
  }
  if (status) {
    params.push(status)
    where.push('"status" = $' + params.length)
  }
  if (category) {
    params.push(category)
    where.push('"category" = $' + params.length)
  }

  const sortCol = {
    name: '"name"',
    createdAt: '"createdAt"',
    riskScore: '"riskScore"',
    rating: '"rating"',
  }[sort] || '"createdAt"'

  const whereSQL = where.join(' AND ')

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "Supplier" WHERE ${whereSQL}`,
    params
  )
  const total = countResult.rows[0]?.total || 0

  const listParams = [...params, limit, offset]
  const listResult = await pool.query(
    `SELECT
       id, "organizationId", "name", "legalName", "tradingName",
       "registrationNumber", "taxPin", "vatStatus", "country", "county",
       "city", "address", "primaryEmail", "primaryPhone", email, phone,
       "currency", "paymentTerms", "creditLimit", "status",
       "isPreferred", "isBlacklisted", "category", "notes",
       "riskScore", "riskLevel", "rating",
       "onboardedAt", "createdAt", "updatedAt"
     FROM "Supplier"
     WHERE ${whereSQL}
     ORDER BY ${sortCol} ${order} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    listParams
  )

  return NextResponse.json({
    suppliers: listResult.rows,
    total,
    limit,
    offset,
  })
})

/**
 * POST /api/wavecore/procurement/suppliers
 * Body: { name (required), legalName?, tradingName?, registrationNumber?,
 *         taxPin?, vatStatus?, country?, county?, address?, city?,
 *         primaryEmail?, primaryPhone?, email?, phone?, currency?,
 *         paymentTerms?, creditLimit?, category?, notes? }
 */
export const POST = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
  if (name.length > 200) return NextResponse.json({ error: 'Name too long (max 200)' }, { status: 400 })

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const result = await pool.query(
    `INSERT INTO "Supplier" (
       id, "organizationId", "name", "legalName", "tradingName",
       "registrationNumber", "taxPin", "vatStatus", "country", "county",
       "address", "city", "primaryEmail", "primaryPhone", "email", "phone",
       "currency", "paymentTerms", "creditLimit", "status",
       "isPreferred", "isBlacklisted", "category", "notes",
       "riskScore", "riskLevel", "rating", "createdBy", "createdAt", "updatedAt"
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
       $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,NOW(),NOW()
     )
     RETURNING *`,
    [
      id,
      g.organizationId,
      name,
      body?.legalName || null,
      body?.tradingName || null,
      body?.registrationNumber || null,
      body?.taxPin || null,
      body?.vatStatus || 'NOT_REGISTERED',
      body?.country || 'KE',
      body?.county || null,
      body?.address || null,
      body?.city || null,
      body?.primaryEmail || null,
      body?.primaryPhone || null,
      body?.email || null,
      body?.phone || null,
      body?.currency || 'KES',
      Number.isFinite(Number(body?.paymentTerms)) ? Number(body.paymentTerms) : 30,
      Number.isFinite(Number(body?.creditLimit)) ? Number(body.creditLimit) : 0,
      'ACTIVE',
      Boolean(body?.isPreferred),
      false,
      body?.category || 'General',
      body?.notes || null,
      0,
      'LOW',
      0,
      g.userId,
    ]
  )

  const supplier = result.rows[0]

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIER_CREATED',
    entityType: 'Supplier',
    entityId: supplier.id,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Created supplier: ' + supplier.name,
    metadata: { category: supplier.category },
  })

  return NextResponse.json({ supplier }, { status: 201 })
})