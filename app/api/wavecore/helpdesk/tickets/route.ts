export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ tickets: [] })

    const result = await pool.query(
      `SELECT * FROM "SupportTicket" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.userId]
    )
    return NextResponse.json({ tickets: result.rows })
  } catch (error) {
    return NextResponse.json({ tickets: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const result = await pool.query(
      `INSERT INTO "SupportTicket" (id, subject, description, priority, status, "userId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [
        body.subject,
        body.description || '',
        body.priority || 'MEDIUM',
        body.status || 'OPEN',
        session.userId,
      ]
    )

    return NextResponse.json({ ticket: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Ticket create error:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}