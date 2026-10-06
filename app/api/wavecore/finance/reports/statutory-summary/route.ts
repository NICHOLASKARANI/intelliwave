export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// Idempotent: these columns were added by HR payroll at runtime. If
// finance loads this endpoint before HR has ever run, they won't exist
// yet — ADD COLUMN IF NOT EXISTS makes this endpoint safe to hit first.
let _ensured = false
async function ensurePayrollColumns() {
  if (_ensured) return
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "grossPay" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "netPay" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "paye" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "nssf" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "shif" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "housingLevy" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  _ensured = true
}

/**
 * GET /api/wavecore/finance/reports/statutory-summary
 *
 * Query params (one of):
 *   ?periodId=<id>                    — single HR payroll period
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD    — all periods whose paymentDate
 *                                        (or startDate) falls in range
 *   (neither)                          — the latest period only
 *
 * Returns a KRA-facing statutory summary:
 *   - period metadata (name, dates, status)
 *   - per-employee rows (name, PIN, gross, PAYE, NSSF, SHIF, Housing, net)
 *   - totals (employee-side and employer-side)
 *   - counts (payslips, employees with PAYE=0, employees with NSSF cap
 *     reached)
 *
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensurePayrollColumns()
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // 1. Resolve which periods we're summarising
    let periodSql = `SELECT id, name, "startDate", "endDate", "paymentDate", status
                     FROM "PayrollPeriod"
                     WHERE "organizationId" = $1`
    const periodParams: any[] = [orgId]

    if (periodId) {
      periodParams.push(periodId)
      periodSql += ` AND id = $${periodParams.length}`
    } else if (from || to) {
      if (from) { periodParams.push(from); periodSql += ` AND COALESCE("paymentDate", "startDate") >= $${periodParams.length}` }
      if (to)   { periodParams.push(to);   periodSql += ` AND COALESCE("paymentDate", "startDate") <= $${periodParams.length}` }
    }
    periodSql += ` ORDER BY COALESCE("paymentDate", "startDate") DESC LIMIT 50`

    const periodRes = await pool.query(periodSql, periodParams)
    const periods = periodRes.rows

    // If no period filter was supplied, restrict to the latest only.
    const scopedPeriods = (periodId || from || to)
      ? periods
      : (periods.length > 0 ? [periods[0]] : [])
    const periodIds = scopedPeriods.map((p: any) => p.id)

    if (periodIds.length === 0) {
      return NextResponse.json({
        periods: [], items: [],
        totals: emptyTotals(),
        counts: { periods: 0, payslips: 0, zeroPaye: 0, nssfCapped: 0, employees: 0 },
        message: 'No payroll periods in range.',
      })
    }

    // 2. Load all items in those periods + join Employee for name + PIN
    const itemsRes = await pool.query(
      `SELECT pi.id,
              pi."employeeId",
              pi."payrollPeriodId",
              COALESCE(pi."grossPay", 0)   AS "grossPay",
              COALESCE(pi."netPay", 0)     AS "netPay",
              COALESCE(pi.paye, 0)         AS paye,
              COALESCE(pi.nssf, 0)         AS nssf,
              COALESCE(pi.shif, 0)         AS shif,
              COALESCE(pi."housingLevy",0) AS "housingLevy",
              COALESCE(pi.deductions, 0)   AS deductions,
              e."firstName", e."lastName", e."employeeId" AS "empCode",
              e."taxPin", e."nssfNumber", e."nhifNumber",
              e.department, e.position
       FROM "PayrollItem" pi
       LEFT JOIN "Employee" e
         ON e.id = pi."employeeId" AND e."organizationId" = pi."organizationId"
       WHERE pi."organizationId" = $1
         AND pi."payrollPeriodId" = ANY($2::text[])
       ORDER BY e."firstName" ASC, e."lastName" ASC`,
      [orgId, periodIds]
    )

    const periodById = new Map<string, any>()
    for (const p of scopedPeriods) periodById.set(p.id, p)

    const items = itemsRes.rows.map((r: any) => {
      const gross = round2(Number(r.grossPay || 0))
      const nssf  = round2(Number(r.nssf || 0))
      const paye  = round2(Number(r.paye || 0))
      const shif  = round2(Number(r.shif || 0))
      const housingLevy = round2(Number(r.housingLevy || 0))
      const net   = round2(Number(r.netPay || 0))
      const ded   = round2(Number(r.deductions || 0))
      const p     = periodById.get(r.payrollPeriodId)
      return {
        id: r.id,
        payrollPeriodId: r.payrollPeriodId,
        periodName: p?.name || '—',
        employeeId: r.employeeId,
        employeeCode: r.empCode || '—',
        employeeName: r.firstName ? (r.firstName + ' ' + (r.lastName || '')).trim() : 'Unknown',
        taxPin: r.taxPin || '',
        nssfNumber: r.nssfNumber || '',
        nhifNumber: r.nhifNumber || '',
        department: r.department || '—',
        position: r.position || '—',
        grossPay: gross,
        paye,
        nssf,
        shif,
        housingLevy,
        deductions: ded,
        netPay: net,
      }
    })

    // 3. Totals — employee side + employer side
    const sum = (k: keyof typeof items[0]) => round2(items.reduce((s: number, x: any) => s + Number(x[k] || 0), 0))
    const grossTotal = sum('grossPay')
    const payeTotal  = sum('paye')
    const nssfTotal  = sum('nssf')
    const shifTotal  = sum('shif')
    const housingEmployee = sum('housingLevy')
    const netTotal   = sum('netPay')

    // Employer matching: NSSF and Housing Levy are matched 1:1 by the employer
    const nssfEmployer    = nssfTotal
    const housingEmployer = housingEmployee

    const totals = {
      gross: grossTotal,
      paye: payeTotal,
      nssfEmployee: nssfTotal,
      nssfEmployer,
      nssfTotal: round2(nssfTotal + nssfEmployer),
      shif: shifTotal,
      housingEmployee,
      housingEmployer,
      housingTotal: round2(housingEmployee + housingEmployer),
      net: netTotal,
      /** What the employer remits to KRA on behalf of everyone. */
      payable: {
        paye: payeTotal,
        shif: shifTotal,
        housing: round2(housingEmployee + housingEmployer),
        nssf: round2(nssfTotal + nssfEmployer),
        total: round2(payeTotal + shifTotal + housingEmployee + housingEmployer + nssfTotal + nssfEmployer),
      },
    }

    const counts = {
      periods: scopedPeriods.length,
      payslips: items.length,
      zeroPaye: items.filter(x => x.paye === 0).length,
      nssfCapped: items.filter(x => x.nssf >= 2160 - 0.01).length,
      employees: new Set(items.map(x => x.employeeId)).size,
    }

    return NextResponse.json({
      periods: scopedPeriods,
      items,
      totals,
      counts,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[statutory-summary]', error)
    return NextResponse.json({
      periods: [], items: [], totals: emptyTotals(),
      counts: { periods: 0, payslips: 0, zeroPaye: 0, nssfCapped: 0, employees: 0 },
      error: 'Failed to load',
    }, { status: 500 })
  }
}

function emptyTotals() {
  return {
    gross: 0, paye: 0,
    nssfEmployee: 0, nssfEmployer: 0, nssfTotal: 0,
    shif: 0,
    housingEmployee: 0, housingEmployer: 0, housingTotal: 0,
    net: 0,
    payable: { paye: 0, shif: 0, housing: 0, nssf: 0, total: 0 },
  }
}