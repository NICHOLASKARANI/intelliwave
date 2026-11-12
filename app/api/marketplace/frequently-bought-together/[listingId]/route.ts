export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: products frequently bought alongside the given listing
// Computed via co-occurrence in the same order
export async function GET(req: NextRequest, { params }: { params: { listingId: string } }) {
  try {
    const listingId = parseInt(params.listingId, 10)
    if (!listingId) return NextResponse.json({ items: [] })

    const res = await pool.query(
      `SELECT
         l.id,
         l.title,
         l.price,
         l.images,
         l.location,
         l.condition,
         COALESCE(sp."averageRating", 0) AS "averageRating",
         COUNT(DISTINCT co_orders."orderId")::int AS "cooccurrenceCount"
       FROM "MarketplaceOrderItem" target
       JOIN "MarketplaceOrderItem" other ON other."orderId" = target."orderId" AND other."listingId" != target."listingId"
       JOIN "MarketplaceOrder" o ON o.id = target."orderId"
       JOIN "MarketplaceListing" l ON l.id = other."listingId"
       LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
       WHERE target."listingId" = $1
         AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
         AND l.status = 'ACTIVE'
       GROUP BY l.id, l.title, l.price, l.images, l.location, l.condition, sp."averageRating"
       ORDER BY "cooccurrenceCount" DESC, l.views DESC
       LIMIT 3`,
      [listingId]
    )

    return NextResponse.json({ items: res.rows })
  } catch (error: any) {
    console.error('FBT error:', error?.message)
    return NextResponse.json({ items: [] })
  }
}