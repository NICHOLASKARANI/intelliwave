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

    let sql = `SELECT * FROM "ProjectComment" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (projectId) { sql += ` AND "projectId" = $${idx++}`; params.push(projectId) }
    if (taskId) { sql += ` AND "taskId" = $${idx++}`; params.push(taskId) }
    sql += ` ORDER BY "createdAt" DESC LIMIT 500`

    const res = await pool.query(sql, params)
    return NextResponse.json({ comments: res.rows })
  } catch (error) {
    console.error('Comments GET error:', error)
    return NextResponse.json({ comments: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
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

    if (!body.body || !body.body.trim()) return NextResponse.json({ error: 'Comment body required' }, { status: 400 })
    if (!body.projectId && !body.taskId) return NextResponse.json({ error: 'Project or Task required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "ProjectComment" (id, "projectId", "taskId", "userId", "authorName", body, "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [id, body.projectId || null, body.taskId || null, session.userId, session.name || 'User', body.body.trim(), session.organizationId]
    )
    return NextResponse.json({ comment: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Comment POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}