export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    // Revenue (INCOME accounts)
    const revenue = await pool.query(
      `SELECT COALESCE(SUM(ji.credit - ji.debit), 0) as total
       FROM "JournalItem" ji
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       JOIN "JournalEntry" je ON je.id = ji."journalEntryId" AND je.status = 'POSTED'
       WHERE coa."organizationId" = $1 AND coa.type = 'INCOME'`,
      [orgId]
    )

    // Expenses (EXPENSE accounts)
    const expenses = await pool.query(
      `SELECT COALESCE(SUM(ji.debit - ji.credit), 0) as total
       FROM "JournalItem" ji
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       JOIN "JournalEntry" je ON je.id = ji."journalEntryId" AND je.status = 'POSTED'
       WHERE coa."organizationId" = $1 AND coa.type = 'EXPENSE'`,
      [orgId]
    )

    const totalRevenue = revenue.rows[0].total || 0
    const totalExpenses = expenses.rows[0].total || 0
    const netProfit = totalRevenue - totalExpenses

    return NextResponse.json({
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      grossMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
    })
  } catch (error) {
    console.error('Income Statement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}