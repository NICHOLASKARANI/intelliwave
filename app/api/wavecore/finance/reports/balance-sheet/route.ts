export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const assets = await pool.query(
      `SELECT COALESCE(SUM(ji.debit - ji.credit), 0) as total
       FROM "JournalItem" ji
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       JOIN "JournalEntry" je ON je.id = ji."journalEntryId" AND je.status = 'POSTED'
       WHERE coa."organizationId" = $1 AND coa.type = 'ASSET'`,
      [orgId]
    )

    const liabilities = await pool.query(
      `SELECT COALESCE(SUM(ji.credit - ji.debit), 0) as total
       FROM "JournalItem" ji
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       JOIN "JournalEntry" je ON je.id = ji."journalEntryId" AND je.status = 'POSTED'
       WHERE coa."organizationId" = $1 AND coa.type = 'LIABILITY'`,
      [orgId]
    )

    const equity = await pool.query(
      `SELECT COALESCE(SUM(ji.credit - ji.debit), 0) as total
       FROM "JournalItem" ji
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       JOIN "JournalEntry" je ON je.id = ji."journalEntryId" AND je.status = 'POSTED'
       WHERE coa."organizationId" = $1 AND coa.type = 'EQUITY'`,
      [orgId]
    )

    const totalAssets = assets.rows[0].total || 0
    const totalLiabilities = liabilities.rows[0].total || 0
    const totalEquity = equity.rows[0].total || 0

    return NextResponse.json({
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    })
  } catch (error) {
    console.error('Balance Sheet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}