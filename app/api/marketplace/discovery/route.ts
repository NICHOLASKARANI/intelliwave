export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: discovery feeds — bestsellers | new | featured | trending
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'bestsellers'
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 24)

    const baseSelect = `SELECT l.id, l.title, l.price, l.images, l.location, l.condition,
                               sp."averageRating", sp."totalReviews", u.name AS "sellerName"`

    let query = ''

    if (type === 'bestsellers') {
      // Most units sold in last 30 days
      query = `${baseSelect},
                 COALESCE((SELECT SUM(oi.quantity) FROM "MarketplaceOrderItem" oi
                           JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
                           WHERE oi."listingId" = l.id
                             AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED')
                             AND oi."createdAt" > NOW() - INTERVAL '30 days'), 0)::int AS "unitsSold"
               FROM "MarketplaceListing" l
               JOIN "User" u ON l."sellerId" = u.id
               LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
               WHERE l.status = 'ACTIVE'
               ORDER BY "unitsSold" DESC, l.views DESC
               LIMIT $1`
    } else if (type === 'new') {
      query = `${baseSelect}
               FROM "MarketplaceListing" l
               JOIN "User" u ON l."sellerId" = u.id
               LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
               WHERE l.status = 'ACTIVE' AND l."createdAt" > NOW() - INTERVAL '30 days'
               ORDER BY l."createdAt" DESC
               LIMIT $1`
    } else if (type === 'featured') {
      // Highest rated + verified sellers
      query = `${baseSelect}
               FROM "MarketplaceListing" l
               JOIN "User" u ON l."sellerId" = u.id
               LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
               WHERE l.status = 'ACTIVE'
                 AND COALESCE(sp."averageRating", 0) >= 4.0
                 AND l.stock > 0
               ORDER BY sp."averageRating" DESC, l.views DESC
               LIMIT $1`
    } else if (type === 'trending') {
      // Most viewed in last 7 days — approximation via high view count
      query = `${baseSelect}
               FROM "MarketplaceListing" l
               JOIN "User" u ON l."sellerId" = u.id
               LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
               WHERE l.status = 'ACTIVE'
                 AND l."createdAt" > NOW() - INTERVAL '60 days'
               ORDER BY l.views DESC, l."createdAt" DESC
               LIMIT $1`
    } else {
      return NextResponse.json({ listings: [], type })
    }

    const res = await pool.query(query, [limit])
    return NextResponse.json({ listings: res.rows, type })
  } catch (error: any) {
    console.error('Discovery error:', error?.message)
    return NextResponse.json({ listings: [], error: 'Failed' }, { status: 500 })
  }
}