export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    // Revenue trend (last 6 months)
    const revenueTrend = await pool.query(
      `SELECT 
        to_char(date_trunc('month', date), 'Mon') as month,
        COALESCE(SUM(CASE WHEN status IN ('PAID','PARTIALLY_PAID') THEN total ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN status IN ('DRAFT','SENT','OVERDUE') THEN total ELSE 0 END), 0) as expenses
       FROM "CustomerInvoice"
       WHERE "organizationId" = $1
         AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
       GROUP BY date_trunc('month', date)
       ORDER BY date_trunc('month', date)`,
      [orgId]
    )

    // Products by category
    const salesByCategory = await pool.query(
      `SELECT COALESCE(category, 'Uncategorized') as name, COUNT(*) as value
       FROM "Product"
       WHERE "organizationId" = $1
       GROUP BY category
       ORDER BY value DESC
       LIMIT 8`,
      [orgId]
    )

    // Invoice status distribution
    const invoiceStatus = await pool.query(
      `SELECT status as name, COUNT(*) as value
       FROM "CustomerInvoice"
       WHERE "organizationId" = $1
       GROUP BY status`,
      [orgId]
    )

    return NextResponse.json({
      revenueTrend: revenueTrend.rows,
      salesByCategory: salesByCategory.rows,
      invoiceStatus: invoiceStatus.rows,
    })
  } catch (error) {
    console.error('Charts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}