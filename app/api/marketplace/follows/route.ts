export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { notifyNewFollower } from '@/lib/marketplace/notifications'

// GET: Get follow status + follower count for a seller OR user's followed sellers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sellerId = searchParams.get('sellerId')
    const myFollows = searchParams.get('myFollows') === 'true'

    // Mode 1: User's list of followed sellers
    if (myFollows) {
      const session = await requireTenant(req)
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const result = await pool.query(
        `SELECT f."sellerId", f."createdAt",
                sp."storeName", sp."storeLogo", sp."averageRating", sp."totalReviews",
                sp."verification",
                u.name AS "sellerName",
                (SELECT COUNT(*)::int FROM "MarketplaceFollow" f2 WHERE f2."sellerId" = f."sellerId") AS "followerCount",
                (SELECT COUNT(*)::int FROM "MarketplaceListing" l WHERE l."sellerId" = f."sellerId" AND l.status = 'ACTIVE') AS "listingCount"
         FROM "MarketplaceFollow" f
         LEFT JOIN "SellerProfile" sp ON sp."userId" = f."sellerId"
         LEFT JOIN "User" u ON u.id = f."sellerId"
         WHERE f."userId" = $1
         ORDER BY f."createdAt" DESC`,
        [session.userId]
      )

      return NextResponse.json({
        follows: result.rows.map(r => ({
          sellerId: r.sellerId,
          sellerName: r.storeName || r.sellerName || 'Seller',
          sellerLogo: r.storeLogo,
          averageRating: r.averageRating,
          totalReviews: r.totalReviews,
          verification: r.verification,
          followerCount: r.followerCount,
          listingCount: r.listingCount,
          followedAt: r.createdAt,
        })),
        total: result.rows.length,
      })
    }

    // Mode 2: Check follow status for a specific seller
    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId or myFollows required' }, { status: 400 })
    }

    // Get follower count

    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceFollow" WHERE "sellerId" = $1',
      [sellerId]
    )
    const followerCount = countRes.rows[0]?.count || 0

    // Check if current user follows (optional auth)
    let following = false
    let userId = null
    try {
      const session = await requireTenant(req)
      if (session) {
        userId = session.userId
        const followRes = await pool.query(
          'SELECT id FROM "MarketplaceFollow" WHERE "userId" = $1 AND "sellerId" = $2 LIMIT 1',
          [userId, sellerId]
        )
        following = followRes.rows.length > 0
      }
    } catch {}

    return NextResponse.json({
      followerCount,
      following,
      authenticated: !!userId,
      isSelf: userId === sellerId,
    })
  } catch (error: any) {
    console.error('Follows GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

// POST: Follow a seller (requires auth)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { sellerId } = body

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId required' }, { status: 400 })
    }

    if (sellerId === session.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Verify seller exists
    const sellerRes = await pool.query(
      'SELECT id FROM "User" WHERE id = $1',
      [sellerId]
    )
    if (sellerRes.rows.length === 0) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Check if already following
    const existingRes = await pool.query(
      'SELECT id FROM "MarketplaceFollow" WHERE "userId" = $1 AND "sellerId" = $2 LIMIT 1',
      [session.userId, sellerId]
    )

    if (existingRes.rows.length === 0) {
      const crypto = require('crypto')
      const followId = crypto.randomUUID()
      await pool.query(
        'INSERT INTO "MarketplaceFollow" (id, "userId", "sellerId", "createdAt") VALUES ($1, $2, $3, NOW())',
        [followId, session.userId, sellerId]
      )
      // Trigger notification (fire and forget) - only on NEW follow
      notifyNewFollower(sellerId, session.userId, session.name || 'A user').catch(() => {})
    }

    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceFollow" WHERE "sellerId" = $1',
      [sellerId]
    )

    return NextResponse.json({
      success: true,
      following: true,
      followerCount: countRes.rows[0]?.count || 0,
    })
  } catch (error: any) {
    console.error('Follows POST error:', error?.message)
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 })
  }
}

// DELETE: Unfollow a seller
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const sellerId = searchParams.get('sellerId')

    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId required' }, { status: 400 })
    }

    await pool.query(
      'DELETE FROM "MarketplaceFollow" WHERE "userId" = $1 AND "sellerId" = $2',
      [session.userId, sellerId]
    )


    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceFollow" WHERE "sellerId" = $1',
      [sellerId]
    )

    return NextResponse.json({
      success: true,
      following: false,
      followerCount: countRes.rows[0]?.count || 0,
    })
  } catch (error: any) {
    console.error('Follows DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 })
  }
}