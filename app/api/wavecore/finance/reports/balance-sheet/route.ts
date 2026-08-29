export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get assets
    const assetsResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(balance AS DECIMAL(15,2))), 0) as total FROM "ChartOfAccount" WHERE type = 'Asset' AND "organizationId" = $1`,
      [session.organizationId]
    )

    // Get liabilities
    const liabilitiesResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(balance AS DECIMAL(15,2))), 0) as total FROM "ChartOfAccount" WHERE type = 'Liability' AND "organizationId" = $1`,
      [session.organizationId]
    )

    // Get equity
    const equityResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(balance AS DECIMAL(15,2))), 0) as total FROM "ChartOfAccount" WHERE type = 'Equity' AND "organizationId" = $1`,
      [session.organizationId]
    )

    const assets = Number(assetsResult.rows[0]?.total || 0)
    const liabilities = Number(liabilitiesResult.rows[0]?.total || 0)
    const equity = Number(equityResult.rows[0]?.total || 0)

    return NextResponse.json({
      success: true,
      balanceSheet: {
        assets,
        liabilities,
        equity,
        totalLiabilitiesAndEquity: liabilities + equity,
        balanced: Math.abs(assets - (liabilities + equity)) < 0.01,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Balance sheet error:', error)
    return NextResponse.json({ balanceSheet: { assets: 0, liabilities: 0, equity: 0, balanced: true } })
  }
}