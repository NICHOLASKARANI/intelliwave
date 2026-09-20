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

    if (!ticketId) return NextResponse.json({ attachments: [] })

    const res = await pool.query(
      `SELECT * FROM "TicketAttachment" WHERE "ticketId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC LIMIT 100`,
      [ticketId, orgId]
    )
    return NextResponse.json({ attachments: res.rows })
  } catch (error) {
    console.error('Attachments GET error:', error)
    return NextResponse.json({ attachments: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
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
    if (!body.fileName) return NextResponse.json({ error: 'File name required' }, { status: 400 })

    const ticketCheck = await pool.query(
      `SELECT id FROM "SupportTicket" WHERE id = $1 AND "organizationId" = $2`,
      [body.ticketId, session.organizationId]
    )
    if (ticketCheck.rows.length === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "TicketAttachment" (id, "ticketId", "fileName", "fileUrl", "fileSize", "mimeType", "uploadedBy", "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [
        id, body.ticketId, body.fileName, body.fileUrl || null,
        Number(body.fileSize || 0), body.mimeType || null,
        session.userId, session.organizationId,
      ]
    )

    return NextResponse.json({ attachment: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Attachment POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}