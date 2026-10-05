export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { incomeStatement } from '@/lib/wavecore/finance-gl'

/**
 * GET /api/wavecore/finance/gl/income-statement-real?from=&to=
 * Real P&L from POSTED journal items. Read-only. Tenant-scoped.
 * Does not replace the existing /reports/income-statement endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

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
    if (from) { sql += ` AND je.date >= $${idx++}`; params.push(from) }
    if (to)   { sql += ` AND je.date <= $${idx++}`; params.push(to) }
    sql += ` GROUP BY ji."accountId"`

    const itemsRes = await pool.query(sql, params)
    const items = itemsRes.rows.map((r: any) => ({
      accountId: r.accountId,
      debit: Number(r.debit || 0),
      credit: Number(r.credit || 0),
    }))

    const pl = incomeStatement(accountsRes.rows, items)

    return NextResponse.json({
      from: from || null,
      to: to || null,
      income: pl.income,
      expense: pl.expense,
      totalIncome: pl.totalIncome,
      totalExpense: pl.totalExpense,
      netProfit: pl.netProfit,
      isProfit: pl.isProfit,
    })
  } catch (error) {
    console.error('[gl/income-statement-real]', error)
    return NextResponse.json({ income: [], expense: [], totalIncome: 0, totalExpense: 0, netProfit: 0, error: 'Failed' }, { status: 500 })
  }
}