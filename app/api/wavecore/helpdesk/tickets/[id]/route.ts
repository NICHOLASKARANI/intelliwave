import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ticketRes = await pool.query(
      `SELECT * FROM "HelpdeskTicket" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (ticketRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const commentsRes = await pool.query(
      `SELECT * FROM "HelpdeskComment" WHERE "ticketId" = $1 ORDER BY "createdAt" ASC`,
      [params.id]
    )

    return NextResponse.json({
      ticket: ticketRes.rows[0],
      comments: commentsRes.rows,
    })
  } catch (err) {
    console.error('[helpdesk/ticket GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const allowedFields = ['status', 'priority', 'assigneeId', 'assigneeName', 'category']
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        sets.push(`"${field}" = $${i++}`)
        values.push(body[field])
      }
    }

    // Auto-timestamp on status change
    if (body.status === 'RESOLVED' && !body.resolvedAt) {
      sets.push(`"resolvedAt" = NOW()`)
    }
    if (body.status === 'CLOSED' && !body.closedAt) {
      sets.push(`"closedAt" = NOW()`)
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id)
    values.push(session.organizationId)

    const result = await pool.query(
      `UPDATE "HelpdeskTicket" SET ${sets.join(', ')} 
       WHERE id = $${i} AND "organizationId" = $${i + 1} RETURNING *`,
      values
    )

    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ticket: result.rows[0] })
  } catch (err) {
    console.error('[helpdesk/ticket PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}