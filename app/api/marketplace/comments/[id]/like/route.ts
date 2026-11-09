export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// POST: Toggle like on a comment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentId = params.id

    // Verify comment exists
    const commentRes = await pool.query(
      'SELECT id FROM "MarketplaceComment" WHERE id = $1 AND "isDeleted" = false',
      [commentId]
    )
    if (commentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if already liked
    const existingRes = await pool.query(
      'SELECT id FROM "MarketplaceCommentLike" WHERE "commentId" = $1 AND "userId" = $2 LIMIT 1',
      [commentId, session.userId]
    )

    let action = ''
    if (existingRes.rows.length > 0) {
      await pool.query(
        'DELETE FROM "MarketplaceCommentLike" WHERE "commentId" = $1 AND "userId" = $2',
        [commentId, session.userId]
      )
      action = 'unliked'
    } else {
      const crypto = require('crypto')
      const likeId = crypto.randomUUID()
      await pool.query(
        'INSERT INTO "MarketplaceCommentLike" (id, "userId", "commentId", "createdAt") VALUES ($1, $2, $3, NOW())',
        [likeId, session.userId, commentId]
      )
      action = 'liked'
    }

    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceCommentLike" WHERE "commentId" = $1',
      [commentId]
    )
    const likeCount = countRes.rows[0]?.count || 0

    return NextResponse.json({
      success: true,
      action,
      likeCount,
      userLiked: action === 'liked',
    })
  } catch (error: any) {
    console.error('Comment Like POST error:', error?.message)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}