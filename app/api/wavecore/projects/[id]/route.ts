export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ===========================

    const orgId = session.organizationId

    // TENANT-ISOLATED fetch
    const projRes = await pool.query(
      `SELECT * FROM "Project" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (projRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const project = projRes.rows[0]

    // Linked data (all tenant-isolated)
    const safe = async (q: string, p: any[]) => {
      try { return (await pool.query(q, p)).rows } catch { return [] }
    }

    const [tasks, milestones, members, timeEntries, comments, files] = await Promise.all([
      safe(`SELECT * FROM "Task" WHERE "projectId" = $1 AND "organizationId" = $2 ORDER BY "sortOrder" ASC, "createdAt" DESC LIMIT 500`, [params.id, orgId]),
      safe(`SELECT * FROM "Milestone" WHERE "projectId" = $1 AND "organizationId" = $2 ORDER BY "dueDate" ASC LIMIT 100`, [params.id, orgId]),
      safe(`SELECT * FROM "ProjectMember" WHERE "projectId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" ASC LIMIT 100`, [params.id, orgId]),
      safe(`SELECT * FROM "TimeEntry" WHERE "projectId" = $1 AND "organizationId" = $2 ORDER BY "entryDate" DESC LIMIT 200`, [params.id, orgId]),
      safe(`SELECT * FROM "ProjectComment" WHERE "projectId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC LIMIT 50`, [params.id, orgId]),
      safe(`SELECT * FROM "ProjectFile" WHERE "projectId" = $1 AND "organizationId" = $2 ORDER BY "createdAt" DESC LIMIT 50`, [params.id, orgId]),
    ])

    // Compute aggregates
    const doneTasks = tasks.filter((t: any) => t.status === 'DONE').length
    const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : Number(project.progress || 0)
    const totalHours = timeEntries.reduce((s: number, t: any) => s + Number(t.hours || 0), 0)
    const totalBudget = Number(project.budget || 0)
    const totalCost = timeEntries.reduce((s: number, t: any) => s + Number(t.hours || 0) * Number(t.hourlyRate || 0), 0)

    return NextResponse.json({
      project: { ...project, progress },
      tasks,
      milestones,
      members,
      timeEntries,
      comments,
      files,
      metrics: {
        totalTasks: tasks.length,
        doneTasks,
        openTasks: tasks.length - doneTasks,
        totalMilestones: milestones.length,
        doneMilestones: milestones.filter((m: any) => m.completed).length,
        totalHours: Math.round(totalHours * 10) / 10,
        teamSize: members.length,
        totalBudget,
        totalCost: Math.round(totalCost),
        budgetVariance: Math.round(totalBudget - totalCost),
      },
    })
  } catch (error) {
    console.error('Project detail GET error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ===========================

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['title', 'description', 'status', 'currency', 'priority', 'managerId', 'color', 'clientId']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    for (const k of ['budget', 'progress']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(Number(body[k] || 0)) }
    }
    for (const k of ['startDate', 'endDate']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "Project" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project: result.rows[0] })
  } catch (error) {
    console.error('Project PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ===========================

    // Cascade delete within tenant
    await pool.query(`DELETE FROM "Task" WHERE "projectId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "Milestone" WHERE "projectId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "ProjectMember" WHERE "projectId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "TimeEntry" WHERE "projectId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "ProjectComment" WHERE "projectId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])
    await pool.query(`DELETE FROM "ProjectFile" WHERE "projectId" = $1 AND "organizationId" = $2`, [params.id, session.organizationId])

    const result = await pool.query(
      `DELETE FROM "Project" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}