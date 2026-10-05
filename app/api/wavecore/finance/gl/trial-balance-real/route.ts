export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { trialBalance } from '@/lib/wavecore/finance-gl'

/**
 * GET /api/wavecore/finance/gl/trial-balance-real?asOf=
 *
 * Real trial balance computed from POSTED journal items. Debit column
 * contains net debit balances; credit column net credit balances.
 * Sum of debit must equal sum of credit — the response includes a
 * `balanced` boolean and the difference.
 *
 * Read-only. Tenant-scoped. Does not replace the existing
 * /api/wavecore/finance/reports/trial-balance endpoint.
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

    const tb = trialBalance(accountsRes.rows, items)

    return NextResponse.json({
      asOf: asOf || null,
      rows: tb.rows,
      totalDebit: tb.totalDebit,
      totalCredit: tb.totalCredit,
      balanced: tb.balanced,
      difference: tb.difference,
    })
  } catch (error) {
    console.error('[gl/trial-balance-real]', error)
    return NextResponse.json({ rows: [], totalDebit: 0, totalCredit: 0, balanced: false, error: 'Failed' }, { status: 500 })
  }
}