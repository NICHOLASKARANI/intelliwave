export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================

    const depRes = await pool.query(
      `SELECT * FROM "Department" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (depRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dept = depRes.rows[0]

    const empRes = await pool.query(
      `SELECT id, "firstName", "lastName", "employeeId", email, "jobTitle", position, status, salary, "hireDate"
       FROM "Employee"
       WHERE "organizationId" = $1 AND department = $2
       ORDER BY "firstName" ASC LIMIT 200`,
      [session.organizationId, dept.name]
    )

    return NextResponse.json({ department: dept, employees: empRes.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const key of ['name', 'code', 'head', 'headEmployeeId', 'parentDepartmentId', 'description', 'costCenter', 'location']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(body[key] || null) }
    }
    if (body.budgetAmount !== undefined) { sets.push(`"budgetAmount" = $${i++}`); values.push(Number(body.budgetAmount || 0)) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "Department" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ department: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!
    // ============================

    // Block delete if employees are attached
    const depRes = await pool.query(
      `SELECT name FROM "Department" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (depRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const empCount = await pool.query(
      `SELECT COUNT(*) AS cnt FROM "Employee" WHERE "organizationId" = $1 AND department = $2`,
      [session.organizationId, depRes.rows[0].name]
    )
    if (Number(empCount.rows[0].cnt) > 0) {
      return NextResponse.json({
        error: `Cannot delete — ${empCount.rows[0].cnt} employee(s) still assigned. Reassign them first.`
      }, { status: 400 })
    }

    await pool.query(
      `DELETE FROM "Department" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}