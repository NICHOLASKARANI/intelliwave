export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// ============================================================
// KENYAN STATUTORY PAYROLL CALCULATOR (configurable)
// ============================================================
// These values reflect 2024/2025 Kenya tax rules. Update here
// without touching schema when regulations change.
// ============================================================
function computeStatutory(grossMonthly: number) {
  const gross = Math.max(0, Number(grossMonthly || 0))

  // NSSF — Tier I (6% up to 7,000) + Tier II (6% from 7,001 to 36,000) = max 2,160
  const nssfTier1 = Math.min(gross, 7000) * 0.06
  const nssfTier2 = Math.max(0, Math.min(gross, 36000) - 7000) * 0.06
  const nssf = Math.round((nssfTier1 + nssfTier2) * 100) / 100

  // SHIF (Social Health Insurance Fund) — 2.75% of gross
  const shif = Math.round(gross * 0.0275 * 100) / 100

  // Housing Levy — 1.5% of gross (employee) + 1.5% (employer)
  const housingLevy = Math.round(gross * 0.015 * 100) / 100

  // Taxable income = gross - NSSF (SHIF and Housing Levy are not deductible pre-tax in Kenya)
  const taxableIncome = gross - nssf

  // PAYE (Progressive bands, monthly)
  let paye = 0
  let remaining = taxableIncome
  if (remaining > 24000) { paye += 24000 * 0.10; remaining -= 24000 } else { paye += remaining * 0.10; remaining = 0 }
  if (remaining > 8333)  { paye += 8333  * 0.25; remaining -= 8333  } else { paye += remaining * 0.25; remaining = 0 }
  if (remaining > 467667) { paye += 467667 * 0.30; remaining -= 467667 } else { paye += remaining * 0.30; remaining = 0 }
  if (remaining > 300000) { paye += 300000 * 0.325; remaining -= 300000 } else { paye += remaining * 0.325; remaining = 0 }
  if (remaining > 0) { paye += remaining * 0.35 }

  // Personal relief
  paye = Math.max(0, paye - 2400)
  paye = Math.round(paye * 100) / 100

  const totalDeductions = Math.round((nssf + shif + housingLevy + paye) * 100) / 100
  const net = Math.round((gross - totalDeductions) * 100) / 100

  return {
    gross: Math.round(gross * 100) / 100,
    paye,
    nssf,
    shif,
    housingLevy,
    totalDeductions,
    net,
    employerNssf: nssf,
    employerHousing: housingLevy,
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')

    const periodRes = await pool.query(
      `SELECT * FROM "PayrollPeriod" WHERE "organizationId" = $1 ORDER BY "startDate" DESC LIMIT 50`,
      [orgId]
    )
    const periods = periodRes.rows

    const activePeriod = periodId
      ? periods.find(p => p.id === periodId)
      : periods.find(p => p.status === 'OPEN' || p.status === 'DRAFT') || periods[0]

    let items: any[] = []
    if (activePeriod) {
      const itemRes = await pool.query(
        `SELECT pi.*, e."firstName", e."lastName", e."employeeId" AS "empCode", e.department, e."jobTitle", e.salary
         FROM "PayrollItem" pi
         LEFT JOIN "Employee" e ON e.id = pi."employeeId" AND e."organizationId" = pi."organizationId"
         WHERE pi."organizationId" = $1 AND pi."periodId" = $2
         ORDER BY e."firstName" ASC LIMIT 2000`,
        [orgId, activePeriod.id]
      )
      items = itemRes.rows.map(r => ({
        ...r,
        employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown',
        gross: Number(r.grossPay || 0),
        net: Number(r.netPay || 0),
        deductions: Number(r.deductions || 0),
        paye: Number(r.paye || 0),
        nssf: Number(r.nssf || 0),
        shif: Number(r.shif || 0),
        housingLevy: Number(r.housingLevy || 0),
      }))
    }

    const totalGross = items.reduce((s, r) => s + r.gross, 0)
    const totalNet = items.reduce((s, r) => s + r.net, 0)
    const totalDeductions = items.reduce((s, r) => s + r.deductions, 0)
    const totalPaye = items.reduce((s, r) => s + r.paye, 0)
    const totalNssf = items.reduce((s, r) => s + r.nssf, 0)
    const totalShif = items.reduce((s, r) => s + r.shif, 0)

    // Active employees without a payslip for this period
    const missingRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM "Employee"
       WHERE "organizationId" = $1 AND status = 'ACTIVE'
         AND id NOT IN (SELECT "employeeId" FROM "PayrollItem" WHERE "organizationId" = $1 AND "periodId" = $2)`,
      [orgId, activePeriod?.id || '']
    )
    const unpaidCount = Number(missingRes.rows[0]?.cnt || 0)

    const summary = {
      totalPeriods: periods.length,
      activePeriodName: activePeriod?.name || '—',
      activePeriodStatus: activePeriod?.status || '—',
      totalPayslips: items.length,
      totalGross: Math.round(totalGross),
      totalNet: Math.round(totalNet),
      totalDeductions: Math.round(totalDeductions),
      totalPaye: Math.round(totalPaye),
      totalNssf: Math.round(totalNssf),
      totalShif: Math.round(totalShif),
      unpaidEmployees: unpaidCount,
      avgNet: items.length > 0 ? Math.round(totalNet / items.length) : 0,
    }

    return NextResponse.json({ periods, activePeriod, items, payroll: items, summary })
  } catch (error) {
    console.error('Payroll GET error:', error)
    return NextResponse.json({ periods: [], items: [], payroll: [], summary: {}, error: (error as Error).message })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId
    const body = await request.json()
    const action = body.action || 'run'

    const crypto = require('crypto')

    // ACTION 1: Create a new payroll period
    if (action === 'create-period') {
      if (!body.name) return NextResponse.json({ error: 'Period name required' }, { status: 400 })
      const id = crypto.randomUUID()
      const res = await pool.query(
        `INSERT INTO "PayrollPeriod" (id, name, status, "startDate", "endDate", "organizationId", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
         RETURNING *`,
        [id, body.name, body.status || 'DRAFT', body.startDate || null, body.endDate || null, orgId]
      )
      return NextResponse.json({ period: res.rows[0] }, { status: 201 })
    }

    // ACTION 2: Run payroll — generate payslips for all active employees in this period
    if (action === 'run' || action === 'generate') {
      if (!body.periodId) return NextResponse.json({ error: 'periodId required' }, { status: 400 })

      // Confirm period belongs to this org
      const pRes = await pool.query(
        `SELECT id FROM "PayrollPeriod" WHERE id = $1 AND "organizationId" = $2`,
        [body.periodId, orgId]
      )
      if (pRes.rows.length === 0) return NextResponse.json({ error: 'Period not found' }, { status: 404 })

      const empRes = await pool.query(
        `SELECT id, salary FROM "Employee" WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
        [orgId]
      )

      let created = 0
      let skipped = 0
      for (const emp of empRes.rows) {
        const existing = await pool.query(
          `SELECT id FROM "PayrollItem" WHERE "organizationId" = $1 AND "periodId" = $2 AND "employeeId" = $3`,
          [orgId, body.periodId, emp.id]
        )
        if (existing.rows.length > 0) { skipped++; continue }

        const calc = computeStatutory(Number(emp.salary || 0))
        const itemId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO "PayrollItem"
            (id, "periodId", "employeeId", "grossPay", "netPay", deductions, paye, nssf, shif, "housingLevy", "organizationId", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())`,
          [itemId, body.periodId, emp.id, calc.gross, calc.net, calc.totalDeductions, calc.paye, calc.nssf, calc.shif, calc.housingLevy, orgId]
        )
        created++
      }

      // Mark period as PROCESSED
      await pool.query(
        `UPDATE "PayrollPeriod" SET status = 'PROCESSED', "updatedAt" = NOW() WHERE id = $1 AND "organizationId" = $2`,
        [body.periodId, orgId]
      )

      return NextResponse.json({ success: true, created, skipped })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Payroll POST error:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')
    if (!periodId) return NextResponse.json({ error: 'periodId required' }, { status: 400 })

    await pool.query(
      `DELETE FROM "PayrollItem" WHERE "periodId" = $1 AND "organizationId" = $2`,
      [periodId, session.organizationId]
    )
    await pool.query(
      `DELETE FROM "PayrollPeriod" WHERE id = $1 AND "organizationId" = $2`,
      [periodId, session.organizationId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}