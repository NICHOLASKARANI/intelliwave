export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    let sql = `SELECT * FROM "Project" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (title ILIKE $${idx} OR description ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    if (priority && priority !== 'ALL') { sql += ` AND priority = $${idx++}`; params.push(priority) }

    sql += ` ORDER BY "createdAt" DESC LIMIT 500`

    const projRes = await pool.query(sql, params)
    const projects = projRes.rows

    // Enrich with live counts (parallel per org, not per project)
    const [taskRes, milestoneRes, timeRes, memberRes] = await Promise.all([
      pool.query(
        `SELECT "projectId", 
                COUNT(*) FILTER (WHERE status != 'DONE') AS open_tasks,
                COUNT(*) FILTER (WHERE status = 'DONE') AS done_tasks,
                COUNT(*) AS total_tasks
         FROM "Task" WHERE "organizationId" = $1 GROUP BY "projectId"`,
        [orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT "projectId",
                COUNT(*) FILTER (WHERE completed = true) AS done_milestones,
                COUNT(*) AS total_milestones
         FROM "Milestone" WHERE "organizationId" = $1 GROUP BY "projectId"`,
        [orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT "projectId", COALESCE(SUM(hours), 0) AS total_hours
         FROM "TimeEntry" WHERE "organizationId" = $1 GROUP BY "projectId"`,
        [orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT "projectId", COUNT(*) AS member_count
         FROM "ProjectMember" WHERE "organizationId" = $1 GROUP BY "projectId"`,
        [orgId]
      ).catch(() => ({ rows: [] })),
    ])

    const taskMap: Record<string, any> = {}
    for (const r of taskRes.rows) taskMap[r.projectId] = { openTasks: Number(r.open_tasks), doneTasks: Number(r.done_tasks), totalTasks: Number(r.total_tasks) }
    const msMap: Record<string, any> = {}
    for (const r of milestoneRes.rows) msMap[r.projectId] = { doneMilestones: Number(r.done_milestones), totalMilestones: Number(r.total_milestones) }
    const timeMap: Record<string, number> = {}
    for (const r of timeRes.rows) timeMap[r.projectId] = Number(r.total_hours)
    const memberMap: Record<string, number> = {}
    for (const r of memberRes.rows) memberMap[r.projectId] = Number(r.member_count)

    const enriched = projects.map(p => {
      const tasks = taskMap[p.id] || { openTasks: 0, doneTasks: 0, totalTasks: 0 }
      const ms = msMap[p.id] || { doneMilestones: 0, totalMilestones: 0 }
      const hours = timeMap[p.id] || 0
      const team = memberMap[p.id] || 0

      // Auto-compute progress if tasks exist, otherwise use stored progress
      const computedProgress = tasks.totalTasks > 0
        ? Math.round((tasks.doneTasks / tasks.totalTasks) * 100)
        : Number(p.progress || 0)

      const endDate = p.endDate ? new Date(p.endDate) : null
      const now = new Date()
      const isOverdue = endDate && endDate < now && p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
      const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

      return {
        ...p,
        budget: Number(p.budget || 0),
        progress: computedProgress,
        openTasks: tasks.openTasks,
        doneTasks: tasks.doneTasks,
        totalTasks: tasks.totalTasks,
        doneMilestones: ms.doneMilestones,
        totalMilestones: ms.totalMilestones,
        totalHours: Math.round(hours * 10) / 10,
        teamSize: team,
        isOverdue,
        daysRemaining,
      }
    })

    // Summary KPIs
    const active = enriched.filter(p => p.status === 'ACTIVE')
    const completed = enriched.filter(p => p.status === 'COMPLETED')
    const planning = enriched.filter(p => p.status === 'PLANNING')
    const overdue = enriched.filter(p => p.isOverdue)
    const totalBudget = enriched.reduce((s, p) => s + p.budget, 0)
    const totalHours = enriched.reduce((s, p) => s + p.totalHours, 0)
    const totalTasks = enriched.reduce((s, p) => s + p.totalTasks, 0)
    const openTasks = enriched.reduce((s, p) => s + p.openTasks, 0)
    const teamSet = new Set<string>()
    for (const p of enriched) {
      if (p.managerId) teamSet.add(p.managerId)
    }
    const avgProgress = enriched.length > 0
      ? Math.round(enriched.reduce((s, p) => s + p.progress, 0) / enriched.length)
      : 0

    const summary = {
      total: enriched.length,
      active: active.length,
      completed: completed.length,
      planning: planning.length,
      overdue: overdue.length,
      totalBudget: Math.round(totalBudget),
      totalHours: Math.round(totalHours),
      totalTasks,
      openTasks,
      avgProgress,
      teamSize: teamSet.size,
      completionRate: enriched.length > 0 ? Math.round((completed.length / enriched.length) * 100) : 0,
    }

    return NextResponse.json({ projects: enriched, summary })
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ projects: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Project"
        (id, title, description, status, budget, currency, "startDate", "endDate",
         "clientId", priority, progress, "managerId", color, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.title.trim(),
        body.description || '',
        body.status || 'PLANNING',
        Number(body.budget || 0),
        body.currency || 'KES',
        body.startDate || null,
        body.endDate || null,
        body.clientId || '',
        body.priority || 'NORMAL',
        Number(body.progress || 0),
        body.managerId || null,
        body.color || '#14b8a6',
        session.organizationId,
      ]
    )

    return NextResponse.json({ project: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Projects POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}