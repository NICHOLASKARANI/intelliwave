export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

// GET: List user's conversations
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT c.*, 
        l.title as "listingTitle", 
        l.images as "listingImages",
        l.price as "listingPrice",
        u.name as "otherPartyName",
        u.image as "otherPartyImage",
        (SELECT COUNT(*) FROM "MarketplaceMessage" m WHERE m."conversationId" = c.id AND m."receiverId" = $1 AND m."isRead" = false) as "unreadCount"
      FROM "MarketplaceConversation" c
      JOIN "MarketplaceListing" l ON c."listingId" = l.id
      JOIN "User" u ON (CASE WHEN c."buyerId" = $1 THEN c."sellerId" ELSE c."buyerId" END) = u.id
      WHERE c."buyerId" = $1 OR c."sellerId" = $1
      ORDER BY c."lastMessageAt" DESC`,
      [session!.userId]
    )

    return NextResponse.json({ conversations: result.rows })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json({ conversations: [] })
  }
}

// POST: Create conversation (buyer contacts seller)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Get listing to find seller
    const listingResult = await pool.query(
      `SELECT "sellerId", title FROM "MarketplaceListing" WHERE id = $1`,
      [body.listingId]
    )

    if (listingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const sellerId = listingResult.rows[0].sellerId

    // Check if conversation exists
    const existing = await pool.query(
      `SELECT * FROM "MarketplaceConversation" WHERE "listingId" = $1 AND "buyerId" = $2`,
      [body.listingId, session!.userId]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({ conversation: existing.rows[0], exists: true })
    }

    // Create conversation
    const result = await pool.query(
      `INSERT INTO "MarketplaceConversation" ("listingId", "buyerId", "sellerId", "lastMessage", "lastMessageAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [body.listingId, session!.userId, sellerId, body.message || 'Hello, is this available?']
    )

    // Add first message
    await pool.query(
      `INSERT INTO "MarketplaceMessage" ("conversationId", "senderId", "receiverId", content, "isRead", "createdAt")
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [result.rows[0].id, session!.userId, sellerId, body.message || 'Hello, is this available?']
    )

    return NextResponse.json({ conversation: result.rows[0], exists: false }, { status: 201 })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Failed to create conversation: ' + (error as Error).message }, { status: 500 })
  }
}