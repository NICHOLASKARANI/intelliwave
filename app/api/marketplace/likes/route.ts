export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: Check if user liked a listing + get total count
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }

    const id = parseInt(listingId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
    }

    // Get total like count
    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceLike" WHERE "listingId" = $1',
      [id]
    )
    const likeCount = countRes.rows[0]?.count || 0

    // Check if current user liked
    let userLiked = false
    let userId = null
    try {
      const session = await requireTenant(req)
      if (session) {
        userId = session.userId
        const userLikeRes = await pool.query(
          'SELECT id FROM "MarketplaceLike" WHERE "listingId" = $1 AND "userId" = $2 LIMIT 1',
          [id, userId]
        )
        userLiked = userLikeRes.rows.length > 0
      }
    } catch {}

    return NextResponse.json({
      likeCount,
      userLiked,
      authenticated: !!userId,
    })
  } catch (error: any) {
    console.error('Likes GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load likes' }, { status: 500 })
  }
}

// POST: Toggle like (requires auth)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }

    const id = parseInt(listingId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
    }

    // Verify listing exists
    const listingRes = await pool.query(
      'SELECT id FROM "MarketplaceListing" WHERE id = $1',
      [id]
    )
    if (listingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if already liked
    const existingRes = await pool.query(
      'SELECT id FROM "MarketplaceLike" WHERE "listingId" = $1 AND "userId" = $2 LIMIT 1',
      [id, session.userId]
    )

    let action = ''
    if (existingRes.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM "MarketplaceLike" WHERE "listingId" = $1 AND "userId" = $2',
        [id, session.userId]
      )
      action = 'unliked'
    } else {
      // Like
      const crypto = require('crypto')
      const likeId = crypto.randomUUID()
      await pool.query(
        'INSERT INTO "MarketplaceLike" (id, "userId", "listingId", "createdAt") VALUES ($1, $2, $3, NOW())',
        [likeId, session.userId, id]
      )
      action = 'liked'
    }

    // Get updated count
    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM "MarketplaceLike" WHERE "listingId" = $1',
      [id]
    )
    const likeCount = countRes.rows[0]?.count || 0

    return NextResponse.json({
      success: true,
      action,
      likeCount,
      userLiked: action === 'liked',
    })
  } catch (error: any) {
    console.error('Likes POST error:', error?.message)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}