export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: autocomplete suggestions from 3 sources
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req).catch(() => null)
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    if (!q || q.length < 2) {
      return NextResponse.json({ live: [], recent: [], trending: [] })
    }

    // 1. Live listing matches
    const liveRes = await pool.query(
      `SELECT id AS "listingId", title, price, images
       FROM "MarketplaceListing"
       WHERE status = 'ACTIVE' AND (title ILIKE $1 OR category ILIKE $1)
       ORDER BY views DESC, "createdAt" DESC
       LIMIT 6`,
      [`%${q}%`]
    )

    // 2. Recent searches (if logged in)
    let recent: any[] = []
    if (session) {
      const recentRes = await pool.query(
        `SELECT DISTINCT query FROM "SearchHistory"
         WHERE "userId" = $1 AND query ILIKE $2 AND query != $3
         ORDER BY MAX("createdAt") OVER (PARTITION BY query) DESC
         LIMIT 5`,
        [session.userId, `%${q}%`, q]
      ).catch(() => ({ rows: [] }))
      recent = recentRes.rows.map((r: any) => r.query)
    }

    // 3. Trending (from last 7 days aggregation)
    const trendingRes = await pool.query(
      `SELECT query FROM "SearchHistory"
       WHERE "createdAt" > NOW() - INTERVAL '7 days' AND query ILIKE $1
       GROUP BY query
       ORDER BY COUNT(*) DESC
       LIMIT 5`,
      [`%${q}%`]
    )

    return NextResponse.json({
      live: liveRes.rows,
      recent,
      trending: trendingRes.rows.map((r: any) => r.query),
    })
  } catch (error: any) {
    console.error('Suggest error:', error?.message)
    return NextResponse.json({ live: [], recent: [], trending: [] })
  }
}