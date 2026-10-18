export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * Shared helper — checks the caller has an active subscription.
 * Returns null if subscribed, or a 402 NextResponse if not.
 */
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
    // If we can't verify subscription, be lenient (don't block on DB hiccups)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Paywall: only subscribed users can use messaging
    const denied = await requireSubscription(session)
    if (denied) return denied

    const result = await pool.query(
      `SELECT c.*,
        l.title as "listingTitle",
        l.images as "listingImages",
        l.price as "listingPrice",
        u.name as "otherPartyName",
        u.image as "otherPartyImage",
        (SELECT COUNT(*) FROM "MarketplaceMessage" m
          WHERE m."conversationId" = c.id AND m."receiverId" = $1 AND m."isRead" = false) as "unreadCount"
      FROM "MarketplaceConversation" c
      JOIN "MarketplaceListing" l ON c."listingId" = l.id
      JOIN "User" u ON (CASE WHEN c."buyerId" = $1 THEN c."sellerId" ELSE c."buyerId" END) = u.id
      WHERE c."buyerId" = $1 OR c."sellerId" = $1
      ORDER BY c."lastMessageAt" DESC NULLS LAST`,
      [session.userId]
    )

    return NextResponse.json({ conversations: result.rows })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json({ conversations: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const denied = await requireSubscription(session)
    if (denied) return denied

    const body = await req.json()
    if (!body.listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const listingResult = await pool.query(
      `SELECT "sellerId", title FROM "MarketplaceListing" WHERE id = $1`,
      [body.listingId]
    )
    if (listingResult.rows.length === 0) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const sellerId = listingResult.rows[0].sellerId
    if (sellerId === session.userId) return NextResponse.json({ error: 'Cannot message your own listing' }, { status: 400 })

    const existing = await pool.query(
      `SELECT * FROM "MarketplaceConversation" WHERE "listingId" = $1 AND "buyerId" = $2`,
      [body.listingId, session.userId]
    )
    if (existing.rows.length > 0) return NextResponse.json({ conversation: existing.rows[0], exists: true })

    const result = await pool.query(
      `INSERT INTO "MarketplaceConversation" ("listingId", "buyerId", "sellerId", "lastMessage", "lastMessageAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [body.listingId, session.userId, sellerId, body.message || 'Hello, is this available?']
    )

    await pool.query(
      `INSERT INTO "MarketplaceMessage" ("conversationId", "senderId", "receiverId", content, "isRead", "createdAt")
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [result.rows[0].id, session.userId, sellerId, body.message || 'Hello, is this available?']
    )

    return NextResponse.json({ conversation: result.rows[0], exists: false }, { status: 201 })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}