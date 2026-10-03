export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/alerts/stale-deals?days=14
 *
 * Returns open opportunities whose most recent activity (of any kind)
 * is older than N days — or that have no activity at all. Also returns
 * the next scheduled activity per deal, if any.
 *
 * Read-only. Tenant-scoped. Never writes.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const days = Math.max(1, Math.min(365, parseInt(searchParams.get('days') || '14')))
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()

    // Open opportunities with their last activity + next pending activity
    const r = await pool.query(
      `SELECT o.id,
              o.name,
              o.amount,
              o.stage,
              o.probability,
              o."expectedCloseDate",
              o."createdAt" AS "createdAt",
              c.name AS "customerName",
              COALESCE(
                (SELECT MAX(a."createdAt") FROM "Activity" a
                 WHERE a."opportunityId" = o.id AND a."organizationId" = $1),
                NULL
              ) AS "lastActivityAt",
              (SELECT a."createdAt" FROM "Activity" a
               WHERE a."opportunityId" = o.id AND a."organizationId" = $1
               ORDER BY a."createdAt" DESC LIMIT 1) AS "lastActivityCreatedAt",
              (SELECT json_build_object(
                 'id', a.id,
                 'subject', a.subject,
                 'dueDate', a."dueDate",
                 'type', a.type
               )
               FROM "Activity" a
               WHERE a."opportunityId" = o.id
                 AND a."organizationId" = $1
                 AND a."completed" = FALSE
               ORDER BY a."dueDate" ASC NULLS LAST, a."createdAt" ASC
               LIMIT 1) AS "nextActivity"
       FROM "Opportunity" o
       LEFT JOIN "Customer" c ON c.id = o."customerId"
       WHERE o."organizationId" = $1
         AND o.stage NOT IN ('CLOSED_WON','CLOSED_LOST')
       ORDER BY o."createdAt" DESC`,
      [orgId]
    )

    const now = Date.now()
    const cutoffMs = now - days * 86400000

    const stale: any[] = []
    for (const row of r.rows) {
      // Determine the "last touch" — activity or the deal's own creation
      const lastTouchMs = row.lastActivityCreatedAt
        ? new Date(row.lastActivityCreatedAt).getTime()
        : new Date(row.createdAt).getTime()

      const daysSinceTouch = Math.floor((now - lastTouchMs) / 86400000)

      if (lastTouchMs < cutoffMs) {
        stale.push({
          ...row,
          daysSinceTouch,
          hasAnyActivity: !!row.lastActivityCreatedAt,
        })
      }
    }

    return NextResponse.json({
      days,
      stale,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Stale deals error:', (error as Error).message)
    return NextResponse.json({ stale: [], error: 'Internal server error' }, { status: 500 })
  }
}