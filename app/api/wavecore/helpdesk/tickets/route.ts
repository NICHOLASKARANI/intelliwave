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

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigneeId = searchParams.get('assigneeId')
    const category = searchParams.get('category')

    let sql = `SELECT * FROM "SupportTicket" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (subject ILIKE $${idx} OR description ILIKE $${idx} OR "customerName" ILIKE $${idx} OR "customerEmail" ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    if (priority && priority !== 'ALL') { sql += ` AND priority = $${idx++}`; params.push(priority) }
    if (assigneeId) { sql += ` AND "assigneeId" = $${idx++}`; params.push(assigneeId) }
    if (category && category !== 'ALL') { sql += ` AND category = $${idx++}`; params.push(category) }

    sql += ` ORDER BY 
      CASE priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
      "createdAt" DESC LIMIT 1000`

    const res = await pool.query(sql, params)
    const now = new Date()
    const tickets = res.rows.map(t => {
      const dueAt = t.dueAt ? new Date(t.dueAt) : null
      const resolved = t.resolvedAt ? new Date(t.resolvedAt) : null
      const isOverdue = !resolved && dueAt && dueAt < now
      const daysOpen = Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const responseHours = t.firstResponseAt
        ? Math.round(((new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60)) * 10) / 10
        : null
      const resolutionHours = resolved
        ? Math.round(((resolved.getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60)) * 10) / 10
        : null

      return {
        ...t,
        isOverdue,
        daysOpen,
        responseHours,
        resolutionHours,
      }
    })

    // Compute summary KPIs
    const open = tickets.filter(t => t.status === 'OPEN')
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS')
    const pending = tickets.filter(t => t.status === 'PENDING')
    const resolvedList = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')
    const overdue = tickets.filter(t => t.isOverdue)

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const resolvedToday = resolvedList.filter(t => t.resolvedAt && new Date(t.resolvedAt) >= todayStart).length

    const avgResponseHours = (() => {
      const withResponse = tickets.filter(t => t.responseHours !== null)
      if (withResponse.length === 0) return 0
      return Math.round((withResponse.reduce((s, t) => s + t.responseHours, 0) / withResponse.length) * 10) / 10
    })()

    const avgResolutionHours = (() => {
      const withRes = resolvedList.filter(t => t.resolutionHours !== null)
      if (withRes.length === 0) return 0
      return Math.round((withRes.reduce((s, t) => s + t.resolutionHours, 0) / withRes.length) * 10) / 10
    })()

    const rated = tickets.filter(t => t.satisfactionRating)
    const avgCsat = rated.length > 0
      ? Math.round((rated.reduce((s, t) => s + Number(t.satisfactionRating), 0) / rated.length) * 10) / 10
      : 0

    const summary = {
      total: tickets.length,
      open: open.length,
      inProgress: inProgress.length,
      pending: pending.length,
      resolved: resolvedList.length,
      overdue: overdue.length,
      resolvedToday,
      unassigned: tickets.filter(t => !t.assigneeId).length,
      avgResponseHours,
      avgResolutionHours,
      avgCsat,
      csatCount: rated.length,
      slaComplianceRate: tickets.length > 0
        ? Math.round(((tickets.length - overdue.length) / tickets.length) * 100)
        : 100,
    }

    return NextResponse.json({ tickets, summary })
  } catch (error) {
    console.error('Tickets GET error:', error)
    return NextResponse.json({ tickets: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.subject || !body.subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Look up SLA policy for priority to set dueAt
    const priority = body.priority || 'MEDIUM'
    const slaRes = await pool.query(
      `SELECT "resolutionHours" FROM "SLAPolicy" WHERE "organizationId" = $1 AND priority = $2 AND active = true LIMIT 1`,
      [session.organizationId, priority]
    ).catch(() => ({ rows: [] }))

    const resolutionHours = slaRes.rows[0]?.resolutionHours || 24
    const dueAt = new Date(Date.now() + resolutionHours * 60 * 60 * 1000)

    const result = await pool.query(
      `INSERT INTO "SupportTicket"
        (id, subject, description, priority, status, "userId", "organizationId",
         "customerName", "customerEmail", "customerPhone",
         category, subcategory, channel, tags, "assigneeId", "assigneeName", "dueAt",
         "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.subject.trim(),
        body.description || '',
        priority,
        body.status || 'OPEN',
        session.userId,
        session.organizationId,
        body.customerName || null,
        body.customerEmail || null,
        body.customerPhone || null,
        body.category || 'GENERAL',
        body.subcategory || null,
        body.channel || 'WEB',
        body.tags || null,
        body.assigneeId || null,
        body.assigneeName || null,
        dueAt,
      ]
    )

    return NextResponse.json({ ticket: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Ticket POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}