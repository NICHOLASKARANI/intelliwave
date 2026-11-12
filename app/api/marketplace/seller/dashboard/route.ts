export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sellerId = session.userId

    // ===== KPI aggregates =====
    const kpiRes = await pool.query(
      `SELECT
         COALESCE((SELECT SUM(oi."sellerPayout") FROM "MarketplaceOrderItem" oi
                   JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
                   WHERE oi."sellerId" = $1 AND o."paymentStatus" = 'PAID'
                     AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')), 0)::float AS "totalSales",
         (SELECT COUNT(DISTINCT o.id) FROM "MarketplaceOrder" o
          JOIN "MarketplaceOrderItem" oi ON oi."orderId" = o.id
          WHERE oi."sellerId" = $1 AND o."paymentStatus" = 'PAID'
            AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED'))::int AS "totalOrders",
         (SELECT COUNT(*) FROM "MarketplaceListing"
          WHERE "sellerId" = $1 AND status = 'ACTIVE')::int AS "activeListings",
         COALESCE((SELECT "averageRating" FROM "SellerProfile" WHERE "userId" = $1), 0)::float AS "avgRating",
         (SELECT COUNT(*) FROM "MarketplaceOrder" o
          JOIN "MarketplaceOrderItem" oi ON oi."orderId" = o.id
          WHERE oi."sellerId" = $1 AND o.status = 'AWAITING_SELLER_ACCEPT')::int AS "needsActionCount",
         (SELECT COUNT(*) FROM "MarketplaceListing"
          WHERE "sellerId" = $1 AND status = 'ACTIVE' AND COALESCE(stock, 0) <= 3)::int AS "lowStockCount"`,
      [sellerId]
    )

    const kpi = kpiRes.rows[0]

    // ===== Revenue last 30 days =====
    const revenueRes = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('day', o."updatedAt"), 'YYYY-MM-DD') AS day,
         SUM(oi."sellerPayout")::float AS revenue
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."sellerId" = $1 AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
         AND o."updatedAt" > NOW() - INTERVAL '30 days'
       GROUP BY DATE_TRUNC('day', o."updatedAt")
       ORDER BY day ASC`,
      [sellerId]
    )

    // Fill missing days with 0
    const today = new Date()
    const revenueMap: Record<string, number> = {}
    for (const r of revenueRes.rows) revenueMap[r.day] = r.revenue
    const revenueSeries: { day: string, revenue: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      revenueSeries.push({ day: key, revenue: revenueMap[key] || 0 })
    }

    // ===== Recent orders =====
    const recentOrdersRes = await pool.query(
      `SELECT DISTINCT ON (o.id)
         o.id, o."orderNumber", o.status, o."paymentStatus", o.total, o."createdAt"
       FROM "MarketplaceOrder" o
       JOIN "MarketplaceOrderItem" oi ON oi."orderId" = o.id
       WHERE oi."sellerId" = $1
       ORDER BY o.id, o."createdAt" DESC
       LIMIT 5`,
      [sellerId]
    )

    // ===== Top products =====
    const topProductsRes = await pool.query(
      `SELECT
         oi."listingId", oi.title,
         SUM(oi.quantity)::int AS "unitsSold",
         SUM(oi."lineTotal")::float AS revenue
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."sellerId" = $1 AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
       GROUP BY oi."listingId", oi.title
       ORDER BY revenue DESC
       LIMIT 5`,
      [sellerId]
    )

    // ===== Low stock items =====
    const lowStockRes = await pool.query(
      `SELECT id, title, stock, images
       FROM "MarketplaceListing"
       WHERE "sellerId" = $1 AND status = 'ACTIVE' AND COALESCE(stock, 0) <= 3
       ORDER BY stock ASC
       LIMIT 10`,
      [sellerId]
    )

    return NextResponse.json({
      kpi,
      revenueSeries,
      recentOrders: recentOrdersRes.rows,
      topProducts: topProductsRes.rows,
      lowStock: lowStockRes.rows,
    })
  } catch (error: any) {
    console.error('Dashboard error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}