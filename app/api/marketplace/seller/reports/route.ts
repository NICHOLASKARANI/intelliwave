export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const endDate = searchParams.get('end') || new Date().toISOString().slice(0, 10)

    // KPI
    const kpiRes = await pool.query(
      `SELECT
         COALESCE(SUM(oi."sellerPayout"), 0)::float AS "revenue",
         COUNT(DISTINCT o.id)::int AS "orders",
         COALESCE(SUM(oi.quantity), 0)::int AS "units",
         COALESCE(AVG(oi."lineTotal"), 0)::float AS "avgOrderItem"
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."sellerId" = $1
         AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
         AND o."createdAt"::date >= $2::date
         AND o."createdAt"::date <= $3::date`,
      [session.userId, startDate, endDate]
    )

    // Daily breakdown
    const dailyRes = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('day', o."createdAt"), 'YYYY-MM-DD') AS day,
         COUNT(DISTINCT o.id)::int AS orders,
         SUM(oi."sellerPayout")::float AS revenue,
         SUM(oi.quantity)::int AS units
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."sellerId" = $1
         AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
         AND o."createdAt"::date >= $2::date
         AND o."createdAt"::date <= $3::date
       GROUP BY DATE_TRUNC('day', o."createdAt")
       ORDER BY day ASC`,
      [session.userId, startDate, endDate]
    )

    // Top products in period
    const topRes = await pool.query(
      `SELECT
         oi."listingId", oi.title,
         SUM(oi.quantity)::int AS "unitsSold",
         SUM(oi."lineTotal")::float AS revenue
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."sellerId" = $1
         AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
         AND o."createdAt"::date >= $2::date
         AND o."createdAt"::date <= $3::date
       GROUP BY oi."listingId", oi.title
       ORDER BY revenue DESC
       LIMIT 5`,
      [session.userId, startDate, endDate]
    )

    return NextResponse.json({
      period: { start: startDate, end: endDate },
      kpi: kpiRes.rows[0],
      daily: dailyRes.rows,
      topProducts: topRes.rows,
    })
  } catch (error: any) {
    console.error('Reports error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}