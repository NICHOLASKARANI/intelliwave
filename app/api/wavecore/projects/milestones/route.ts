export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const orgId = session.organizationId

    let sql = `SELECT * FROM "Milestone" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    if (projectId) { sql += ` AND "projectId" = $2`; params.push(projectId) }
    sql += ` ORDER BY "dueDate" ASC LIMIT 500`

    const res = await pool.query(sql, params)
    const milestones = res.rows.map(m => {
      const due = m.dueDate ? new Date(m.dueDate) : null
      const now = new Date()
      return {
        ...m,
        isOverdue: !m.completed && due && due < now,
        daysUntil: due ? Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
      }
    })

    const done = milestones.filter(m => m.completed).length
    const summary = {
      total: milestones.length,
      completed: done,
      pending: milestones.length - done,
      overdue: milestones.filter(m => m.isOverdue).length,
      completionRate: milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0,
    }

    return NextResponse.json({ milestones, summary })
  } catch (error) {
    console.error('Milestones GET error:', error)
    return NextResponse.json({ milestones: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    if (!body.title || !body.title.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    if (!body.projectId) return NextResponse.json({ error: 'Project required' }, { status: 400 })
    if (!body.dueDate) return NextResponse.json({ error: 'Due date required' }, { status: 400 })

    const projCheck = await pool.query(
      `SELECT id FROM "Project" WHERE id = $1 AND "organizationId" = $2`,
      [body.projectId, session.organizationId]
    )
    if (projCheck.rows.length === 0) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Milestone" (id, title, description, "dueDate", completed, "projectId", "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       RETURNING *`,
      [id, body.title.trim(), body.description || null, body.dueDate, body.completed || false, body.projectId, session.organizationId]
    )
    return NextResponse.json({ milestone: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Milestones POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}