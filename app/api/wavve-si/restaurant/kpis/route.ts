export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // ─── Total orders + revenue + avg ticket (all time) ───
    const totals = await pool.query(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total), 0) AS total_revenue,
         COALESCE(AVG(total), 0) AS avg_ticket
       FROM "SalesOrder"
       WHERE "organizationId" = $1`,
      [orgId]
    )

    // ─── Orders today ───
    const today = await pool.query(
      `SELECT
         COUNT(*) AS orders_today,
         COALESCE(SUM(total), 0) AS revenue_today
       FROM "SalesOrder"
       WHERE "organizationId" = $1
         AND date >= CURRENT_DATE
         AND date < CURRENT_DATE + INTERVAL '1 day'`,
      [orgId]
    )

    // ─── Orders by status ───
    const byStatus = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM "SalesOrder"
       WHERE "organizationId" = $1
       GROUP BY status`,
      [orgId]
    )

    // ─── Revenue last 7 days (daily buckets) ───
    const trend = await pool.query(
      `SELECT
         TO_CHAR(date, 'Dy') AS day,
         date::date AS date_bucket,
         COALESCE(SUM(total), 0) AS revenue,
         COUNT(*) AS orders
       FROM "SalesOrder"
       WHERE "organizationId" = $1
         AND date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY day, date_bucket
       ORDER BY date_bucket ASC`,
      [orgId]
    )

    // ─── Top 5 selling items ───
    const topItems = await pool.query(
      `SELECT
         soi.description AS name,
         SUM(soi.quantity) AS quantity,
         SUM(soi.total) AS revenue
       FROM "SalesOrderItem" soi
       JOIN "SalesOrder" so ON so.id = soi."salesOrderId"
       WHERE so."organizationId" = $1
       GROUP BY soi.description
       ORDER BY SUM(soi.quantity) DESC
       LIMIT 5`,
      [orgId]
    )

    // ─── Active products count (from store API pattern) ───
    const products = await pool.query(
      `SELECT COUNT(*) AS product_count
       FROM "Product"
       WHERE "organizationId" = $1 AND "isActive" = true`,
      [orgId]
    )

    const t = totals.rows[0] || {}
    const td = today.rows[0] || {}
    const p = products.rows[0] || {}

    return NextResponse.json({
      total_orders: Number(t.total_orders) || 0,
      total_revenue: Number(t.total_revenue) || 0,
      avg_ticket: Number(t.avg_ticket) || 0,
      orders_today: Number(td.orders_today) || 0,
      revenue_today: Number(td.revenue_today) || 0,
      product_count: Number(p.product_count) || 0,
      by_status: byStatus.rows.map(r => ({ status: r.status, count: Number(r.count) })),
      revenue_trend: trend.rows.map(r => ({ day: r.day, revenue: Number(r.revenue), orders: Number(r.orders) })),
      top_items: topItems.rows.map(r => ({ name: r.name, quantity: Number(r.quantity), revenue: Number(r.revenue) })),
    })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/kpis] error:', err?.message)
    return NextResponse.json({ error: 'Failed to load KPIs' }, { status: 500 })
  }
}