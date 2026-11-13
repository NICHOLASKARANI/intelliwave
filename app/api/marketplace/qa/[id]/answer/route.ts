export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'
import crypto from 'crypto'

// POST: answer a question
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

    const qaId = params.id
    const body = await req.json().catch(() => ({}))
    const answer = (body.answer || '').toString().trim().slice(0, 1000)

    if (answer.length < 3) return NextResponse.json({ error: 'Answer too short' }, { status: 400 })

    // Fetch question + listing
    const qaRes = await pool.query(
      `SELECT q.id, q."askerId", q."listingId", l."sellerId", l.title
       FROM "MarketplaceQA" q
       JOIN "MarketplaceListing" l ON l.id = q."listingId"
       WHERE q.id = $1`,
      [qaId]
    )
    if (qaRes.rows.length === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    const qa = qaRes.rows[0]

    const isSeller = qa.sellerId === session.userId
    const isAsker = qa.askerId === session.userId

    if (isAsker) {
      return NextResponse.json({ error: 'You cannot answer your own question' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "MarketplaceQAAnswer" (id, "qaId", "answererId", "answererName", answer, "isSellerAnswer", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [id, qaId, session.userId, session.name || 'User', answer, isSeller]
    )

    // Notify asker (not the seller answering their own)
    if (qa.askerId !== session.userId) {
      createNotification({
        userId: qa.askerId,
        type: 'new_comment',
        title: isSeller ? '💬 Seller answered your question' : '💬 Someone answered your question',
        body: `On "${qa.title}": ${answer.slice(0, 100)}${answer.length > 100 ? '...' : ''}`,
        link: `/marketplace/listing/${qa.listingId}#qa`,
        actorId: session.userId,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    console.error('QA answer error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}