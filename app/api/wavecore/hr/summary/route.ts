export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const [empCount, activeCount, deptCount, payrollSum, leaveCount, attendCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Employee"'),
      pool.query(`SELECT COUNT(*) FROM "Employee" WHERE "status" = 'ACTIVE'`),
      pool.query(`SELECT COUNT(DISTINCT department) FROM "Employee" WHERE department IS NOT NULL`),
      pool.query(`SELECT COALESCE(SUM(salary), 0) FROM "Employee" WHERE "status" = 'ACTIVE'`),
      pool.query(`SELECT COUNT(*) FROM "LeaveRequest" WHERE "status" = 'PENDING'`),
      pool.query(`SELECT COUNT(*) FROM "Attendance" WHERE date = CURRENT_DATE`),
    ])

    return NextResponse.json({
      summary: {
        totalEmployees: parseInt(empCount.rows[0].count),
        activeEmployees: parseInt(activeCount.rows[0].count),
        departments: parseInt(deptCount.rows[0].count),
        monthlyPayroll: parseInt(payrollSum.rows[0].sum || '0'),
        pendingLeaves: parseInt(leaveCount.rows[0].count),
        todayAttendance: parseInt(attendCount.rows[0].count),
      },
    })
  } catch (error: any) {
    console.error('HR Summary:', (error as Error).message)
    return NextResponse.json({ summary: {} }, { status: 500 })
  }
}