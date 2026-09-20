export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')
    const orgId = session.organizationId

    if (!ticketId) return NextResponse.json({ comments: [] })

    const res = await pool.query(
      `SELECT * FROM "TicketComment" WHERE "ticketId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" ASC LIMIT 500`,
      [ticketId, orgId]
    )
    return NextResponse.json({ comments: res.rows })
  } catch (error) {
    console.error('Comments GET error:', error)
    return NextResponse.json({ comments: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.ticketId) return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })
    if (!body.body || !body.body.trim()) return NextResponse.json({ error: 'Comment body required' }, { status: 400 })

    // Verify ticket belongs to this org
    const ticketCheck = await pool.query(
      `SELECT id FROM "SupportTicket" WHERE id = $1 AND "organizationId" = $2`,
      [body.ticketId, session.organizationId]
    )
    if (ticketCheck.rows.length === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "TicketComment" (id, "ticketId", "authorId", "authorName", body, "isInternal", "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [
        id, body.ticketId, session.userId, body.authorName || session.name || 'User',
        body.body.trim(), Boolean(body.isInternal), session.organizationId,
      ]
    )

    // Auto-stamp firstResponseAt if this is the first reply (not internal)
    if (!body.isInternal) {
      await pool.query(
        `UPDATE "SupportTicket" SET "firstResponseAt" = COALESCE("firstResponseAt", NOW()), "updatedAt" = NOW()
         WHERE id = $1 AND "organizationId" = $2`,
        [body.ticketId, session.organizationId]
      ).catch(() => {})
    }

    return NextResponse.json({ comment: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Comment POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}