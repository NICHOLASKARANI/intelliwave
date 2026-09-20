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
    const orgId = session.organizationId

    let sql = `SELECT * FROM "ProjectMember" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    if (projectId) { sql += ` AND "projectId" = $2`; params.push(projectId) }
    sql += ` ORDER BY "createdAt" ASC LIMIT 500`

    const res = await pool.query(sql, params)
    const members = res.rows.map(m => ({
      ...m,
      hourlyRate: Number(m.hourlyRate || 0),
      allocatedHours: Number(m.allocatedHours || 0),
    }))

    const summary = {
      total: members.length,
      totalAllocatedHours: Math.round(members.reduce((s, m) => s + m.allocatedHours, 0)),
      avgHourlyRate: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.hourlyRate, 0) / members.length) : 0,
    }

    return NextResponse.json({ members, summary })
  } catch (error) {
    console.error('Members GET error:', error)
    return NextResponse.json({ members: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
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
    if (!body.employeeName && !body.userId) return NextResponse.json({ error: 'Employee required' }, { status: 400 })

    const projCheck = await pool.query(
      `SELECT id FROM "Project" WHERE id = $1 AND "organizationId" = $2`,
      [body.projectId, session.organizationId]
    )
    if (projCheck.rows.length === 0) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "ProjectMember" (id, "projectId", "userId", "employeeName", role, "hourlyRate", "allocatedHours", "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [id, body.projectId, body.userId || null, body.employeeName || null, body.role || 'MEMBER', Number(body.hourlyRate || 0), Number(body.allocatedHours || 0), session.organizationId]
    )
    return NextResponse.json({ member: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Member POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}