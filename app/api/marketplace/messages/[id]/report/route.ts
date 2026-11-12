export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

const VALID_REASONS = ['spam', 'harassment', 'offensive', 'fraud', 'other']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const messageId = parseInt(params.id, 10)
    if (!messageId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const reason = (body.reason || '').toString().trim()
    const details = (body.details || '').toString().trim().slice(0, 1000) || null

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason. Use: ' + VALID_REASONS.join(', ') }, { status: 400 })
    }

    // Verify message exists and involves current user
    const msgCheck = await pool.query(
      `SELECT id, "senderId", "receiverId", "conversationId"
       FROM "MarketplaceMessage" WHERE id = $1`,
      [messageId]
    )
    if (msgCheck.rows.length === 0) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    const msg = msgCheck.rows[0]
    if (msg.senderId !== session.userId && msg.receiverId !== session.userId) {
      return NextResponse.json({ error: 'Not your message' }, { status: 403 })
    }

    const id = crypto.randomUUID()
    try {
      await pool.query(
        `INSERT INTO "MarketplaceMessageReport" (id, "messageId", "reporterId", reason, details, status, "createdAt")
         VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())`,
        [id, messageId, session.userId, reason, details]
      )
    } catch (e: any) {
      if (e?.code === '23505') {
        return NextResponse.json({ success: true, alreadyReported: true })
      }
      throw e
    }

    return NextResponse.json({ success: true, reportId: id }, { status: 201 })
  } catch (error: any) {
    console.error('Message report error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}