export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

/**
 * GET /api/wavecore/hr/leave-balances?employeeId=&year=
 * Returns this org's leave balances. If employeeId is given, returns
 * just that employee's rows. Seeds missing balance rows from the
 * employee's LeaveType entitlements on read.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

    // Ensure every active employee has a balance row for every leave type
    const ensure = await pool.query(
      `INSERT INTO "LeaveBalance"
         (id, "totalDays", "usedDays", "remainingDays", year, "employeeId", "leaveTypeId", "organizationId", "createdAt", "updatedAt")
       SELECT
         gen_random_uuid()::text,
         lt."daysPerYear", 0, lt."daysPerYear", $1,
         e.id, lt.id, $2, NOW(), NOW()
       FROM "Employee" e
       CROSS JOIN "LeaveType" lt
       WHERE e."organizationId" = $2
         AND lt."organizationId" = $2
         AND e.status = 'ACTIVE'
         AND NOT EXISTS (
           SELECT 1 FROM "LeaveBalance" lb
           WHERE lb."employeeId" = e.id
             AND lb."leaveTypeId" = lt.id
             AND lb.year = $1
             AND lb."organizationId" = $2
         )
       ON CONFLICT DO NOTHING`,
      [year, orgId]
    ).catch(() => ({ rowCount: 0 }))

    let sql = `SELECT lb.id, lb."totalDays", lb."usedDays", lb."remainingDays", lb.year,
                      lb."employeeId", lb."leaveTypeId",
                      e."firstName", e."lastName", e."employeeId" AS "empCode",
                      lt.name AS "leaveTypeName", lt."isPaid"
               FROM "LeaveBalance" lb
               JOIN "Employee" e ON e.id = lb."employeeId"
               JOIN "LeaveType" lt ON lt.id = lb."leaveTypeId"
               WHERE lb."organizationId" = $1 AND lb.year = $2`
    const params: any[] = [orgId, year]
    if (employeeId) { sql += ` AND lb."employeeId" = $3`; params.push(employeeId) }
    sql += ` ORDER BY e."firstName" ASC, lt.name ASC LIMIT 5000`

    const r = await pool.query(sql, params)
    return NextResponse.json({ balances: r.rows, year })
  } catch (error) {
    console.error('[leave-balances GET]', error)
    return NextResponse.json({ balances: [], error: 'Failed to load' }, { status: 500 })
  }
}