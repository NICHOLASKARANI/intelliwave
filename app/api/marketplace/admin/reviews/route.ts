export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const headerPwd = req.headers.get('x-admin-password')
    const queryPwd = searchParams.get('password')
    const provided = headerPwd || queryPwd
    if (provided !== adminPassword) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    const filter = (searchParams.get('filter') || 'ALL').toUpperCase()
    const search = (searchParams.get('search') || '').trim()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))
    const offset = (page - 1) * limit

    let where = '1=1'
    const params: any[] = []
    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      const p = `$${params.length}`
      where += ` AND (LOWER(COALESCE(r."reviewerName", '')) LIKE ${p} OR LOWER(COALESCE(r.title, '')) LIKE ${p} OR LOWER(COALESCE(r.body, '')) LIKE ${p} OR LOWER(COALESCE(ml.title, '')) LIKE ${p})`
    }
    if (filter === 'REPORTED') {
      where += ` AND EXISTS (SELECT 1 FROM "MarketplaceReviewReport" rp WHERE rp."reviewId" = r.id AND rp.status = 'PENDING')`
    } else if (filter === 'HIDDEN') {
      where += ` AND r.status = 'HIDDEN'`
    } else if (filter === 'FLAGGED') {
      where += ` AND r.status = 'FLAGGED'`
    }

    params.push(limit, offset)
    const limitIdx = params.length - 1
    const offsetIdx = params.length

    const listRes = await pool.query(
      `SELECT
         r.id, r."listingId", r."reviewerId", r."reviewerName",
         r.rating, r.title, r.body, r."isVerified",
         r.status, r."createdAt", r."helpfulCount",
         ml.title AS "listingTitle",
         (SELECT COUNT(*) FROM "MarketplaceReviewReport" rp WHERE rp."reviewId" = r.id AND rp.status = 'PENDING')::int AS "reportCount"
       FROM "MarketplaceReview" r
       LEFT JOIN "MarketplaceListing" ml ON ml.id = r."listingId"
       WHERE ${where}
       ORDER BY r."createdAt" DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const kpiRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM "MarketplaceReview")::int AS total,
         (SELECT COUNT(DISTINCT "reviewId") FROM "MarketplaceReviewReport" WHERE status = 'PENDING')::int AS reported,
         (SELECT COUNT(*) FROM "MarketplaceReview" WHERE status = 'HIDDEN')::int AS hidden,
         (SELECT COUNT(*) FROM "MarketplaceReview" WHERE status = 'FLAGGED')::int AS flagged`
    )

    return NextResponse.json({
      reviews: listRes.rows,
      kpi: kpiRes.rows[0],
      pagination: { page, limit },
    })
  } catch (error: any) {
    console.error('Admin reviews GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}