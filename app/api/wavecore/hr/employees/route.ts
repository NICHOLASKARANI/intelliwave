export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'
import { validateEmployeeInput, validationErrorResponse } from '@/lib/wavecore/validate'

// Auto-generate next Employee code like EMP-0001
async function nextEmployeeCode(orgId: string): Promise<string> {
  const res = await pool.query(
    `SELECT COUNT(*) AS cnt FROM "Employee" WHERE "organizationId" = $1`,
    [orgId]
  )
  const n = Number(res.rows[0]?.cnt || 0) + 1
  return 'EMP-' + String(n).padStart(4, '0')
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PII_READ')
    if (guard.deny) return guard.response!
    // ==================
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const orgId = session.organizationId

    // Projection — list view NEVER returns PII (taxPin, idNumber, bankAccount, nssfNumber, nhifNumber, salary)
    // Full PII is available only via GET /employees/[id] which enforces RBAC + logs access
    let sql = `SELECT id, "employeeId", "firstName", "lastName", "preferredName", email, phone, department, position, "jobTitle", "employmentType", status, "hireDate", "terminationDate", "organizationId", "createdAt", "updatedAt" FROM "Employee" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2

    if (search) {
      sql += ` AND ("firstName" ILIKE $${idx} OR "lastName" ILIKE $${idx} OR "employeeId" ILIKE $${idx} OR email ILIKE $${idx})`
      params.push(`%${search}%`); idx++
    }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    if (department && department !== 'ALL') { sql += ` AND department = $${idx++}`; params.push(department) }
    sql += ` ORDER BY "firstName" ASC, "lastName" ASC LIMIT 2000`

    const res = await pool.query(sql, params)
    const employees = res.rows.map(e => ({
      ...e,
      fullName: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
    }))

    // Compute summary
    const active = employees.filter(e => e.status === 'ACTIVE')
    const onLeave = employees.filter(e => e.status === 'ON_LEAVE' || e.status === 'LEAVE')
    const terminated = employees.filter(e => e.status === 'TERMINATED')
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const newHires = employees.filter(e => e.hireDate && new Date(e.hireDate) >= monthStart)

    const depts = new Set(employees.map(e => e.department).filter(Boolean))
    // Aggregate salary server-side — individual salaries are NEVER sent to client
    const salaryAgg = await pool.query(
      `SELECT COALESCE(SUM(salary), 0) AS total, COALESCE(AVG(salary), 0) AS avg
       FROM "Employee" WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
      [orgId]
    ).catch(() => ({ rows: [{ total: 0, avg: 0 }] }))
    const totalPayroll = Number(salaryAgg.rows[0]?.total || 0)
    const avgSalary = Math.round(Number(salaryAgg.rows[0]?.avg || 0))

    const summary = {
      total: employees.length,
      active: active.length,
      onLeave: onLeave.length,
      terminated: terminated.length,
      newHiresThisMonth: newHires.length,
      departments: depts.size,
      monthlyPayroll: Math.round(totalPayroll / 12),
      annualPayroll: Math.round(totalPayroll),
      avgSalary,
    }

    // Department breakdown for filter dropdown
    const deptMap: Record<string, number> = {}
    for (const e of employees) {
      const d = e.department || 'Unassigned'
      deptMap[d] = (deptMap[d] || 0) + 1
    }
    const byDepartment = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ employees, summary, byDepartment })
  } catch (error) {
    console.error('Employees GET error:', error)
    return NextResponse.json({ employees: [], summary: {}, byDepartment: [], error: 'Something went wrong. Please try again.' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PII_READ')
    if (guard.deny) return guard.response!
    // ==================
    const body = await request.json()

    // === INPUT VALIDATION ===
    const validation = validateEmployeeInput(body, true)
    if (!validation.valid) return validationErrorResponse(validation)
    // ========================
    if (!body.firstName || !body.firstName.trim()) return NextResponse.json({ error: 'First name required' }, { status: 400 })
    if (!body.lastName || !body.lastName.trim()) return NextResponse.json({ error: 'Last name required' }, { status: 400 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const empCode = body.employeeId && body.employeeId.trim()
      ? body.employeeId.trim()
      : await nextEmployeeCode(session.organizationId)

    const result = await pool.query(
      `INSERT INTO "Employee"
        (id, "employeeId", "firstName", "lastName", email, phone, "dateOfBirth", gender, "maritalStatus",
         nationality, "idNumber", "taxPin", "nssfNumber", "nhifNumber", address, city, country,
         "emergencyContact", "emergencyPhone", department, position, "employmentType", status,
         "hireDate", "terminationDate", salary, currency, "bankName", "bankAccount", notes,
         "preferredName", "jobTitle", "jobFamily", grade, division, branch, "costCenter", "reportingManagerId", "photoUrl",
         "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,NOW(),NOW())
       RETURNING *`,
      [
        id, empCode,
        body.firstName.trim(), body.lastName.trim(),
        body.email || null, body.phone || null,
        body.dateOfBirth || null, body.gender || null, body.maritalStatus || null,
        body.nationality || null, body.idNumber || null, body.taxPin || null,
        body.nssfNumber || null, body.nhifNumber || null,
        body.address || null, body.city || null, body.country || 'Kenya',
        body.emergencyContact || null, body.emergencyPhone || null,
        body.department || null, body.position || null,
        body.employmentType || 'FULL_TIME', body.status || 'ACTIVE',
        body.hireDate || new Date().toISOString(),
        body.terminationDate || null,
        Number(body.salary || 0), body.currency || 'KES',
        body.bankName || null, body.bankAccount || null, body.notes || null,
        body.preferredName || null, body.jobTitle || null, body.jobFamily || null,
        body.grade || null, body.division || null, body.branch || null,
        body.costCenter || null, body.reportingManagerId || null, body.photoUrl || null,
        session.organizationId,
      ]
    )

    return NextResponse.json({ employee: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Employees POST error:', error)
    console.error('[HR-ERROR]', error); return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}