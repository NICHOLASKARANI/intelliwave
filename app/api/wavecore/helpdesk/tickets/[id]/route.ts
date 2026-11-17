export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const ticketRes = await pool.query(
      `SELECT * FROM "SupportTicket" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (ticketRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const ticket = ticketRes.rows[0]

    const safe = async (q: string, p: any[]) => {
      try { return (await pool.query(q, p)).rows } catch { return [] }
    }

    const [comments, attachments] = await Promise.all([
      safe(`SELECT * FROM "TicketComment" WHERE "ticketId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" ASC LIMIT 500`, [params.id, orgId]),
      safe(`SELECT * FROM "TicketAttachment" WHERE "ticketId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC LIMIT 50`, [params.id, orgId]),
    ])

    return NextResponse.json({ ticket, comments, attachments })
  } catch (error) {
    console.error('Ticket detail GET error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['subject','description','status','priority','assigneeId','assigneeName','category','subcategory','channel','tags','customerName','customerEmail','customerPhone']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    if (body.satisfactionRating !== undefined) { sets.push(`"satisfactionRating" = $${i++}`); values.push(Number(body.satisfactionRating || 0)) }
    if (body.satisfactionComment !== undefined) { sets.push(`"satisfactionComment" = $${i++}`); values.push(body.satisfactionComment || null) }

    // Auto-stamp status transitions
    if (body.status === 'RESOLVED') sets.push(`"resolvedAt" = NOW()`)
    if (body.status === 'CLOSED') sets.push(`"closedAt" = NOW()`)
    if (body.firstResponseAt) sets.push(`"firstResponseAt" = NOW()`)

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "SupportTicket" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ticket: result.rows[0] })
  } catch (error) {
    console.error('Ticket PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    // Cascade delete comments + attachments
    await pool.query(`DELETE FROM "TicketComment" WHERE "ticketId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "TicketAttachment" WHERE "ticketId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])

    const result = await pool.query(
      `DELETE FROM "SupportTicket" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ticket DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}