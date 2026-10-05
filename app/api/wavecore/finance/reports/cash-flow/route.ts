export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/finance/reports/cash-flow?from=&to=
 *
 * Simplified cash flow statement. Groups POSTED journal movements on
 * cash/bank accounts by account code prefix:
 *   1000-1099  Operating
 *   1100-1199  Investing
 *   1200-1299  Financing
 * Any other cash-labelled account falls into Operating by default.
 *
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Identify cash accounts: type ASSET with a code in 1000-1299 or a name
    // matching Cash / Bank / M-Pesa / Petty.
    const cashAccounts = await pool.query(
      `SELECT id, code, name FROM "ChartOfAccount"
       WHERE "organizationId" = $1
         AND type = 'ASSET'
         AND (
           (code >= '1000' AND code <= '1299')
           OR name ILIKE '%cash%'
           OR name ILIKE '%bank%'
           OR name ILIKE '%mpesa%'
           OR name ILIKE '%m-pesa%'
           OR name ILIKE '%petty%'
         )`,
      [orgId]
    )

    if (cashAccounts.rowCount === 0) {
      return NextResponse.json({
        from: from || null, to: to || null,
        operating: { inflows: 0, outflows: 0, net: 0, accounts: [] },
        investing: { inflows: 0, outflows: 0, net: 0, accounts: [] },
        financing: { inflows: 0, outflows: 0, net: 0, accounts: [] },
        netChange: 0,
        message: 'No cash accounts found.',
      })
    }

    const ids = cashAccounts.rows.map((a: any) => a.id)

    let sql = `
      SELECT ji."accountId", COALESCE(SUM(ji.debit),0) AS debit, COALESCE(SUM(ji.credit),0) AS credit
      FROM "JournalItem" ji
      JOIN "JournalEntry" je ON je.id = ji."journalEntryId"
      WHERE je."organizationId" = $1 AND je.status = 'POSTED'
        AND ji."accountId" = ANY($2::text[])
    `
    const params: any[] = [orgId, ids]
    let idx = 3
    if (from) { sql += ` AND je.date >= $${idx++}`; params.push(from) }
    if (to)   { sql += ` AND je.date <= $${idx++}`; params.push(to) }
    sql += ` GROUP BY ji."accountId"`

    const items = await pool.query(sql, params)

    const codeFor = new Map<string, string>()
    const nameFor = new Map<string, string>()
    for (const a of cashAccounts.rows) { codeFor.set(a.id, a.code); nameFor.set(a.id, a.name) }

    const buckets: Record<string, { inflows: number; outflows: number; net: number; accounts: any[] }> = {
      operating: { inflows: 0, outflows: 0, net: 0, accounts: [] },
      investing: { inflows: 0, outflows: 0, net: 0, accounts: [] },
      financing: { inflows: 0, outflows: 0, net: 0, accounts: [] },
    }

    for (const row of items.rows) {
      const code = codeFor.get(row.accountId) || ''
      const name = nameFor.get(row.accountId) || ''
      const debit = Number(row.debit || 0)
      const credit = Number(row.credit || 0)
      const net = debit - credit // positive = cash increase

      let group: 'operating' | 'investing' | 'financing' = 'operating'
      if (code >= '1100' && code <= '1199') group = 'investing'
      else if (code >= '1200' && code <= '1299') group = 'financing'

      buckets[group].inflows += Math.max(0, net)
      buckets[group].outflows += Math.max(0, -net)
      buckets[group].net += net
      buckets[group].accounts.push({ code, name, debit, credit, net })
    }

    const netChange = buckets.operating.net + buckets.investing.net + buckets.financing.net

    return NextResponse.json({
      from: from || null,
      to: to || null,
      operating: buckets.operating,
      investing: buckets.investing,
      financing: buckets.financing,
      netChange,
    })
  } catch (error) {
    console.error('[cash-flow]', error)
    return NextResponse.json({
      operating: { inflows: 0, outflows: 0, net: 0, accounts: [] },
      investing: { inflows: 0, outflows: 0, net: 0, accounts: [] },
      financing: { inflows: 0, outflows: 0, net: 0, accounts: [] },
      netChange: 0,
      error: 'Failed to load',
    }, { status: 500 })
  }
}