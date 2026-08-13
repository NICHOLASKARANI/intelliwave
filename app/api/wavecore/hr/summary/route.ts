export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const [
      totalEmployees,
      activeEmployees,
      departments,
      monthlyPayroll,
      pendingLeaves,
      todayAttendance,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1 AND status = $2', [session.organizationId, 'ACTIVE']),
      pool.query('SELECT COUNT(DISTINCT department) FROM "Employee" WHERE "organizationId" = $1 AND department IS NOT NULL', [session.organizationId]),
      pool.query(
        `SELECT COALESCE(SUM(pi."netSalary"), 0) as total
         FROM "PayrollItem" pi
         JOIN "PayrollPeriod" pp ON pp.id = pi."payrollPeriodId"
         WHERE pi."organizationId" = $1 AND pp."createdAt" >= date_trunc('month', CURRENT_DATE)`,
        [session.organizationId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM "LeaveRequest" WHERE "organizationId" = $1 AND status = 'PENDING'`,
        [session.organizationId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM "Attendance" WHERE "organizationId" = $1 AND date = CURRENT_DATE`,
        [session.organizationId]
      ),
    ])

    return NextResponse.json({
      summary: {
        totalEmployees: parseInt(totalEmployees.rows[0].count),
        activeEmployees: parseInt(activeEmployees.rows[0].count),
        departments: parseInt(departments.rows[0].count),
        monthlyPayroll: monthlyPayroll.rows[0].total || 0,
        pendingLeaveRequests: parseInt(pendingLeaves.rows[0].count),
        todayAttendance: parseInt(todayAttendance.rows[0].count),
      },
    })
  } catch (error) {
    console.error('HR summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}