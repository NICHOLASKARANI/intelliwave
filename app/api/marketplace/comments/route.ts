export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: List comments for a listing (top-level + nested replies)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }

    const id = parseInt(listingId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
    }

    // Get current user (optional - for "userLiked" status)
    let userId: string | null = null
    try {
      const session = await requireTenant(req)
      if (session) userId = session.userId
    } catch {}

    // Fetch all comments (both top-level and replies) for this listing
    const result = await pool.query(
      `SELECT c.id, c."userId", c."listingId", c."parentId", c.body, c."isDeleted", c."createdAt", c."updatedAt",
              u.name AS "userName", u.image AS "userImage",
              (SELECT COUNT(*)::int FROM "MarketplaceCommentLike" cl WHERE cl."commentId" = c.id) AS "likeCount"
       FROM "MarketplaceComment" c
       LEFT JOIN "User" u ON u.id = c."userId"
       WHERE c."listingId" = $1 AND c."isDeleted" = false
       ORDER BY c."createdAt" ASC`,
      [id]
    )

    const allComments = result.rows

    // Check which comments the current user liked
    let likedCommentIds = new Set<string>()
    if (userId && allComments.length > 0) {
      const commentIds = allComments.map(c => c.id)
      const likesRes = await pool.query(
        'SELECT "commentId" FROM "MarketplaceCommentLike" WHERE "userId" = $1 AND "commentId" = ANY($2)',
        [userId, commentIds]
      )
      likedCommentIds = new Set(likesRes.rows.map(r => r.commentId))
    }

    // Build nested structure: top-level comments with replies
    const topLevel = allComments.filter(c => !c.parentId)
    const repliesByParent: Record<string, any[]> = {}
    for (const c of allComments) {
      if (c.parentId) {
        if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = []
        repliesByParent[c.parentId].push({
          ...c,
          userLiked: likedCommentIds.has(c.id),
          isOwner: userId === c.userId,
        })
      }
    }

    const comments = topLevel
      .slice(offset, offset + limit)
      .map(c => ({
        ...c,
        userLiked: likedCommentIds.has(c.id),
        isOwner: userId === c.userId,
        replies: (repliesByParent[c.id] || []).map(r => ({
          ...r,
        })),
      }))

    return NextResponse.json({
      comments,
      total: topLevel.length,
      limit,
      offset,
      authenticated: !!userId,
    })
  } catch (error: any) {
    console.error('Comments GET error:', error?.message)
    return NextResponse.json({ comments: [], total: 0, error: 'Failed to load comments' }, { status: 500 })
  }
}

// POST: Create a new comment (requires auth)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { listingId, body: commentBody, parentId } = body

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    }
    if (!commentBody || commentBody.trim().length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
    }
    if (commentBody.length > 2000) {
      return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 })
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

    // If parentId given, verify parent comment exists and belongs to same listing
    if (parentId) {
      const parentRes = await pool.query(
        'SELECT id, "listingId" FROM "MarketplaceComment" WHERE id = $1',
        [parentId]
      )
      if (parentRes.rows.length === 0) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
      if (parentRes.rows[0].listingId !== id) {
        return NextResponse.json({ error: 'Parent comment belongs to different listing' }, { status: 400 })
      }
      // Prevent nested-nested (only 1 level of replies)
      const parentParentRes = await pool.query(
        'SELECT "parentId" FROM "MarketplaceComment" WHERE id = $1',
        [parentId]
      )
      if (parentParentRes.rows[0]?.parentId) {
        return NextResponse.json({ error: 'Cannot reply to a reply' }, { status: 400 })
      }
    }

    // Create comment
    const crypto = require('crypto')
    const commentId = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "MarketplaceComment" (id, "userId", "listingId", "parentId", body, "isDeleted", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
      [commentId, session.userId, id, parentId || null, commentBody.trim()]
    )

    // Fetch the created comment with user info
    const createdRes = await pool.query(
      `SELECT c.id, c."userId", c."listingId", c."parentId", c.body, c."isDeleted", c."createdAt", c."updatedAt",
              u.name AS "userName", u.image AS "userImage"
       FROM "MarketplaceComment" c
       LEFT JOIN "User" u ON u.id = c."userId"
       WHERE c.id = $1`,
      [commentId]
    )

    return NextResponse.json({
      success: true,
      comment: {
        ...createdRes.rows[0],
        userLiked: false,
        isOwner: true,
        replies: [],
        likeCount: 0,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Comments POST error:', error?.message)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}