export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get revenue
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(balance AS DECIMAL(15,2))), 0) as total FROM "ChartOfAccount" WHERE type = 'Revenue' AND "organizationId" = $1`,
      [session.organizationId]
    )

    // Get expenses
    const expensesResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(balance AS DECIMAL(15,2))), 0) as total FROM "ChartOfAccount" WHERE type = 'Expense' AND "organizationId" = $1`,
      [session.organizationId]
    )

    const revenue = Number(revenueResult.rows[0]?.total || 0)
    const expenses = Number(expensesResult.rows[0]?.total || 0)
    const netProfit = revenue - expenses

    return NextResponse.json({
      success: true,
      incomeStatement: {
        revenue,
        expenses,
        netProfit,
        isProfit: netProfit >= 0,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({ incomeStatement: { revenue: 0, expenses: 0, netProfit: 0, isProfit: true } })
  }
}