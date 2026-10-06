export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

/**
 * GET /api/wavecore/crm/reports/leaderboard?from=&to=
 *
 * Per-user sales performance for the caller's org.
 *
 *   - Open pipeline:        opportunities not in CLOSED_WON / CLOSED_LOST
 *   - Won / lost counts     from stage
 *   - Won value             sum(amount) where stage = CLOSED_WON
 *   - Win rate              won / (won + lost)
 *   - Avg deal size         won value / won count
 *   - Activities (period)   count of Activity.createdAt between from..to
 *   - Customers created     count of Customer.createdAt between from..to
 *
 * All restricted to Organization.members via _OrganizationMembers.
 * Opportunities with assignedToId NULL are grouped as "Unassigned".
 *
 * Read-only. Tenant-scoped. from/to default to last 30 days if unset.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 30 * 86400_000)
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid from/to date' }, { status: 400 })
    }
    // Include the whole "to" day
    const toEnd = new Date(to.getTime() + 86400_000)

    // 1. Org members
    let members: any[] = []
    try {
      const m = await pool.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM "User" u
         JOIN "_OrganizationMembers" om ON om."B" = u.id
         WHERE om."A" = $1 AND u."isActive" = TRUE
         ORDER BY u.name ASC NULLS LAST`,
        [orgId]
      )
      members = m.rows
    } catch {
      const m = await pool.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM "User" u
         JOIN "Organization" o ON o."ownerId" = u.id
         WHERE o.id = $1 AND u."isActive" = TRUE`,
        [orgId]
      )
      members = m.rows
    }

    // 2. Opportunities aggregated by assignedToId
    const oppAgg = await pool.query(
      `SELECT "assignedToId",
              COUNT(*) FILTER (WHERE stage NOT IN ('CLOSED_WON','CLOSED_LOST')) AS "openCount",
              COALESCE(SUM(amount) FILTER (WHERE stage NOT IN ('CLOSED_WON','CLOSED_LOST')), 0) AS "openValue",
              COUNT(*) FILTER (WHERE stage = 'CLOSED_WON') AS "wonCount",
              COALESCE(SUM(amount) FILTER (WHERE stage = 'CLOSED_WON'), 0) AS "wonValue",
              COUNT(*) FILTER (WHERE stage = 'CLOSED_LOST') AS "lostCount",
              COALESCE(SUM(amount) FILTER (WHERE stage = 'CLOSED_LOST'), 0) AS "lostValue"
       FROM "Opportunity"
       WHERE "organizationId" = $1
       GROUP BY "assignedToId"`,
      [orgId]
    )
    const oppByUser: Record<string, any> = {}
    for (const r of oppAgg.rows) {
      oppByUser[r.assignedToId || '__unassigned__'] = r
    }

    // 3. Activities in period
    const actAgg = await pool.query(
      `SELECT "assignedToId", COUNT(*) AS "activityCount"
       FROM "Activity"
       WHERE "organizationId" = $1 AND "createdAt" >= $2 AND "createdAt" < $3
       GROUP BY "assignedToId"`,
      [orgId, from, toEnd]
    ).catch(() => ({ rows: [] as any[] }))
    const actByUser: Record<string, number> = {}
    for (const r of actAgg.rows) actByUser[r.assignedToId || '__unassigned__'] = Number(r.activityCount)

    // 4. Customers created in period (Customer has no assignedToId — count globally)
    const custRes = await pool.query(
      `SELECT COUNT(*) AS n FROM "Customer"
       WHERE "organizationId" = $1 AND "createdAt" >= $2 AND "createdAt" < $3`,
      [orgId, from, toEnd]
    ).catch(() => ({ rows: [{ n: 0 }] }))
    const totalCustomersCreated = Number(custRes.rows[0]?.n || 0)

    // 5. Build rows per user + a special Unassigned row if needed
    const rows = members.map((m: any) => {
      const o = oppByUser[m.id] || {}
      const won = Number(o.wonCount || 0)
      const lost = Number(o.lostCount || 0)
      const closed = won + lost
      return {
        userId: m.id,
        name: m.name || (m.email || '').split('@')[0] || 'Unnamed',
        email: m.email,
        role: m.role,
        openCount: Number(o.openCount || 0),
        openValue: round2(Number(o.openValue || 0)),
        wonCount: won,
        wonValue: round2(Number(o.wonValue || 0)),
        lostCount: lost,
        lostValue: round2(Number(o.lostValue || 0)),
        winRate: closed > 0 ? Math.round((won / closed) * 100) : null,
        avgDealSize: won > 0 ? round2(Number(o.wonValue) / won) : null,
        activityCount: actByUser[m.id] || 0,
      }
    })

    // Unassigned bucket — deals with no owner
    const u = oppByUser['__unassigned__']
    if (u) {
      const won = Number(u.wonCount || 0)
      const lost = Number(u.lostCount || 0)
      const closed = won + lost
      rows.push({
        userId: null,
        name: 'Unassigned',
        email: null,
        role: null,
        openCount: Number(u.openCount || 0),
        openValue: round2(Number(u.openValue || 0)),
        wonCount: won,
        wonValue: round2(Number(u.wonValue || 0)),
        lostCount: lost,
        lostValue: round2(Number(u.lostValue || 0)),
        winRate: closed > 0 ? Math.round((won / closed) * 100) : null,
        avgDealSize: won > 0 ? round2(Number(u.wonValue) / won) : null,
        activityCount: actByUser['__unassigned__'] || 0,
      } as any)
    }

    // Sort: won value desc, then open value desc
    rows.sort((a: any, b: any) => (b.wonValue - a.wonValue) || (b.openValue - a.openValue))

    // Totals for the KPI strip
    const totals: {
      members: number
      unassignedDeals: number
      openValue: number
      wonValue: number
      wonCount: number
      lostCount: number
      customersCreated: number
      activities: number
      winRate: number | null
    } = {
      members: members.length,
      unassignedDeals: u ? Number(u.openCount || 0) + Number(u.wonCount || 0) + Number(u.lostCount || 0) : 0,
      openValue: round2(rows.reduce((s: number, r: any) => s + r.openValue, 0)),
      wonValue: round2(rows.reduce((s: number, r: any) => s + r.wonValue, 0)),
      wonCount: rows.reduce((s: number, r: any) => s + r.wonCount, 0),
      lostCount: rows.reduce((s: number, r: any) => s + r.lostCount, 0),
      customersCreated: totalCustomersCreated,
      activities: rows.reduce((s: number, r: any) => s + r.activityCount, 0),
      winRate: null,
    }
    totals.winRate = (totals.wonCount + totals.lostCount) > 0
      ? Math.round((totals.wonCount / (totals.wonCount + totals.lostCount)) * 100)
      : null

    return NextResponse.json({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      rows,
      totals,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[crm/leaderboard]', error)
    return NextResponse.json({ rows: [], totals: {}, error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
