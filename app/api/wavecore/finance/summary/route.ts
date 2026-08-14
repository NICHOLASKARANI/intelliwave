export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
    const orgId = session.organizationId

    const [
      revenue,
      expenses,
      receivables,
      payables,
      cashBalance,
      accountCount,
      invoiceCount,
      journalCount,
    ] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total), 0) as total FROM "CustomerInvoice" 
         WHERE "organizationId" = $1 AND status IN ('PAID','PARTIALLY_PAID') AND date >= date_trunc('month', CURRENT_DATE)`,
        [orgId]
      ),
      pool.query(`SELECT COALESCE(SUM(total), 0) FROM "CustomerInvoice" WHERE "organizationId" = $1 AND status IN ('DRAFT','SENT','OVERDUE')`, [orgId]),
      pool.query(`SELECT COALESCE(SUM(total), 0) FROM "CustomerInvoice" WHERE "organizationId" = $1 AND status IN ('SENT','OVERDUE','PARTIALLY_PAID')`, [orgId]),
      pool.query(`SELECT COALESCE(SUM(total), 0) FROM "CustomerInvoice" WHERE "organizationId" = $1`, [orgId]),
      pool.query(`SELECT COALESCE(SUM("currentBalance"), 0) FROM "BankAccount" WHERE "organizationId" = $1`, [orgId]),
      pool.query('SELECT COUNT(*) FROM "ChartOfAccount" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "JournalEntry" WHERE "organizationId" = $1', [orgId]),
    ])

    return NextResponse.json({
      summary: {
        revenue: revenue.rows[0].total || 0,
        expenses: 0,
        netProfit: revenue.rows[0].total || 0,
        receivables: receivables.rows[0].total || 0,
        payables: payables.rows[0].total || 0,
        cashBalance: cashBalance.rows[0].total || 0,
        accountCount: parseInt(accountCount.rows[0].count),
        invoiceCount: parseInt(invoiceCount.rows[0].count),
        journalCount: parseInt(journalCount.rows[0].count),
      },
    })
  } catch (error) {
    console.error('Finance summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}