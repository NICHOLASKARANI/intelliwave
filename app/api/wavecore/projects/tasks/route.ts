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
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    const search = searchParams.get('search')

    let sql = `SELECT * FROM "Task" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (projectId) { sql += ` AND "projectId" = $${idx++}`; params.push(projectId) }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    if (assigneeId) { sql += ` AND "assigneeId" = $${idx++}`; params.push(assigneeId) }
    if (search) {
      sql += ` AND (title ILIKE $${idx} OR description ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    sql += ` ORDER BY "sortOrder" ASC, "createdAt" DESC LIMIT 2000`

    const res = await pool.query(sql, params)
    const tasks = res.rows.map(t => {
      const due = t.dueDate ? new Date(t.dueDate) : null
      const now = new Date()
      const isOverdue = due && due < now && t.status !== 'DONE'
      const daysUntilDue = due ? Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
      return {
        ...t,
        estimatedHours: Number(t.estimatedHours || 0),
        actualHours: Number(t.actualHours || 0),
        isOverdue,
        daysUntilDue,
      }
    })

    // Group by status for Kanban columns
    const columns = {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      REVIEW: tasks.filter(t => t.status === 'REVIEW'),
      DONE: tasks.filter(t => t.status === 'DONE'),
      BLOCKED: tasks.filter(t => t.status === 'BLOCKED'),
    }

    const summary = {
      total: tasks.length,
      todo: columns.TODO.length,
      inProgress: columns.IN_PROGRESS.length,
      review: columns.REVIEW.length,
      done: columns.DONE.length,
      blocked: columns.BLOCKED.length,
      overdue: tasks.filter(t => t.isOverdue).length,
      totalEstimatedHours: Math.round(tasks.reduce((s, t) => s + t.estimatedHours, 0)),
      totalActualHours: Math.round(tasks.reduce((s, t) => s + t.actualHours, 0) * 10) / 10,
    }

    return NextResponse.json({ tasks, columns, summary })
  } catch (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ tasks: [], columns: {}, summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
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
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }
    if (!body.projectId) {
      return NextResponse.json({ error: 'Project is required' }, { status: 400 })
    }

    // Verify project belongs to this tenant
    const projCheck = await pool.query(
      `SELECT id FROM "Project" WHERE id = $1 AND "organizationId" = $2`,
      [body.projectId, session.organizationId]
    )
    if (projCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Task"
        (id, title, description, "projectId", "assigneeId", status, priority, "startDate", "dueDate",
         "estimatedHours", "actualHours", "parentTaskId", "sortOrder", tags, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.title.trim(),
        body.description || null,
        body.projectId,
        body.assigneeId || null,
        body.status || 'TODO',
        body.priority || 'NORMAL',
        body.startDate || null,
        body.dueDate || null,
        Number(body.estimatedHours || 0),
        Number(body.actualHours || 0),
        body.parentTaskId || null,
        Number(body.sortOrder || 0),
        body.tags || null,
        session.organizationId,
      ]
    )

    return NextResponse.json({ task: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}