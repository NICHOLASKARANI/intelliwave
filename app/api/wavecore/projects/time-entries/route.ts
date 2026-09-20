export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!
    // ===========================
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const orgId = session.organizationId

    let sql = `SELECT * FROM "TimeEntry" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (projectId) { sql += ` AND "projectId" = $${idx++}`; params.push(projectId) }
    if (taskId) { sql += ` AND "taskId" = $${idx++}`; params.push(taskId) }
    sql += ` ORDER BY "entryDate" DESC LIMIT 1000`

    const res = await pool.query(sql, params)
    const entries = res.rows.map(e => ({ ...e, hours: Number(e.hours || 0), billable: Boolean(e.billable) }))

    const summary = {
      total: entries.length,
      totalHours: Math.round(entries.reduce((s, e) => s + e.hours, 0) * 10) / 10,
      billableHours: Math.round(entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0) * 10) / 10,
      avgHoursPerEntry: entries.length > 0 ? Math.round((entries.reduce((s, e) => s + e.hours, 0) / entries.length) * 10) / 10 : 0,
    }

    return NextResponse.json({ entries, timeEntries: entries, summary })
  } catch (error) {
    console.error('TimeEntries GET error:', error)
    return NextResponse.json({ entries: [], timeEntries: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!
    // ===========================
    const body = await request.json()

    if (!body.projectId) return NextResponse.json({ error: 'Project required' }, { status: 400 })
    const hours = Number(body.hours || 0)
    if (hours <= 0 || hours > 24) return NextResponse.json({ error: 'Hours must be between 0 and 24' }, { status: 400 })

    const projCheck = await pool.query(
      `SELECT id FROM "Project" WHERE id = $1 AND "organizationId" = $2`,
      [body.projectId, session.organizationId]
    )
    if (projCheck.rows.length === 0) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "TimeEntry" (id, "taskId", "projectId", "userId", "employeeName", hours, description, "entryDate", billable, "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       RETURNING *`,
      [
        id, body.taskId || null, body.projectId,
        session.userId, body.employeeName || session.name,
        hours, body.description || null,
        body.entryDate || new Date().toISOString(),
        body.billable !== false,
        session.organizationId,
      ]
    )

    // Update task's actual hours if linked
    if (body.taskId) {
      await pool.query(
        `UPDATE "Task" SET "actualHours" = COALESCE("actualHours", 0) + $1, "updatedAt" = NOW()
         WHERE id = $2 AND "organizationId" = $3`,
        [hours, body.taskId, session.organizationId]
      ).catch(() => {})
    }

    return NextResponse.json({ entry: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('TimeEntry POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}