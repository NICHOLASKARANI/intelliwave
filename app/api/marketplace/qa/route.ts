export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'
import crypto from 'crypto'

// GET: list questions + answers for a listing
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const listingId = parseInt(searchParams.get('listingId') || '0', 10)
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const questionsRes = await pool.query(
      `SELECT q.id, q."listingId", q."askerId", q."askerName", q.question, q."createdAt"
       FROM "MarketplaceQA" q
       WHERE q."listingId" = $1
       ORDER BY q."createdAt" DESC
       LIMIT 50`,
      [listingId]
    )

    const questions = questionsRes.rows

    // Fetch all answers for these questions
    if (questions.length > 0) {
      const ids = questions.map(q => q.id)
      const answersRes = await pool.query(
        `SELECT a.id, a."qaId", a."answererId", a."answererName", a.answer, a."isSellerAnswer", a."createdAt"
         FROM "MarketplaceQAAnswer" a
         WHERE a."qaId" = ANY($1)
         ORDER BY a."createdAt" ASC`,
        [ids]
      )
      const byQuestion: Record<string, any[]> = {}
      for (const a of answersRes.rows) {
        if (!byQuestion[a.qaId]) byQuestion[a.qaId] = []
        byQuestion[a.qaId].push(a)
      }
      for (const q of questions) {
        q.answers = byQuestion[q.id] || []
      }
    } else {
      for (const q of questions) q.answers = []
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('QA GET error:', error?.message)
    return NextResponse.json({ questions: [] })
  }
}

// POST: ask a question
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Sign in required to ask questions' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const listingId = parseInt(body.listingId, 10)
    const question = (body.question || '').toString().trim().slice(0, 500)

    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    if (question.length < 5) return NextResponse.json({ error: 'Question too short (min 5 chars)' }, { status: 400 })

    // Verify listing exists + get seller
    const listingRes = await pool.query(
      `SELECT id, title, "sellerId" FROM "MarketplaceListing" WHERE id = $1 AND status = 'ACTIVE'`,
      [listingId]
    )
    if (listingRes.rows.length === 0) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    const listing = listingRes.rows[0]

    // Prevent asking own listing
    if (listing.sellerId === session.userId) {
      return NextResponse.json({ error: 'You cannot ask questions on your own listing' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "MarketplaceQA" (id, "listingId", "askerId", "askerName", question, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, "listingId", "askerId", "askerName", question, "createdAt"`,
      [id, listingId, session.userId, session.name || 'Anonymous', question]
    )

    // Notify seller
    createNotification({
      userId: listing.sellerId,
      type: 'new_comment',
      title: '❓ New question on your listing',
      body: `"${listing.title}": ${question.slice(0, 100)}${question.length > 100 ? '...' : ''}`,
      link: `/marketplace/listing/${listingId}#qa`,
      actorId: session.userId,
    }).catch(() => {})

    return NextResponse.json({ question: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('QA POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}