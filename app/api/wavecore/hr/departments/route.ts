export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const orgId = session.organizationId

    let sql = `SELECT * FROM "Department" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND (name ILIKE $${idx} OR code ILIKE $${idx} OR head ILIKE $${idx} OR "costCenter" ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    sql += ` ORDER BY name ASC LIMIT 500`

    const depRes = await pool.query(sql, params)
    const departments = depRes.rows

    // Enrich each department with live employee count + monthly cost from Employee table
    const empRes = await pool.query(
      `SELECT department, COUNT(*) AS cnt, COALESCE(SUM(salary),0) AS salary_sum
       FROM "Employee"
       WHERE "organizationId" = $1 AND status = 'ACTIVE'
       GROUP BY department`,
      [orgId]
    )
    const empMap: Record<string, { count: number; salary: number }> = {}
    for (const row of empRes.rows) {
      empMap[row.department || 'Unassigned'] = {
        count: Number(row.cnt || 0),
        salary: Number(row.salary_sum || 0),
      }
    }

    const enriched = departments.map(d => {
      const live = empMap[d.name] || { count: 0, salary: 0 }
      return {
        ...d,
        employeeCount: live.count,
        monthlyCost: Math.round(live.salary / 12),
        annualCost: Math.round(live.salary),
      }
    })

    const totalEmployees = enriched.reduce((s, d) => s + d.employeeCount, 0)
    const totalBudget = enriched.reduce((s, d) => s + Number(d.budgetAmount || 0), 0)
    const totalMonthlyCost = enriched.reduce((s, d) => s + d.monthlyCost, 0)
    const avgPerDept = enriched.length > 0 ? Math.round(totalEmployees / enriched.length) : 0
    const overBudget = enriched.filter(d => Number(d.budgetAmount || 0) > 0 && d.monthlyCost * 12 > Number(d.budgetAmount)).length

    const summary = {
      total: enriched.length,
      totalEmployees,
      totalBudget: Math.round(totalBudget),
      totalMonthlyCost,
      avgEmployeesPerDept: avgPerDept,
      overBudget,
      withHead: enriched.filter(d => d.head && d.head.trim()).length,
      largest: enriched.slice().sort((a, b) => b.employeeCount - a.employeeCount)[0]?.name || '—',
    }

    return NextResponse.json({ departments: enriched, summary })
  } catch (error) {
    console.error('Departments GET error:', error)
    return NextResponse.json({ departments: [], summary: {}, error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================

    const body = await request.json()
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "Department"
        (id, name, code, head, "headEmployeeId", "parentDepartmentId", description,
         "costCenter", "budgetAmount", location, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.name.trim(),
        body.code || null,
        body.head || null,
        body.headEmployeeId || null,
        body.parentDepartmentId || null,
        body.description || null,
        body.costCenter || null,
        Number(body.budgetAmount || 0),
        body.location || null,
        session.organizationId,
      ]
    )
    return NextResponse.json({ department: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Departments POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}