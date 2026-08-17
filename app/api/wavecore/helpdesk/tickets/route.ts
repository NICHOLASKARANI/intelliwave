export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT st.*, u.name as user_name,
        (SELECT COUNT(*) FROM "Message" m WHERE m."ticketId" = st.id) as message_count
       FROM "SupportTicket" st
       LEFT JOIN "User" u ON u.id = st."userId"
       ORDER BY st."createdAt" DESC LIMIT 100`
    )
    return NextResponse.json({ tickets: result.rows })
  } catch (error: any) {
    console.error('Tickets GET:', error.message)
    return NextResponse.json({ tickets: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const userResult = await pool.query('SELECT id FROM "User" LIMIT 1')
    const userId = userResult.rows.length > 0 ? userResult.rows[0].id : 'user-1'

    const result = await pool.query(
      `INSERT INTO "SupportTicket" ("id", "subject", "description", "priority", "status", "userId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'OPEN', $4, NOW(), NOW()) 
       RETURNING *`,
      [body.subject, body.description, body.priority || 'MEDIUM', userId]
    )

    return NextResponse.json({ success: true, ticket: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Ticket POST:', error.message)
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 })
  }
}