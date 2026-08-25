export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

// GET: Get messages for a conversation
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }

    // Verify user is part of conversation
    const convCheck = await pool.query(
      `SELECT * FROM "MarketplaceConversation" WHERE id = $1 AND ("buyerId" = $2 OR "sellerId" = $2)`,
      [conversationId, session!.userId]
    )

    if (convCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages
    const result = await pool.query(
      `SELECT m.*, u.name as "senderName", u.image as "senderImage"
       FROM "MarketplaceMessage" m
       JOIN "User" u ON m."senderId" = u.id
       WHERE m."conversationId" = $1
       ORDER BY m."createdAt" ASC`,
      [conversationId]
    )

    // Mark messages as read
    await pool.query(
      `UPDATE "MarketplaceMessage" SET "isRead" = true WHERE "conversationId" = $1 AND "receiverId" = $2 AND "isRead" = false`,
      [conversationId, session!.userId]
    )

    return NextResponse.json({ messages: result.rows })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ messages: [] })
  }
}

// POST: Send message
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Verify user is part of conversation
    const convCheck = await pool.query(
      `SELECT * FROM "MarketplaceConversation" WHERE id = $1 AND ("buyerId" = $2 OR "sellerId" = $2)`,
      [body.conversationId, session!.userId]
    )

    if (convCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const conversation = convCheck.rows[0]
    const receiverId = conversation.buyerId === session!.userId ? conversation.sellerId : conversation.buyerId

    // Insert message
    const result = await pool.query(
      `INSERT INTO "MarketplaceMessage" ("conversationId", "senderId", "receiverId", content, "isRead", "createdAt")
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING *`,
      [body.conversationId, session!.userId, receiverId, body.content]
    )

    // Update conversation last message
    await pool.query(
      `UPDATE "MarketplaceConversation" SET "lastMessage" = $1, "lastMessageAt" = NOW() WHERE id = $2`,
      [body.content, body.conversationId]
    )

    return NextResponse.json({ message: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}