export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: personalized recommendations based on user activity
// Falls back to best sellers for anonymous users or cold-start
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req).catch(() => null)
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 24)

    if (!session) {
      // Anonymous → return best sellers as recommendation
      const fallback = await pool.query(
        `SELECT l.id, l.title, l.price, l.images, l.location, l.condition,
                sp."averageRating", sp."totalReviews", u.name AS "sellerName"
         FROM "MarketplaceListing" l
         JOIN "User" u ON l."sellerId" = u.id
         LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
         WHERE l.status = 'ACTIVE'
         ORDER BY l.views DESC, l."createdAt" DESC
         LIMIT $1`,
        [limit]
      )
      return NextResponse.json({ recommendations: fallback.rows, reason: 'popular' })
    }

    // Get user's categories of interest (viewed + saved + ordered)
    const categoriesRes = await pool.query(
      `WITH user_cats AS (
         SELECT l.category, 1 AS weight FROM "RecentlyViewed" rv
         JOIN "MarketplaceListing" l ON l.id = rv."listingId"
         WHERE rv."userId" = $1
         UNION ALL
         SELECT l.category, 2 AS weight FROM "MarketplaceSaved" s
         JOIN "MarketplaceListing" l ON l.id = s."listingId"
         WHERE s."userId" = $1
         UNION ALL
         SELECT l.category, 3 AS weight FROM "MarketplaceOrderItem" oi
         JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
         JOIN "MarketplaceListing" l ON l.id = oi."listingId"
         WHERE o."buyerId" = $1 AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
       )
       SELECT category, SUM(weight)::int AS score
       FROM user_cats
       WHERE category IS NOT NULL
       GROUP BY category
       ORDER BY score DESC
       LIMIT 5`,
      [session.userId]
    )

    const categories = categoriesRes.rows.map((r: any) => r.category)

    if (categories.length === 0) {
      // Cold start — best sellers fallback
      const fallback = await pool.query(
        `SELECT l.id, l.title, l.price, l.images, l.location, l.condition,
                sp."averageRating", sp."totalReviews", u.name AS "sellerName"
         FROM "MarketplaceListing" l
         JOIN "User" u ON l."sellerId" = u.id
         LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
         WHERE l.status = 'ACTIVE'
         ORDER BY l.views DESC, l."createdAt" DESC
         LIMIT $1`,
        [limit]
      )
      return NextResponse.json({ recommendations: fallback.rows, reason: 'cold-start' })
    }

    // Recommend from those categories, excluding already-viewed/saved
    const placeholders = categories.map((_: any, i: number) => `$${i + 2}`).join(',')
    const recRes = await pool.query(
      `SELECT l.id, l.title, l.price, l.images, l.location, l.condition,
              sp."averageRating", sp."totalReviews", u.name AS "sellerName"
       FROM "MarketplaceListing" l
       JOIN "User" u ON l."sellerId" = u.id
       LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
       WHERE l.status = 'ACTIVE'
         AND l.category IN (${placeholders})
         AND l.id NOT IN (SELECT "listingId" FROM "RecentlyViewed" WHERE "userId" = $1)
         AND l.id NOT IN (SELECT "listingId" FROM "MarketplaceSaved" WHERE "userId" = $1 AND "listingId" IS NOT NULL)
       ORDER BY COALESCE(sp."averageRating", 0) DESC, l.views DESC, l."createdAt" DESC
       LIMIT $${categories.length + 2}`,
      [session.userId, ...categories, limit]
    )

    return NextResponse.json({
      recommendations: recRes.rows,
      reason: 'personalized',
      categories,
    })
  } catch (error: any) {
    console.error('Recommendations error:', error?.message)
    return NextResponse.json({ recommendations: [], error: 'Failed' }, { status: 500 })
  }
}