export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const payrollSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  paymentDate: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT pp.*,
              (SELECT COUNT(*) FROM "PayrollItem" pi WHERE pi."payrollPeriodId" = pp.id) as employee_count,
              (SELECT COALESCE(SUM(pi."netSalary"), 0) FROM "PayrollItem" pi WHERE pi."payrollPeriodId" = pp.id) as total_net_salary
       FROM "PayrollPeriod" pp
       WHERE pp."organizationId" = $1
       ORDER BY pp."createdAt" DESC
       LIMIT 20`,
      [session.organizationId]
    )

    return NextResponse.json({ payrollPeriods: result.rows })
  } catch (error) {
    console.error('Payroll GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = payrollSchema.parse(body)

    await client.query('BEGIN')

    // Create payroll period
    const period = await client.query(
      `INSERT INTO "PayrollPeriod" (id, name, "startDate", "endDate", "paymentDate", status, "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'DRAFT', $5, NOW(), NOW())
       RETURNING id`,
      [validated.name, new Date(validated.startDate), new Date(validated.endDate), new Date(validated.paymentDate), session.organizationId]
    )

    // Get all active employees
    const employees = await client.query(
      'SELECT id, salary FROM "Employee" WHERE "organizationId" = $1 AND status = $2',
      [session.organizationId, 'ACTIVE']
    )

    // Create payroll items for each employee
    for (const emp of employees.rows) {
      const basicSalary = emp.salary || 0
      const allowances = basicSalary * 0.1 // 10% allowances (house, transport)
      const deductions = basicSalary * 0.05 // 5% deductions (NSSF, NHIF)
      const netSalary = basicSalary + allowances - deductions

      await client.query(
        `INSERT INTO "PayrollItem" (id, "basicSalary", allowances, deductions, "netSalary", "employeeId", "payrollPeriodId", "organizationId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [basicSalary, allowances, deductions, netSalary, emp.id, period.rows[0].id, session.organizationId]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      payrollPeriodId: period.rows[0].id,
      employeesProcessed: employees.rows.length,
    }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Payroll POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}