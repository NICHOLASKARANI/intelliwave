export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { balanceSheet } from '@/lib/wavecore/finance-gl'

/**
 * GET /api/wavecore/finance/gl/balance-sheet-real?asOf=
 * Real Balance Sheet from POSTED journal items. Includes current-period
 * net profit as a component of equity. Returns `balanced` flag and the
 * Assets − (Liabilities + Equity) difference.
 *
 * Read-only. Tenant-scoped. Does not replace /reports/balance-sheet.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const asOf = searchParams.get('asOf') || searchParams.get('to')

    const accountsRes = await pool.query(
      `SELECT id, code, name, type, "parentId", "isActive"
       FROM "ChartOfAccount"
       WHERE "organizationId" = $1
       ORDER BY code ASC`,
      [orgId]
    )

    let sql = `
      SELECT ji."accountId", COALESCE(SUM(ji.debit),0) AS debit, COALESCE(SUM(ji.credit),0) AS credit
      FROM "JournalItem" ji
      JOIN "JournalEntry" je ON je.id = ji."journalEntryId"
      WHERE je."organizationId" = $1 AND je.status = 'POSTED'
    `
    const params: any[] = [orgId]
    let idx = 2
    if (asOf) { sql += ` AND je.date <= $${idx++}`; params.push(asOf) }
    sql += ` GROUP BY ji."accountId"`

    const itemsRes = await pool.query(sql, params)
    const items = itemsRes.rows.map((r: any) => ({
      accountId: r.accountId,
      debit: Number(r.debit || 0),
      credit: Number(r.credit || 0),
    }))

    const bs = balanceSheet(accountsRes.rows, items)

    return NextResponse.json({
      asOf: asOf || null,
      assets: bs.assets,
      liabilities: bs.liabilities,
      equity: bs.equity,
      netProfit: bs.netProfit,
      totalAssets: bs.totalAssets,
      totalLiabilities: bs.totalLiabilities,
      totalEquity: bs.totalEquity,
      totalLiabilitiesAndEquity: bs.totalLiabilitiesAndEquity,
      balanced: bs.balanced,
      difference: bs.difference,
    })
  } catch (error) {
    console.error('[gl/balance-sheet-real]', error)
    return NextResponse.json({ assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, balanced: false, error: 'Failed' }, { status: 500 })
  }
}