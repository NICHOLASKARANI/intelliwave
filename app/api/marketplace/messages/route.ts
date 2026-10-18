export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

async function requireSubscription(session: any): Promise<NextResponse | null> {
  // Admin/testing bypass
  const BYPASS_EMAILS = ['intelliwavehr@gmail.com']
  if (BYPASS_EMAILS.includes(String(session.email || '').toLowerCase())) {
    return null
  }
  try {
    const r = await pool.query(
      `SELECT status, "endDate", "trialEndsAt" FROM "Subscription"
       WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [session.organizationId]
    )
    const s = r.rows[0]
    const now = Date.now()
    const subscribed = !!s && (
      (s.status === 'ACTIVE' && s.endDate && new Date(s.endDate).getTime() > now) ||
      (s.status === 'TRIAL' && s.trialEndsAt && new Date(s.trialEndsAt).getTime() > now)
    )
    if (!subscribed) {
      return NextResponse.json(
        {
          error: 'Active subscription required to use messaging.',
          code: 'SUBSCRIPTION_REQUIRED',
          upgradeUrl: '/wavecore-erp/subscription/pay',
        },
        { status: 402 }
      )
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const denied = await requireSubscription(session)
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    if (!conversationId) return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })

    const convCheck = await pool.query(
      `SELECT * FROM "MarketplaceConversation" WHERE id = $1 AND ("buyerId" = $2 OR "sellerId" = $2)`,
      [conversationId, session.userId]
    )
    if (convCheck.rows.length === 0) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const result = await pool.query(
      `SELECT m.*, u.name as "senderName", u.image as "senderImage"
       FROM "MarketplaceMessage" m
       JOIN "User" u ON m."senderId" = u.id
       WHERE m."conversationId" = $1
       ORDER BY m."createdAt" ASC`,
      [conversationId]
    )

    // Mark as read for current user
    await pool.query(
      `UPDATE "MarketplaceMessage" SET "isRead" = true
       WHERE "conversationId" = $1 AND "receiverId" = $2 AND "isRead" = false`,
      [conversationId, session.userId]
    ).catch(() => {})

    return NextResponse.json({ messages: result.rows })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ messages: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const denied = await requireSubscription(session)
    if (denied) return denied

    const body = await req.json()
    if (!body.conversationId || !body.content) {
      return NextResponse.json({ error: 'conversationId and content required' }, { status: 400 })
    }

    const convCheck = await pool.query(
      `SELECT * FROM "MarketplaceConversation" WHERE id = $1 AND ("buyerId" = $2 OR "sellerId" = $2)`,
      [body.conversationId, session.userId]
    )
    if (convCheck.rows.length === 0) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const conversation = convCheck.rows[0]
    const receiverId = conversation.buyerId === session.userId ? conversation.sellerId : conversation.buyerId

    const result = await pool.query(
      `INSERT INTO "MarketplaceMessage" ("conversationId", "senderId", "receiverId", content, "isRead", "createdAt")
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING *`,
      [body.conversationId, session.userId, receiverId, body.content]
    )

    await pool.query(
      `UPDATE "MarketplaceConversation" SET "lastMessage" = $1, "lastMessageAt" = NOW() WHERE id = $2`,
      [body.content, body.conversationId]
    )

    return NextResponse.json({ message: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}