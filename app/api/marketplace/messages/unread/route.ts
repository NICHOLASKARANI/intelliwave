export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: total unread count across all conversations for current user
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ unreadCount: 0, byConversation: {} })

    const res = await pool.query(
      `SELECT "conversationId", COUNT(*)::int AS count
       FROM "MarketplaceMessage"
       WHERE "receiverId" = $1 AND "isRead" = false
       GROUP BY "conversationId"`,
      [session.userId]
    )

    const byConversation: Record<string, number> = {}
    let total = 0
    for (const r of res.rows) {
      byConversation[String(r.conversationId)] = r.count
      total += r.count
    }

    return NextResponse.json({ unreadCount: total, byConversation })
  } catch (error: any) {
    console.error('Unread GET error:', error?.message)
    return NextResponse.json({ unreadCount: 0, byConversation: {} })
  }
}