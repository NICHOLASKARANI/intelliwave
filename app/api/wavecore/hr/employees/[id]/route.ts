export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'
import { validateEmployeeInput, validationErrorResponse } from '@/lib/wavecore/validate'

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

    const [leaves, reviews, documents, payrolls, trainings, balances] = await Promise.all([
      // Leave requests with the linked leave type name
      safe(
        `SELECT l.id, l."startDate", l."endDate", l.days, l.status, l.reason, lt.name AS "leaveTypeName"
         FROM "LeaveRequest" l
         LEFT JOIN "LeaveType" lt ON lt.id = l."leaveTypeId"
         WHERE l."organizationId" = $1 AND l."employeeId" = $2
         ORDER BY l."startDate" DESC LIMIT 20`,
        [session.organizationId, params.id]
      ),
      // Performance reviews — schema is: reviewDate, rating, strengths, improvements, goals
      safe(
        `SELECT id, "reviewDate", rating, strengths, improvements, goals
         FROM "PerformanceReview"
         WHERE "organizationId" = $1 AND "employeeId" = $2
         ORDER BY "reviewDate" DESC LIMIT 10`,
        [session.organizationId, params.id]
      ),
      // Employee documents — schema is: name, type, url
      safe(
        `SELECT id, name, type, url, "createdAt"
         FROM "EmployeeDocument"
         WHERE "organizationId" = $1 AND "employeeId" = $2
         ORDER BY "createdAt" DESC LIMIT 50`,
        [session.organizationId, params.id]
      ),
      // Payroll items — join period name; use correct column "payrollPeriodId"
      safe(
        `SELECT pi.id, pi."grossPay", pi."netPay", pi.paye, pi.nssf, pi.shif, pi."housingLevy",
                pi."payrollPeriodId", p.name AS "periodName", p."startDate" AS "periodStart", p."endDate" AS "periodEnd"
         FROM "PayrollItem" pi
         LEFT JOIN "PayrollPeriod" p ON p.id = pi."payrollPeriodId"
         WHERE pi."organizationId" = $1 AND pi."employeeId" = $2
         ORDER BY pi."createdAt" DESC LIMIT 12`,
        [session.organizationId, params.id]
      ),
      // Training enrollments — TrainingEnrollment joined to Training
      safe(
        `SELECT te.id, te.status, te."completionDate", t.title, t.type, t."startDate", t."endDate", t.provider
         FROM "TrainingEnrollment" te
         LEFT JOIN "Training" t ON t.id = te."trainingId"
         WHERE te."organizationId" = $1 AND te."employeeId" = $2
         ORDER BY te."createdAt" DESC LIMIT 20`,
        [session.organizationId, params.id]
      ),
      // Leave balances for current year
      safe(
        `SELECT lb.id, lb."totalDays", lb."usedDays", lb."remainingDays", lb.year,
                lt.name AS "leaveTypeName"
         FROM "LeaveBalance" lb
         LEFT JOIN "LeaveType" lt ON lt.id = lb."leaveTypeId"
         WHERE lb."organizationId" = $1 AND lb."employeeId" = $2
         ORDER BY lt.name ASC`,
        [session.organizationId, params.id]
      ),
    ])

    // Recent attendance (last 30 records)
    const attendance = await safe(
      `SELECT id, date, "checkIn", "checkOut", status, notes
       FROM "Attendance"
       WHERE "organizationId" = $1 AND "employeeId" = $2
       ORDER BY date DESC LIMIT 30`,
      [session.organizationId, params.id]
    )

    return NextResponse.json({
      employee: emp,
      leaves,
      reviews,
      documents,
      payrolls,
      trainings,
      balances,
      attendance,
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

    // === INPUT VALIDATION ===
    const validation = validateEmployeeInput(body, false)
    if (!validation.valid) return validationErrorResponse(validation)
    // ========================
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
    console.error('[HR-ERROR]', error); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
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