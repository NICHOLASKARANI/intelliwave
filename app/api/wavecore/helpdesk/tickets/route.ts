export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ tickets: [] })

    const result = await pool.query(
      `SELECT * FROM "SupportTicket" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 100`,
      [session!.userId]
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
      [body.subject, body.description || '', body.priority || 'MEDIUM', body.status || 'OPEN', session!.userId]
    )
    return NextResponse.json({ ticket: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "SupportTicket" SET subject = $1, description = $2, priority = $3, status = $4, "updatedAt" = NOW()
       WHERE id = $5 AND "userId" = $6
       RETURNING *`,
      [body.subject, body.description, body.priority || 'MEDIUM', body.status || 'OPEN', body.id, session!.userId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ticket: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "SupportTicket" WHERE id = $1 AND "userId" = $2`, [id, session!.userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}