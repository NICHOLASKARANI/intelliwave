export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

const VALID_REASONS = ['spam', 'fraud', 'offensive', 'fake', 'irrelevant', 'other']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reviewId = params.id
    const body = await req.json().catch(() => ({}))
    const reason = (body.reason || '').toString().trim()
    const details = (body.details || '').toString().trim()

    if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason. Use: ' + VALID_REASONS.join(', ') }, { status: 400 })
    }
    if (details.length > 1000) {
      return NextResponse.json({ error: 'details too long (max 1000)' }, { status: 400 })
    }

    const rRes = await pool.query(`SELECT id FROM "MarketplaceReview" WHERE id = $1`, [reviewId])
    if (rRes.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const reportId = crypto.randomUUID()
    try {
      await pool.query(
        `INSERT INTO "MarketplaceReviewReport"
         (id, "reviewId", "reporterId", reason, details, status, "createdAt")
         VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())`,
        [reportId, reviewId, session.userId, reason, details || null]
      )
    } catch (e: any) {
      if (e?.code === '23505') {
        return NextResponse.json({ success: true, alreadyReported: true })
      }
      throw e
    }

    return NextResponse.json({ success: true, reportId }, { status: 201 })
  } catch (error: any) {
    console.error('Review report POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}