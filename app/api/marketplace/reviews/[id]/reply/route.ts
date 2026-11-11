export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reviewId = params.id
    const body = await req.json().catch(() => ({}))
    const reply = (body.reply || '').toString().trim()

    if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
    if (!reply) return NextResponse.json({ error: 'reply required' }, { status: 400 })
    if (reply.length > 2000) return NextResponse.json({ error: 'reply too long (max 2000)' }, { status: 400 })

    const result = await pool.query(
      `UPDATE "MarketplaceReview"
       SET "sellerReply" = $1, "sellerReplyAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $2 AND "sellerId" = $3
       RETURNING id, "reviewerId", "listingId"`,
      [reply, reviewId, session.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found or not yours' }, { status: 404 })
    }

    const updated = result.rows[0]

    if (updated.reviewerId && updated.reviewerId !== session.userId) {
      createNotification({
        userId: updated.reviewerId,
        type: 'new_comment',
        title: 'Seller replied to your review',
        body: `${session.name || 'The seller'} replied: "${reply.slice(0, 100)}${reply.length > 100 ? '...' : ''}"`,
        link: `/marketplace/listing/${updated.listingId}`,
        actorId: session.userId,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, reviewId: updated.id })
  } catch (error: any) {
    console.error('Review reply POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}