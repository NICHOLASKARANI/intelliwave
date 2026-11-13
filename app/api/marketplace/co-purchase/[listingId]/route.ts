export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

/**
 * GET /api/marketplace/co-purchase/[listingId]
 *
 * Returns products frequently bought by the same buyers who bought this listing,
 * but from DIFFERENT orders (broader purchase patterns).
 *
 * Logic:
 *   1. Find all buyers who purchased this listing
 *   2. Find all other listings those buyers have purchased (any order)
 *   3. Rank by number of unique buyers who bought both
 *   4. Exclude the target listing + listings from same seller (per requirement)
 *
 * Minimum threshold: at least 2 buyers needed for a meaningful recommendation.
 */
export async function GET(req: NextRequest, { params }: { params: { listingId: string } }) {
  try {
    const listingId = parseInt(params.listingId, 10)
    if (!listingId) return NextResponse.json({ items: [] })

    // Get the listing's seller to exclude same-seller products
    const listingRes = await pool.query(
      `SELECT "sellerId" FROM "MarketplaceListing" WHERE id = $1`,
      [listingId]
    )
    if (listingRes.rows.length === 0) return NextResponse.json({ items: [] })
    const sellerId = listingRes.rows[0].sellerId

    const res = await pool.query(
      `WITH target_buyers AS (
        SELECT DISTINCT o."buyerId"
        FROM "MarketplaceOrderItem" oi
        JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
        WHERE oi."listingId" = $1
          AND o."paymentStatus" = 'PAID'
          AND o.status IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')
      ),
      co_purchases AS (
        SELECT
          oi."listingId",
          COUNT(DISTINCT o."buyerId")::int AS "buyerCount"
        FROM "MarketplaceOrderItem" oi
        JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
        WHERE o."buyerId" IN (SELECT "buyerId" FROM target_buyers)
          AND oi."listingId" != $1
          AND o."paymentStatus" = 'PAID'
          AND o.status IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')
        GROUP BY oi."listingId"
        HAVING COUNT(DISTINCT o."buyerId") >= 2
      )
      SELECT
        l.id,
        l.title,
        l.price,
        l.images,
        l.location,
        l.condition,
        l.stock,
        COALESCE(sp."averageRating", 0) AS "averageRating",
        sp."storeName",
        cp."buyerCount"
      FROM co_purchases cp
      JOIN "MarketplaceListing" l ON l.id = cp."listingId"
      LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
      WHERE l.status = 'ACTIVE'
        AND l.stock > 0
        AND l."sellerId" != $2
      ORDER BY cp."buyerCount" DESC, l.views DESC
      LIMIT 6`,
      [listingId, sellerId]
    )

    return NextResponse.json({ items: res.rows })
  } catch (error: any) {
    console.error('Co-purchase error:', error?.message)
    return NextResponse.json({ items: [] })
  }
}