export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// ============================================================
// Idempotent schema fix - ensures PayrollItem has the statutory
// breakdown columns the calculator + PDF expect. ADD COLUMN IF NOT
// EXISTS is a no-op when the column already exists.
// ============================================================
let _payrollSchemaEnsured = false
async function ensurePayrollItemSchema() {
  if (_payrollSchemaEnsured) return
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "grossPay" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "netPay" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "paye" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "nssf" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "shif" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  await pool.query('ALTER TABLE "PayrollItem" ADD COLUMN IF NOT EXISTS "housingLevy" DOUBLE PRECISION DEFAULT 0').catch(() => {})
  _payrollSchemaEnsured = true
}


// ============================================================
// KENYAN STATUTORY PAYROLL CALCULATOR (configurable)
// ============================================================
// These values reflect 2024/2025 Kenya tax rules. Update here
// without touching schema when regulations change.
// ============================================================
// Fallback bands — identical to the Kenya 2026 defaults the statutory
// endpoint seeds. Used when an org has no custom bands configured.
const DEFAULT_BANDS: { code: string; bandMin: number; bandMax: number | null; rate: number; fixedAmount: number }[] = [
  { code: 'PAYE_BAND_1', bandMin: 0,      bandMax: 24000,  rate: 0.10,  fixedAmount: 0 },
  { code: 'PAYE_BAND_2', bandMin: 24000,  bandMax: 32333,  rate: 0.25,  fixedAmount: 0 },
  { code: 'PAYE_BAND_3', bandMin: 32333,  bandMax: 500000, rate: 0.30,  fixedAmount: 0 },
  { code: 'PAYE_BAND_4', bandMin: 500000, bandMax: 800000, rate: 0.325, fixedAmount: 0 },
  { code: 'PAYE_BAND_5', bandMin: 800000, bandMax: null,   rate: 0.35,  fixedAmount: 0 },
  { code: 'PERSONAL_RELIEF', bandMin: 0, bandMax: null, rate: 0, fixedAmount: 2400 },
  { code: 'NSSF_TIER_1', bandMin: 0,    bandMax: 7000,  rate: 0.06, fixedAmount: 0 },
  { code: 'NSSF_TIER_2', bandMin: 7000, bandMax: 36000, rate: 0.06, fixedAmount: 0 },
  { code: 'SHIF_RATE', bandMin: 0, bandMax: null, rate: 0.0275, fixedAmount: 0 },
  { code: 'HOUSING_LEVY_RATE', bandMin: 0, bandMax: null, rate: 0.015, fixedAmount: 0 },
]

type Band = { code: string; bandMin: number; bandMax: number | null; rate: number; fixedAmount: number }

