export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List reviews for a listing OR for a seller
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')
    const sellerId = searchParams.get('sellerId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    if (!listingId && !sellerId) {
      return NextResponse.json({ error: 'listingId or sellerId required' }, { status: 400 })
    }

    let query = ''
    const params: any[] = []

    if (listingId) {
      query = `SELECT id, "listingId", "sellerId", "orderId", "reviewerId", "reviewerName",
                      rating, title, body, "isVerified", "helpfulCount", "createdAt"
               FROM "MarketplaceReview"
               WHERE "listingId" = $1
               ORDER BY "createdAt" DESC
               LIMIT $2`
      params.push(parseInt(listingId), limit)
    } else {
      query = `SELECT id, "listingId", "sellerId", "orderId", "reviewerId", "reviewerName",
                      rating, title, body, "isVerified", "helpfulCount", "createdAt"
               FROM "MarketplaceReview"
               WHERE "sellerId" = $1
               ORDER BY "createdAt" DESC
               LIMIT $2`
      params.push(sellerId, limit)
    }

    const result = await pool.query(query, params)

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    const reviews = result.rows
    for (const r of reviews) {
      const rating = Number(r.rating)
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++
      }
    }

    const total = reviews.length
    const average = total > 0
      ? Math.round((reviews.reduce((s, r) => s + Number(r.rating), 0) / total) * 10) / 10
      : 0

    return NextResponse.json({
      reviews,
      total,
      average,
      distribution,
    })
  } catch (error: any) {
    console.error('Reviews GET error:', error?.message)
    return NextResponse.json({ reviews: [], total: 0, average: 0, error: 'Failed to load reviews' }, { status: 500 })
  }
}

// POST: Create a review (requires auth)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { listingId, rating, title, body: reviewBody, photos, videos, productQuality, deliveryExperience, sellerService } = body

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    // Get listing info (for sellerId)
    const listingRes = await pool.query(
      'SELECT "sellerId" FROM "MarketplaceListing" WHERE id = $1',
      [parseInt(listingId)]
    )
    if (listingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    const sellerId = listingRes.rows[0].sellerId

    // Check if this user has already reviewed this listing
    const existingRes = await pool.query(
      'SELECT id FROM "MarketplaceReview" WHERE "listingId" = $1 AND "reviewerId" = $2',
      [parseInt(listingId), session.userId]
    )

    // Check if user has purchased (verified buyer)
    const purchaseRes = await pool.query(
      `SELECT 1 FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."listingId" = $1 AND o."buyerId" = $2 AND o."paymentStatus" = 'PAID'
       LIMIT 1`,
      [parseInt(listingId), session.userId]
    )
    const isVerified = purchaseRes.rows.length > 0

    const crypto = require('crypto')
    const reviewId = crypto.randomUUID()

    if (existingRes.rows.length > 0) {
      // Update existing review
      await pool.query(
        `UPDATE "MarketplaceReview"
         SET rating = $1, title = $2, body = $3, "isVerified" = $4,
             photos = COALESCE($5, photos),
             videos = COALESCE($6, videos),
             "productQuality" = COALESCE($7, "productQuality"),
             "deliveryExperience" = COALESCE($8, "deliveryExperience"),
             "sellerService" = COALESCE($9, "sellerService"),
             "editedAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $10`,
        [
          parseInt(rating), title || '', reviewBody || '', isVerified,
          Array.isArray(photos) ? photos : null,
          Array.isArray(videos) ? videos : null,
          typeof productQuality === 'number' ? productQuality : null,
          typeof deliveryExperience === 'number' ? deliveryExperience : null,
          typeof sellerService === 'number' ? sellerService : null,
          existingRes.rows[0].id,
        ]
      )
      return NextResponse.json({ success: true, updated: true, id: existingRes.rows[0].id })
    }

    // Insert new review
    await pool.query(
      `INSERT INTO "MarketplaceReview"
       (id, "listingId", "sellerId", "reviewerId", "reviewerName", rating, title, body, "isVerified", "helpfulCount", photos, videos, "productQuality", "deliveryExperience", "sellerService", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, $14, 'VISIBLE', NOW(), NOW())`,
      [
        reviewId,
        parseInt(listingId),
        sellerId,
        session.userId,
        session.name || session.userId,
        parseInt(rating),
        title || '',
        reviewBody || '',
        isVerified,
        Array.isArray(photos) ? photos : [],
        Array.isArray(videos) ? videos : [],
        typeof productQuality === 'number' ? productQuality : null,
        typeof deliveryExperience === 'number' ? deliveryExperience : null,
        typeof sellerService === 'number' ? sellerService : null,
      ]
    )

    // Update seller aggregate rating
    const aggRes = await pool.query(
      `SELECT COUNT(*)::int as total, AVG(rating)::float as avg
       FROM "MarketplaceReview" WHERE "sellerId" = $1`,
      [sellerId]
    )
    const { total, avg } = aggRes.rows[0]
    await pool.query(
      `UPDATE "SellerProfile"
       SET "averageRating" = $1, "totalReviews" = $2
       WHERE "userId" = $3`,
      [avg || 0, total || 0, sellerId]
    ).catch(() => {})

    // Recompute listing aggregate (SEO data)
    const listAgg = await pool.query(
      `SELECT
         COUNT(*)::int AS cnt,
         COALESCE(AVG(rating), 0)::float AS avg,
         COUNT(*) FILTER (WHERE rating = 1)::int AS r1,
         COUNT(*) FILTER (WHERE rating = 2)::int AS r2,
         COUNT(*) FILTER (WHERE rating = 3)::int AS r3,
         COUNT(*) FILTER (WHERE rating = 4)::int AS r4,
         COUNT(*) FILTER (WHERE rating = 5)::int AS r5
       FROM "MarketplaceReview"
       WHERE "listingId" = $1 AND (status IS NULL OR status = 'VISIBLE')`,
      [parseInt(listingId)]
    )
    const la = listAgg.rows[0]
    const ldist = { '1': la.r1, '2': la.r2, '3': la.r3, '4': la.r4, '5': la.r5 }
    await pool.query(
      `UPDATE "MarketplaceListing"
       SET "ratingsAvg" = $1, "ratingsCount" = $2, "ratingDistribution" = $3
       WHERE id = $4`,
      [Math.round((la.avg || 0) * 100) / 100, la.cnt || 0, JSON.stringify(ldist), parseInt(listingId)]
    ).catch(() => {})

    return NextResponse.json({ success: true, id: reviewId }, { status: 201 })
  } catch (error: any) {
    console.error('Reviews POST error:', error?.message)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}