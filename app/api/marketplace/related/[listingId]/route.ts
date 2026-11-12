export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: related products for a listing
// Strategy: same category, similar price range, exclude same seller + self
export async function GET(req: NextRequest, { params }: { params: { listingId: string } }) {
  try {
    const listingId = parseInt(params.listingId, 10)
    if (!listingId) return NextResponse.json({ related: [] })

    const base = await pool.query(
      `SELECT category, price, "sellerId" FROM "MarketplaceListing" WHERE id = $1`,
      [listingId]
    )
    if (base.rows.length === 0) return NextResponse.json({ related: [] })

    const { category, price, sellerId } = base.rows[0]
    const priceNum = Number(price)
    const minPrice = priceNum * 0.5
    const maxPrice = priceNum * 2

    const res = await pool.query(
      `SELECT l.id, l.title, l.price, l.images, l.location, l.condition,
              sp."averageRating", sp."totalReviews",
              u.name AS "sellerName"
       FROM "MarketplaceListing" l
       JOIN "User" u ON l."sellerId" = u.id
       LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
       WHERE l.status = 'ACTIVE'
         AND l.id != $1
         AND l."sellerId" != $2
         AND l.category = $3
         AND l.price BETWEEN $4 AND $5
       ORDER BY
         (l.stock > 0) DESC,
         COALESCE(sp."averageRating", 0) DESC,
         l.views DESC
       LIMIT 8`,
      [listingId, sellerId, category, minPrice, maxPrice]
    )

    // Fallback: if fewer than 4, relax price range
    let related = res.rows
    if (related.length < 4) {
      const fallback = await pool.query(
        `SELECT l.id, l.title, l.price, l.images, l.location, l.condition,
                sp."averageRating", sp."totalReviews", u.name AS "sellerName"
         FROM "MarketplaceListing" l
         JOIN "User" u ON l."sellerId" = u.id
         LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
         WHERE l.status = 'ACTIVE'
           AND l.id != $1
           AND l."sellerId" != $2
           AND l.category = $3
         ORDER BY COALESCE(sp."averageRating", 0) DESC, l.views DESC
         LIMIT 8`,
        [listingId, sellerId, category]
      )
      related = fallback.rows
    }

    return NextResponse.json({ related })
  } catch (error: any) {
    console.error('Related products error:', error?.message)
    return NextResponse.json({ related: [] })
  }
}