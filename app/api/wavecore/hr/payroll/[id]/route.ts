export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT pi.*, e."firstName", e."lastName", e."employeeId" AS "empCode", e.department, e."jobTitle", e.salary,
              p.name AS "periodName", p."startDate" AS "periodStart", p."endDate" AS "periodEnd"
       FROM "PayrollItem" pi
       LEFT JOIN "Employee" e ON e.id = pi."employeeId" AND e."organizationId" = pi."organizationId"
       LEFT JOIN "PayrollPeriod" p ON p.id = pi."periodId" AND p."organizationId" = pi."organizationId"
       WHERE pi.id = $1 AND pi."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item: res.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const key of ['grossPay', 'netPay', 'deductions', 'paye', 'nssf', 'shif', 'housingLevy']) {
      if (body[key] !== undefined) { sets.push(`"${key}" = $${i++}`); values.push(Number(body[key] || 0)) }
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "PayrollItem" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item: result.rows[0] })
  } catch (error) {
    console.error('[HR-ERROR]', error); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `DELETE FROM "PayrollItem" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}