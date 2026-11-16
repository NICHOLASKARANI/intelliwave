import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ticket belongs to org
    const ticketRes = await pool.query(
      `SELECT id, "firstResponseAt" FROM "HelpdeskTicket" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (ticketRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { content, isInternal } = body
    if (!content || content.trim().length < 1) {
      return NextResponse.json({ error: 'Comment content required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "HelpdeskComment" (id, "ticketId", "authorId", "authorName", "authorEmail", content, "isInternal", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, params.id, session.userId, session.name || 'Agent', session.email || null, content.trim(), !!isInternal]
    )

    // Auto-update firstResponseAt if this is the first agent reply
    if (!ticketRes.rows[0].firstResponseAt && !isInternal) {
      await pool.query(
        `UPDATE "HelpdeskTicket" SET "firstResponseAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
        [params.id]
      )
    }

    const commentRes = await pool.query(`SELECT * FROM "HelpdeskComment" WHERE id = $1`, [id])
    return NextResponse.json({ comment: commentRes.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[helpdesk/comments POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}