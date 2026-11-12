export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// POST: fetch details for 2-3 listings for side-by-side comparison
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.map((x: any) => parseInt(x, 10)).filter((x: number) => !isNaN(x)) : []

    if (ids.length < 2) return NextResponse.json({ error: 'At least 2 listings required' }, { status: 400 })
    if (ids.length > 3) return NextResponse.json({ error: 'Max 3 listings for comparison' }, { status: 400 })

    const res = await pool.query(
      `SELECT l.id, l.title, l.price, l.images, l.location, l.condition, l.category,
              l.description, l.stock, l."createdAt", l.sku, l.views,
              l."ratingsAvg", l."ratingsCount",
              sp."averageRating" AS "sellerRating",
              sp."totalReviews" AS "sellerTotalReviews",
              sp."storeName",
              sp."verification" AS "sellerVerification",
              u.name AS "sellerName"
       FROM "MarketplaceListing" l
       JOIN "User" u ON l."sellerId" = u.id
       LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
       WHERE l.id = ANY($1) AND l.status = 'ACTIVE'`,
      [ids]
    )

    return NextResponse.json({ listings: res.rows })
  } catch (error: any) {
    console.error('Compare error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}