export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: Public seller profile + their active listings
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sellerId = params.id

    // Get seller profile
    const sellerRes = await pool.query(
      `SELECT sp.id, sp."userId", sp."storeName", sp."storeSlug", sp."storeBanner",
              sp."storeLogo", sp.description, sp."businessType",
              sp."averageRating", sp."totalReviews", sp."trustScore", sp.verification,
              sp."totalOrders", sp."totalSales", sp.status,
              u.name AS "sellerName", u.image AS "sellerImage"
       FROM "SellerProfile" sp
       LEFT JOIN "User" u ON u.id = sp."userId"
       WHERE sp."userId" = $1 AND sp.status = 'ACTIVE'
       LIMIT 1`,
      [sellerId]
    )

    if (sellerRes.rows.length === 0) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const seller = sellerRes.rows[0]

    // Get their active listings
    const listingsRes = await pool.query(
      `SELECT id, title, description, price, currency, category, condition,
              location, images, stock, status, views, saves, "createdAt"
       FROM "MarketplaceListing"
       WHERE "sellerId" = $1 AND status = 'ACTIVE'
       ORDER BY "createdAt" DESC
       LIMIT 100`,
      [sellerId]
    )

    // Follower count
    const followerCountRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceFollow" WHERE "sellerId" = $1',
      [sellerId]
    )

    // Listing count (all statuses for stats)
    const listingCountRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceListing" WHERE "sellerId" = $1',
      [sellerId]
    )

    return NextResponse.json({
      seller: {
        id: seller.userId,
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        storeBanner: seller.storeBanner,
        storeLogo: seller.storeLogo,
        description: seller.description,
        businessType: seller.businessType,
        averageRating: seller.averageRating,
        totalReviews: seller.totalReviews,
        trustScore: seller.trustScore,
        verification: seller.verification,
        totalOrders: seller.totalOrders,
        totalSales: seller.totalSales,
        sellerName: seller.sellerName,
        sellerImage: seller.sellerImage,
      },
      listings: listingsRes.rows,
      followerCount: followerCountRes.rows[0]?.count || 0,
      listingCount: listingCountRes.rows[0]?.count || 0,
    })
  } catch (error: any) {
    console.error('Seller profile GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load seller' }, { status: 500 })
  }
}