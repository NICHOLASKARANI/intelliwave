export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * PATCH /api/wavecore/procurement/suppliers/bulk
 * Body: { ids: string[], action: 'ACTIVATE' | 'DEACTIVATE' | 'PREFER' | 'UNPREFER', value?: boolean }
 *
 * Tenant-scoped, RBAC-guarded. Applies the action to every supplier in `ids`
 * that belongs to the caller's organization. Returns counts of matched /
 * updated, plus any ids that were skipped (not found in this org).
 */
export const PATCH = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'WRITE')

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }
  if (body.ids.length > 500) {
    return NextResponse.json({ error: 'Too many ids (max 500)' }, { status: 400 })
  }

  const action = String(body.action || '').toUpperCase()
  const allowed = ['ACTIVATE', 'DEACTIVATE', 'PREFER', 'UNPREFER']
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: 'Invalid action. Allowed: ' + allowed.join(', ') }, { status: 400 })
  }

  // Whitelist ids to strings
  const ids: string[] = body.ids.map((x: any) => String(x)).filter(Boolean)
  if (ids.length === 0) return NextResponse.json({ error: 'No valid ids' }, { status: 400 })

  // Figure out which ids actually belong to this org
  const checkRes = await pool.query(
    `SELECT id FROM "Supplier" WHERE "organizationId" = $1 AND id = ANY($2::text[])`,
    [g.organizationId, ids]
  )
  const allowedIds: string[] = checkRes.rows.map((r: any) => r.id)
  const skipped = ids.filter(i => !allowedIds.includes(i))

  if (allowedIds.length === 0) {
    return NextResponse.json({ updated: 0, skipped, message: 'No suppliers matched' })
  }

  let updateSQL = ''
  switch (action) {
    case 'ACTIVATE':
      updateSQL = `UPDATE "Supplier" SET "status" = 'ACTIVE', "updatedAt" = NOW() WHERE "organizationId" = $1 AND id = ANY($2::text[])`
      break
    case 'DEACTIVATE':
      updateSQL = `UPDATE "Supplier" SET "status" = 'INACTIVE', "updatedAt" = NOW() WHERE "organizationId" = $1 AND id = ANY($2::text[])`
      break
    case 'PREFER':
      updateSQL = `UPDATE "Supplier" SET "isPreferred" = TRUE, "updatedAt" = NOW() WHERE "organizationId" = $1 AND id = ANY($2::text[])`
      break
    case 'UNPREFER':
      updateSQL = `UPDATE "Supplier" SET "isPreferred" = FALSE, "updatedAt" = NOW() WHERE "organizationId" = $1 AND id = ANY($2::text[])`
      break
  }

  const result = await pool.query(updateSQL, [g.organizationId, allowedIds])
  const updated = result.rowCount || 0

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'SUPPLIERS_BULK_' + action,
    entityType: 'Supplier',
    entityId: 'bulk:' + allowedIds.length,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Bulk ' + action.toLowerCase() + ' on ' + updated + ' supplier(s)',
    metadata: { action, updated, skipped: skipped.length, ids: allowedIds.slice(0, 50) },
  })

  return NextResponse.json({ updated, skipped, action })
})