function computeStatutory(grossMonthly: number, bands?: Band[]) {
  const gross = Math.max(0, Number(grossMonthly || 0))
  const b = bands && bands.length > 0 ? bands : DEFAULT_BANDS
  const byCode = new Map<string, Band>()
  for (const row of b) byCode.set(row.code, row)

  const rate = (code: string, fallback: number) => {
    const r = byCode.get(code)
    return r && r.rate != null ? Number(r.rate) : fallback
  }
  const fixed = (code: string, fallback: number) => {
    const r = byCode.get(code)
    return r && r.fixedAmount != null ? Number(r.fixedAmount) : fallback
  }
  const band = (code: string) => byCode.get(code)

  // NSSF tiers
  const t1 = band('NSSF_TIER_1') || { bandMin: 0, bandMax: 7000, rate: 0.06 } as any
  const t2 = band('NSSF_TIER_2') || { bandMin: 7000, bandMax: 36000, rate: 0.06 } as any
  const nssfTier1 = Math.min(gross, Number(t1.bandMax || 7000)) * Number(t1.rate || 0.06)
  const nssfTier2 = Math.max(0, Math.min(gross, Number(t2.bandMax || 36000)) - Number(t2.bandMin || 7000)) * Number(t2.rate || 0.06)
  const nssf = Math.round((nssfTier1 + nssfTier2) * 100) / 100

  // SHIF and Housing
  const shif = Math.round(gross * rate('SHIF_RATE', 0.0275) * 100) / 100
  const housingLevy = Math.round(gross * rate('HOUSING_LEVY_RATE', 0.015) * 100) / 100

  // Taxable = gross − NSSF
  const taxableIncome = gross - nssf

  // PAYE progressive
  let paye = 0
  let remaining = taxableIncome
  const payeBands = ['PAYE_BAND_1','PAYE_BAND_2','PAYE_BAND_3','PAYE_BAND_4','PAYE_BAND_5']
  for (let i = 0; i < payeBands.length; i++) {
    const bnd = band(payeBands[i])
    const lo = bnd ? Number(bnd.bandMin) : 0
    const hi = bnd && bnd.bandMax != null ? Number(bnd.bandMax) : Infinity
    const r = bnd ? Number(bnd.rate) : 0
    const width = hi === Infinity ? Infinity : hi - lo
    if (remaining <= 0) break
    if (width === Infinity) {
      paye += remaining * r
      remaining = 0
    } else {
      const take = Math.min(remaining, width)
      paye += take * r
      remaining -= take
    }
  }

  // Reliefs
  paye = Math.max(0, paye - fixed('PERSONAL_RELIEF', 2400) - fixed('INSURANCE_RELIEF', 0))
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

/**
 * Load this org's statutory bands. Seeds Kenya 2026 defaults on first
 * load via the same idempotent routine the /hr/statutory endpoint uses.
 */
async function loadBandsForOrg(orgId: string): Promise<Band[]> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "StatutoryRate" (
        "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "code" TEXT NOT NULL,
        "label" TEXT NOT NULL, "bandMin" DOUBLE PRECISION DEFAULT 0,
        "bandMax" DOUBLE PRECISION, rate DOUBLE PRECISION DEFAULT 0,
        "fixedAmount" DOUBLE PRECISION DEFAULT 0, "sortOrder" INTEGER DEFAULT 0,
        "notes" TEXT, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StatutoryRate_pkey" PRIMARY KEY ("id")
      )
    `)
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uniq_statutory_org_code" ON "StatutoryRate" ("organizationId", "code")`).catch(() => {})

    // Seed if empty
    const existing = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM "StatutoryRate" WHERE "organizationId" = $1`,
      [orgId]
    )
    if (Number(existing.rows[0]?.cnt || 0) === 0) {
      const crypto = require('crypto')
      for (const row of DEFAULT_BANDS) {
        await pool.query(
          `INSERT INTO "StatutoryRate"
             (id, "organizationId", code, label, "bandMin", "bandMax", rate, "fixedAmount", "sortOrder", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$3,$4,$5,$6,$7,0,NOW(),NOW())
           ON CONFLICT ("organizationId", "code") DO NOTHING`,
          [crypto.randomUUID(), orgId, row.code, row.bandMin, row.bandMax, row.rate, row.fixedAmount]
        ).catch(() => {})
      }
    }

    const r = await pool.query(
      `SELECT code, "bandMin", "bandMax", rate, "fixedAmount" FROM "StatutoryRate" WHERE "organizationId" = $1`,
      [orgId]
    )
    return r.rows as Band[]
  } catch (e) {
    console.error('[loadBandsForOrg]', e)
    return DEFAULT_BANDS
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PAYROLL')
    if (guard.deny) return guard.response!
    // ==================
    await ensurePayrollItemSchema()
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
         WHERE pi."organizationId" = $1 AND pi."payrollPeriodId" = $2
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
         AND id NOT IN (SELECT "employeeId" FROM "PayrollItem" WHERE "organizationId" = $1 AND "payrollPeriodId" = $2)`,
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
    return NextResponse.json({ periods: [], items: [], payroll: [], summary: {}, error: 'Something went wrong. Please try again.' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PAYROLL')
    if (guard.deny) return guard.response!
    // ==================
    await ensurePayrollItemSchema()
    const orgId = session.organizationId
    const body = await request.json()
    const action = body.action || 'run'

    const crypto = require('crypto')

    // ACTION 1: Create a new payroll period
    if (action === 'create-period') {
      if (!body.name) return NextResponse.json({ error: 'Period name required' }, { status: 400 })
      if (!body.startDate) return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
      if (!body.endDate) return NextResponse.json({ error: 'End date is required' }, { status: 400 })

      const id = crypto.randomUUID()

      // Best-effort: ensure runtime columns exist.
      await pool.query('ALTER TABLE "PayrollPeriod" ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP(3)').catch(() => {})
      // Some installs have paymentDate as NOT NULL from the original schema.
      // Relax it so the INSERT below (which may not include it) still works.
      await pool.query('ALTER TABLE "PayrollPeriod" ALTER COLUMN "paymentDate" DROP NOT NULL').catch(() => {})

      // Normalise status to the allowed enum values
      const ALLOWED = ['DRAFT','PROCESSED','APPROVED','PAID']
      const safeStatus = ALLOWED.includes(body.status) ? body.status : 'DRAFT'

      // Compute a sensible default paymentDate = the period end date
      const defaultPaymentDate = body.paymentDate || body.endDate

      const res = await pool.query(
        `INSERT INTO "PayrollPeriod"
           (id, name, status, "startDate", "endDate", "paymentDate", "organizationId", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
         RETURNING *`,
        [id, body.name, safeStatus, body.startDate, body.endDate, defaultPaymentDate, orgId]
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

      // Load this org's statutory bands once; reused for every employee
      const bands = await loadBandsForOrg(orgId)

      let created = 0
      let skipped = 0
      for (const emp of empRes.rows) {
        const existing = await pool.query(
          `SELECT id FROM "PayrollItem" WHERE "organizationId" = $1 AND "payrollPeriodId" = $2 AND "employeeId" = $3`,
          [orgId, body.periodId, emp.id]
        )
        if (existing.rows.length > 0) { skipped++; continue }

        const calc = computeStatutory(Number(emp.salary || 0), bands)
        const itemId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO "PayrollItem"
            (id, "payrollPeriodId", "employeeId", "grossPay", "netPay", deductions, paye, nssf, shif, "housingLevy", "organizationId", "createdAt", "updatedAt")
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
    const e: any = error
    console.error('[HR-PAYROLL-DETAIL]', e?.message, e?.detail, e?.code, e?.column, e?.constraint)
    return NextResponse.json({
      error: 'Something went wrong. Please try again.',
      detail: e?.message,
      column: e?.column,
      constraint: e?.constraint,
      code: e?.code,
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_PAYROLL')
    if (guard.deny) return guard.response!
    // ==================
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')
    if (!periodId) return NextResponse.json({ error: 'periodId required' }, { status: 400 })

    await pool.query(
      `DELETE FROM "PayrollItem" WHERE "payrollPeriodId" = $1 AND "organizationId" = $2`,
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