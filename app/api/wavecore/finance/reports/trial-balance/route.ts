export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, code, name, type, balance,
        CASE WHEN type IN ('Asset', 'Expense') THEN balance ELSE 0 END as debit,
        CASE WHEN type IN ('Liability', 'Equity', 'Revenue') THEN balance ELSE 0 END as credit
       FROM "ChartOfAccount" 
       WHERE "organizationId" = $1 
       ORDER BY code ASC`,
      [session.organizationId]
    )

    const accounts = result.rows
    const totalDebit = accounts.reduce((sum, a) => sum + Number(a.debit || 0), 0)
    const totalCredit = accounts.reduce((sum, a) => sum + Number(a.credit || 0), 0)

    return NextResponse.json({
      success: true,
      trialBalance: {
        accounts,
        totalDebit,
        totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({ trialBalance: { accounts: [], totalDebit: 0, totalCredit: 0, balanced: true } })
  }
}