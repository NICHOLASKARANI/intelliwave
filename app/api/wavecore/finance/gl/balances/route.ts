export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { computeBalances } from '@/lib/wavecore/finance-gl'

/**
 * GET /api/wavecore/finance/gl/balances?from=&to=&asOf=
 *
 * Returns every account with its debit, credit, and derived balance
 * (computed from JournalItem rows — the ChartOfAccount never stores
 * a running balance).
 *
 * Query params:
 *   asOf  — include only journal entries on or before this date
 *   from  — include only journal entries on or after this date
 *   to    — include only journal entries on or before this date (alias of asOf)
 *
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const asOf = searchParams.get('asOf') || searchParams.get('to')
    const from = searchParams.get('from')

    const accountsRes = await pool.query(
      `SELECT id, code, name, type, "parentId", "isActive"
       FROM "ChartOfAccount"
       WHERE "organizationId" = $1 AND "isActive" = TRUE
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
    if (from) { sql += ` AND je.date >= $${idx++}`; params.push(from) }
    sql += ` GROUP BY ji."accountId"`

    const itemsRes = await pool.query(sql, params)

    const items = itemsRes.rows.map((r: any) => ({
      accountId: r.accountId,
      debit: Number(r.debit || 0),
      credit: Number(r.credit || 0),
    }))

    const balances = computeBalances(accountsRes.rows, items)

    return NextResponse.json({
      asOf: asOf || null,
      from: from || null,
      count: balances.length,
      balances,
    })
  } catch (error) {
    console.error('[gl/balances]', error)
    return NextResponse.json({ balances: [], error: 'Failed to load balances' }, { status: 500 })
  }
}