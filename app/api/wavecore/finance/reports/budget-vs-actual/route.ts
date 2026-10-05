export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

/**
 * GET /api/wavecore/finance/reports/budget-vs-actual?fiscalYear=YYYY
 *
 * For each Budget row with an accountCode, computes the actual from
 * POSTED journal entries on that account during the fiscal year.
 * Budgets without an accountCode are returned separately as
 * "unallocated" (still visible, no variance).
 *
 * Read-only. Tenant-scoped. Never writes.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const fiscalYearParam = searchParams.get('fiscalYear')
    const fiscalYear = fiscalYearParam ? parseInt(fiscalYearParam) : new Date().getFullYear()

    // Best-effort: ensure the accountCode column exists (idempotent)
    await pool.query('ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "accountCode" TEXT').catch(() => {})

    const start = new Date(Date.UTC(fiscalYear, 0, 1))
    const end = new Date(Date.UTC(fiscalYear + 1, 0, 1))

    const budgetsRes = await pool.query(
      `SELECT id, name, "fiscalYear", period, amount, "accountCode" AS "accountCode"
       FROM "Budget"
       WHERE "organizationId" = $1 AND "fiscalYear" = $2
       ORDER BY "accountCode" NULLS LAST, name ASC`,
      [orgId, fiscalYear]
    )

    // Aggregate actual per account code across journals in this fiscal year
    const actualsRes = await pool.query(
      `SELECT coa.code,
              COALESCE(SUM(ji.debit), 0)  AS debit,
              COALESCE(SUM(ji.credit), 0) AS credit
       FROM "JournalItem" ji
       JOIN "JournalEntry" je ON je.id = ji."journalEntryId"
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       WHERE je."organizationId" = $1
         AND je.status = 'POSTED'
         AND je.date >= $2
         AND je.date < $3
       GROUP BY coa.code`,
      [orgId, start, end]
    )
    const actualByCode = new Map<string, number>()
    for (const r of actualsRes.rows) {
      actualByCode.set(r.code, round2(Number(r.debit || 0) - Number(r.credit || 0)))
    }

    const allocated: any[] = []
    const unallocated: any[] = []

    for (const b of budgetsRes.rows) {
      const budgetAmount = round2(Number(b.amount || 0))
      const code = b.accountCode ? String(b.accountCode).trim() : null

      if (!code) {
        unallocated.push({
          id: b.id, name: b.name, period: b.period, budgetAmount,
        })
        continue
      }

      const raw = actualByCode.get(code) ?? 0
      // For income accounts, natural balance = credit - debit; for
      // others = debit - credit. We don't know the type here, so we
      // take absolute value of the signed balance as the "actual" and
      // leave the interpretation to the user.
      const actual = round2(Math.abs(raw))
      const variance = round2(budgetAmount - actual)
      const variancePct = budgetAmount !== 0 ? round2((variance / budgetAmount) * 100) : null
      const over = actual > budgetAmount && budgetAmount !== 0

      allocated.push({
        id: b.id,
        name: b.name,
        accountCode: code,
        period: b.period,
        budgetAmount,
        actual,
        variance,
        variancePct,
        overBudget: over,
      })
    }

    const totalBudget = round2(allocated.reduce((s, r) => s + r.budgetAmount, 0))
    const totalActual = round2(allocated.reduce((s, r) => s + r.actual, 0))
    const totalVariance = round2(totalBudget - totalActual)

    return NextResponse.json({
      fiscalYear,
      rows: allocated,
      unallocated,
      totals: {
        budget: totalBudget,
        actual: totalActual,
        variance: totalVariance,
        variancePct: totalBudget !== 0 ? round2((totalVariance / totalBudget) * 100) : null,
        overCount: allocated.filter(r => r.overBudget).length,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[budget-vs-actual]', error)
    return NextResponse.json({ rows: [], unallocated: [], totals: {}, error: 'Failed to load' }, { status: 500 })
  }
}