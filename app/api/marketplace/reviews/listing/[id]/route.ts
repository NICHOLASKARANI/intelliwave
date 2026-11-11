export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listingId = parseInt(params.id, 10)
    if (!listingId || Number.isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') || 'newest'
    const filter = searchParams.get('filter') || 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const offset = (page - 1) * limit

    const sortMap: Record<string, string> = {
      newest: '"createdAt" DESC',
      oldest: '"createdAt" ASC',
      helpful: '"helpfulCount" DESC, "createdAt" DESC',
      rating_high: 'rating DESC, "createdAt" DESC',
      rating_low: 'rating ASC, "createdAt" DESC',
    }
    const orderBy = sortMap[sort] || sortMap.newest

    const filterMap: Record<string, string> = {
      all: '',
      verified: ' AND "isVerified" = true',
      with_photos: ' AND array_length(photos, 1) > 0',
      with_reply: ' AND "sellerReply" IS NOT NULL',
    }
    const filterClause = filterMap[filter] || ''

    const where = `WHERE "listingId" = $1 AND (status IS NULL OR status = 'VISIBLE')${filterClause}`

    const listRes = await pool.query(
      `SELECT id, "listingId", "sellerId", "reviewerId", "reviewerName",
              rating, title, body, "isVerified", "helpfulCount",
              photos, videos, "sellerReply", "sellerReplyAt",
              "productQuality", "deliveryExperience", "sellerService",
              status, "createdAt", "updatedAt"
       FROM "MarketplaceReview"
       ${where}
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [listingId, limit, offset]
    )

    const statsRes = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COALESCE(AVG(rating), 0)::float AS average,
         COUNT(*) FILTER (WHERE rating = 1)::int AS r1,
         COUNT(*) FILTER (WHERE rating = 2)::int AS r2,
         COUNT(*) FILTER (WHERE rating = 3)::int AS r3,
         COUNT(*) FILTER (WHERE rating = 4)::int AS r4,
         COUNT(*) FILTER (WHERE rating = 5)::int AS r5,
         COUNT(*) FILTER (WHERE "isVerified" = true)::int AS verified_count,
         COUNT(*) FILTER (WHERE array_length(photos, 1) > 0)::int AS with_photos,
         COUNT(*) FILTER (WHERE "sellerReply" IS NOT NULL)::int AS with_reply,
         COALESCE(AVG("productQuality"), 0)::float AS avg_quality,
         COALESCE(AVG("deliveryExperience"), 0)::float AS avg_delivery,
         COALESCE(AVG("sellerService"), 0)::float AS avg_service
       FROM "MarketplaceReview"
       WHERE "listingId" = $1 AND (status IS NULL OR status = 'VISIBLE')`,
      [listingId]
    )

    const s = statsRes.rows[0]
    const total = s.total
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      reviews: listRes.rows,
      pagination: { page, limit, total, totalPages },
      average: Math.round(s.average * 10) / 10,
      distribution: { '1': s.r1, '2': s.r2, '3': s.r3, '4': s.r4, '5': s.r5 },
      averageSubRatings: {
        productQuality: Math.round(s.avg_quality * 10) / 10,
        deliveryExperience: Math.round(s.avg_delivery * 10) / 10,
        sellerService: Math.round(s.avg_service * 10) / 10,
      },
      counts: {
        verified: s.verified_count,
        withPhotos: s.with_photos,
        withReply: s.with_reply,
      },
    })
  } catch (error: any) {
    console.error('Listing reviews GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}