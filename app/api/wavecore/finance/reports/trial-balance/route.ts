export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const result = await pool.query(
      `SELECT coa.id, coa.code, coa.name, coa.type,
              COALESCE(SUM(ji.debit), 0) as total_debit,
              COALESCE(SUM(ji.credit), 0) as total_credit,
              COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as net_balance
       FROM "ChartOfAccount" coa
       LEFT JOIN "JournalItem" ji ON ji."accountId" = coa.id
       LEFT JOIN "JournalEntry" je ON je.id = ji."journalEntryId" AND je.status = 'POSTED'
       WHERE coa."organizationId" = $1
       GROUP BY coa.id, coa.code, coa.name, coa.type
       ORDER BY coa.code ASC`,
      [orgId]
    )

    const totalDebit = result.rows.reduce((sum, row) => sum + parseFloat(row.total_debit), 0)
    const totalCredit = result.rows.reduce((sum, row) => sum + parseFloat(row.total_credit), 0)

    return NextResponse.json({
      accounts: result.rows,
      totals: { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 },
    })
  } catch (error) {
    console.error('Trial Balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}