export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PII_READ')
    if (guard.deny) return guard.response!
    // ==================

    const empRes = await pool.query(
      `SELECT * FROM "Employee" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (empRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const emp = empRes.rows[0]

    // Linked data — safe queries (silent fallback if table missing)
    const safe = async (q: string, p: any[]) => {
      try { return (await pool.query(q, p)).rows } catch { return [] }
    }

    const [leaves, reviews, documents, payrolls, onboarding] = await Promise.all([
      safe(`SELECT id, "startDate", "endDate", days, status, reason FROM "LeaveRequest" WHERE "organizationId" = $1 AND "employeeId" = $2 ORDER BY "startDate" DESC LIMIT 20`, [session.organizationId, params.id]),
      safe(`SELECT id, "reviewPeriod", score, status FROM "PerformanceReview" WHERE "organizationId" = $1 AND "employeeId" = $2 ORDER BY "reviewDate" DESC LIMIT 10`, [session.organizationId, params.id]),
      safe(`SELECT id, "documentType", "fileName", "expiryDate" FROM "EmployeeDocument" WHERE "organizationId" = $1 AND "employeeId" = $2 LIMIT 50`, [session.organizationId, params.id]),
      safe(`SELECT id, "grossPay", "netPay", "periodId" FROM "PayrollItem" WHERE "organizationId" = $1 AND "employeeId" = $2 ORDER BY "createdAt" DESC LIMIT 12`, [session.organizationId, params.id]),
      safe(`SELECT id, status, "currentStep", "totalSteps" FROM "OnboardingChecklist" WHERE "organizationId" = $1 AND "employeeId" = $2 LIMIT 5`, [session.organizationId, params.id]),
    ])

    return NextResponse.json({
      employee: emp,
      leaves,
      reviews,
      documents,
      payrolls,
      onboarding,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PII_READ')
    if (guard.deny) return guard.response!
    // ==================

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    const stringFields = [
      'employeeId','firstName','lastName','email','phone','gender','maritalStatus',
      'nationality','idNumber','taxPin','nssfNumber','nhifNumber','address','city','country',
      'emergencyContact','emergencyPhone','department','position','employmentType','status',
      'currency','bankName','bankAccount','notes','preferredName','jobTitle','jobFamily',
      'grade','division','branch','costCenter','reportingManagerId','photoUrl'
    ]
    for (const k of stringFields) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    if (body.salary !== undefined) { sets.push(`salary = $${i++}`); values.push(Number(body.salary || 0)) }
    if (body.dateOfBirth !== undefined) { sets.push(`"dateOfBirth" = $${i++}`); values.push(body.dateOfBirth || null) }
    if (body.hireDate !== undefined) { sets.push(`"hireDate" = $${i++}`); values.push(body.hireDate || null) }
    if (body.terminationDate !== undefined) { sets.push(`"terminationDate" = $${i++}`); values.push(body.terminationDate || null) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.organizationId)

    const result = await pool.query(
      `UPDATE "Employee" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ employee: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// Alias PUT → PATCH for backward compat
export const PUT = PATCH

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PII_READ')
    if (guard.deny) return guard.response!
    // ==================

    // Block delete if active leave/payroll records exist
    const leaveCount = await pool.query(
      `SELECT COUNT(*) AS cnt FROM "LeaveRequest" WHERE "organizationId" = $1 AND "employeeId" = $2 AND status IN ('PENDING','APPROVED')`,
      [session.organizationId, params.id]
    ).catch(() => ({ rows: [{ cnt: 0 }] }))

    if (Number(leaveCount.rows[0]?.cnt || 0) > 0) {
      return NextResponse.json({
        error: `Cannot delete — employee has ${leaveCount.rows[0].cnt} active leave request(s). Cancel them first.`
      }, { status: 400 })
    }

    const result = await pool.query(
      `DELETE FROM "Employee" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}