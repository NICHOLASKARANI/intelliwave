export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

const VALID_ACTIONS = ['hide', 'show', 'flag', 'delete']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    if (body.password !== adminPassword) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    const reviewId = params.id
    const action = (body.action || '').toString().trim()
    if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use: ' + VALID_ACTIONS.join(', ') }, { status: 400 })
    }

    const rRes = await pool.query(
      `SELECT id, "listingId" FROM "MarketplaceReview" WHERE id = $1`,
      [reviewId]
    )
    if (rRes.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    const listingId = rRes.rows[0].listingId

    if (action === 'delete') {
      await pool.query(`DELETE FROM "MarketplaceReview" WHERE id = $1`, [reviewId])
    } else {
      const newStatus = action === 'hide' ? 'HIDDEN' : action === 'show' ? 'VISIBLE' : 'FLAGGED'
      await pool.query(
        `UPDATE "MarketplaceReview" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
        [newStatus, reviewId]
      )
    }

    if (listingId) {
      const aggRes = await pool.query(
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
        [listingId]
      )
      const a = aggRes.rows[0]
      const dist = { '1': a.r1, '2': a.r2, '3': a.r3, '4': a.r4, '5': a.r5 }
      await pool.query(
        `UPDATE "MarketplaceListing"
         SET "ratingsAvg" = $1, "ratingsCount" = $2, "ratingDistribution" = $3
         WHERE id = $4`,
        [Math.round((a.avg || 0) * 100) / 100, a.cnt || 0, JSON.stringify(dist), listingId]
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, action, reviewId })
  } catch (error: any) {
    console.error('Review moderate POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}