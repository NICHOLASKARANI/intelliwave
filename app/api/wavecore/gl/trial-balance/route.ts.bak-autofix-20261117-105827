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
              COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) as balance
       FROM "ChartOfAccount" coa
       LEFT JOIN "JournalItem" ji ON ji."accountId" = coa.id
       LEFT JOIN "JournalEntry" je ON je.id = ji."journalEntryId" AND je.status = 'POSTED'
       WHERE coa."organizationId" = $1
       GROUP BY coa.id, coa.code, coa.name, coa.type
       ORDER BY coa.code ASC`,
      [orgId]
    )

    return NextResponse.json({ accounts: result.rows })
  } catch (error) {
    console.error('TrialBalance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}