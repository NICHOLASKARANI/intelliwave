export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/activity
 * Filters: q, eventType, entityType, entityId, actorId, fromDate, toDate
 * Sort: createdAt DESC
 * Pagination: limit (max 200, default 50), offset
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)

  const q = (searchParams.get('q') || '').trim()
  const eventType = searchParams.get('eventType')
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')
  const actorId = searchParams.get('actorId')
  const fromDate = searchParams.get('fromDate')
  const toDate = searchParams.get('toDate')
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  const where: string[] = ['"organizationId" = $1']
  const params: any[] = [g.organizationId]

  if (q) {
    params.push('%' + q + '%')
    const n = params.length
    where.push('(summary ILIKE $' + n + ' OR "actorName" ILIKE $' + n + ' OR "eventType" ILIKE $' + n + ')')
  }

  if (eventType) {
    const types = String(eventType).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    if (types.length > 0) {
      params.push(types)
      where.push('"eventType" = ANY($' + params.length + '::text[])')
    }
  }
  if (entityType) { params.push(entityType); where.push('"entityType" = $' + params.length) }
  if (entityId) { params.push(entityId); where.push('"entityId" = $' + params.length) }
  if (actorId) { params.push(actorId); where.push('"actorId" = $' + params.length) }
  if (fromDate) { params.push(fromDate); where.push('"createdAt" >= $' + params.length + '::timestamp') }
  if (toDate) { params.push(toDate); where.push('"createdAt" <= ($' + params.length + '::timestamp + interval \'1 day\')') }

  const whereSQL = where.join(' AND ')

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM "ProcurementEvent" WHERE ${whereSQL}`,
    params
  )
  const total = countRes.rows[0]?.total || 0

  const listRes = await pool.query(
    `SELECT id, "eventType", "entityType", "entityId",
            summary, "actorId", "actorName", metadata, "createdAt"
     FROM "ProcurementEvent"
     WHERE ${whereSQL}
     ORDER BY "createdAt" DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    events: listRes.rows,
    total,
    limit,
    offset,
  })
})