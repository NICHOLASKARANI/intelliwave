export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const ticketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().default('MEDIUM'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const result = await pool.query(
      `SELECT st.id, st.subject, st.description, st.priority, st.status, st."createdAt",
              u.name as user_name,
              (SELECT COUNT(*) FROM "Message" m WHERE m."ticketId" = st.id) as message_count
       FROM "SupportTicket" st
       LEFT JOIN "User" u ON u.id = st."userId"
       WHERE st."userId" = $1
       ORDER BY st."createdAt" DESC
       LIMIT 50`,
      [session.userId]
    )

    return NextResponse.json({ tickets: result.rows })
  } catch (error) {
    console.error('Tickets GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = ticketSchema.parse(body)

    const result = await pool.query(
      `INSERT INTO "SupportTicket" (id, subject, description, priority, status, "userId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'OPEN', $4, NOW(), NOW())
       RETURNING id, subject, status`,
      [validated.subject, validated.description, validated.priority, session.userId]
    )

    return NextResponse.json({ success: true, ticket: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 422 })
    }
    console.error('Tickets POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}