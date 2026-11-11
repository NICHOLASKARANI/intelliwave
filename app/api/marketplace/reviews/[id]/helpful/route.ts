export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reviewId = params.id
    if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })

    const rRes = await pool.query(
      `SELECT id FROM "MarketplaceReview"
       WHERE id = $1 AND (status IS NULL OR status = 'VISIBLE')`,
      [reviewId]
    )
    if (rRes.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const existing = await pool.query(
      `SELECT id FROM "MarketplaceReviewHelpful" WHERE "reviewId" = $1 AND "userId" = $2 LIMIT 1`,
      [reviewId, session.userId]
    )

    let voted: boolean
    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM "MarketplaceReviewHelpful" WHERE "reviewId" = $1 AND "userId" = $2`,
        [reviewId, session.userId]
      )
      await pool.query(
        `UPDATE "MarketplaceReview" SET "helpfulCount" = GREATEST(COALESCE("helpfulCount", 0) - 1, 0) WHERE id = $1`,
        [reviewId]
      )
      voted = false
    } else {
      const voteId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO "MarketplaceReviewHelpful" (id, "reviewId", "userId", "createdAt")
         VALUES ($1, $2, $3, NOW())`,
        [voteId, reviewId, session.userId]
      )
      await pool.query(
        `UPDATE "MarketplaceReview" SET "helpfulCount" = COALESCE("helpfulCount", 0) + 1 WHERE id = $1`,
        [reviewId]
      )
      voted = true
    }

    const countRes = await pool.query(
      `SELECT "helpfulCount" FROM "MarketplaceReview" WHERE id = $1`,
      [reviewId]
    )

    return NextResponse.json({
      success: true,
      voted,
      helpfulCount: countRes.rows[0]?.helpfulCount || 0,
    })
  } catch (error: any) {
    console.error('Review helpful POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}