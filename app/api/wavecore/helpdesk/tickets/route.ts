import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function makeTicketNumber() {
  const d = new Date()
  const ymd = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return 'TKT-' + ymd + '-' + rand
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || ''
    const priority = url.searchParams.get('priority') || ''
    const assigneeId = url.searchParams.get('assigneeId') || ''
    const search = url.searchParams.get('search') || ''
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500)

    let query = `SELECT * FROM "HelpdeskTicket" WHERE "organizationId" = $1`
    const params: any[] = [session.organizationId]

    if (status) { query += ` AND status = $${params.length + 1}`; params.push(status) }
    if (priority) { query += ` AND priority = $${params.length + 1}`; params.push(priority) }
    if (assigneeId) { query += ` AND "assigneeId" = $${params.length + 1}`; params.push(assigneeId) }
    if (search) {
      query += ` AND (subject ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1} OR "requesterName" ILIKE $${params.length + 1})`
      params.push('%' + search + '%')
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    // Stats
    const statsRes = await pool.query(
      `SELECT status, COUNT(*)::int as count FROM "HelpdeskTicket" 
       WHERE "organizationId" = $1 GROUP BY status`,
      [session.organizationId]
    )
    const stats: Record<string, number> = {}
    statsRes.rows.forEach(r => { stats[r.status] = r.count })

    return NextResponse.json({ tickets: result.rows, stats })
  } catch (err) {
    console.error('[helpdesk/tickets GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { subject, description, priority, category, requesterEmail, requesterName } = body

    if (!subject || subject.length < 3) {
      return NextResponse.json({ error: 'Subject required (min 3 chars)' }, { status: 400 })
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const prio = validPriorities.includes(priority) ? priority : 'MEDIUM'

    // Compute dueAt from SLA (if configured)
    let dueAt: Date | null = null
    try {
      const slaRes = await pool.query(
        `SELECT "resolutionMinutes" FROM "HelpdeskSLA" WHERE "organizationId" = $1 AND priority = $2 AND "isActive" = true LIMIT 1`,
        [session.organizationId, prio]
      )
      if (slaRes.rowCount! > 0) {
        const minutes = slaRes.rows[0].resolutionMinutes || 1440
        dueAt = new Date(Date.now() + minutes * 60 * 1000)
      }
    } catch {}

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const ticketNumber = makeTicketNumber()

    await pool.query(
      `INSERT INTO "HelpdeskTicket"
        (id, "organizationId", "ticketNumber", subject, description, priority, status,
         category, "requesterId", "requesterEmail", "requesterName", "dueAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7, $8, $9, $10, $11, NOW(), NOW())`,
      [id, session.organizationId, ticketNumber, subject, description || null, prio,
       category || null, session.userId, requesterEmail || null, requesterName || null, dueAt]
    )

    const result = await pool.query(`SELECT * FROM "HelpdeskTicket" WHERE id = $1`, [id])
    return NextResponse.json({ ticket: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[helpdesk/tickets POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}