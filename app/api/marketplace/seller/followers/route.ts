export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: Seller's own followers list
// Multi-tenant: only returns followers of the CURRENT authenticated seller
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sellerId = session.userId
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const period = searchParams.get('period') || 'all' // all | week | month

    let dateFilter = ''
    if (period === 'week') {
      dateFilter = 'AND f."createdAt" >= NOW() - INTERVAL \'7 days\''
    } else if (period === 'month') {
      dateFilter = 'AND f."createdAt" >= NOW() - INTERVAL \'30 days\''
    }

    // Total count
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM "MarketplaceFollow" f
       WHERE f."sellerId" = $1 ${dateFilter}`,
      [sellerId]
    )
    const total = countRes.rows[0]?.total || 0

    // Follower list with user info
    const followersRes = await pool.query(
      `SELECT f.id, f."createdAt" AS "followedAt",
              u.id AS "userId", u.name AS "userName", u.image AS "userImage",
              u.email AS "userEmail"
       FROM "MarketplaceFollow" f
       LEFT JOIN "User" u ON u.id = f."userId"
       WHERE f."sellerId" = $1 ${dateFilter}
       ORDER BY f."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [sellerId, limit, offset]
    )

    // Follower growth (last 7 days count per day)
    const growthRes = await pool.query(
      `SELECT
         TO_CHAR(date_trunc('day', "createdAt"), 'Dy') AS day,
         date_trunc('day', "createdAt")::date AS date_bucket,
         COUNT(*)::int AS count
       FROM "MarketplaceFollow"
       WHERE "sellerId" = $1 AND "createdAt" >= NOW() - INTERVAL '7 days'
       GROUP BY day, date_bucket
       ORDER BY date_bucket ASC`,
      [sellerId]
    )

    return NextResponse.json({
      total,
      period,
      limit,
      offset,
      followers: followersRes.rows.map(r => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName || 'Anonymous',
        userImage: r.userImage,
        userEmail: r.userEmail ? r.userEmail.split('@')[0] + '@***' : null, // masked email
        followedAt: r.followedAt,
      })),
      growth: growthRes.rows.map(r => ({ day: r.day.trim(), count: r.count })),
    })
  } catch (error: any) {
    console.error('Seller followers GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load followers' }, { status: 500 })
  }
}