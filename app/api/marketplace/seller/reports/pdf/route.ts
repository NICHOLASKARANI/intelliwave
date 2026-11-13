export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c)
}

function formatKES(n: any): string {
  return 'KES ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const endDate = searchParams.get('end') || new Date().toISOString().slice(0, 10)

    // KPIs
    const kpiRes = await pool.query(
      `SELECT
         COALESCE(SUM(oi."sellerPayout"), 0)::float AS "revenue",
         COUNT(DISTINCT o.id)::int AS "orders",
         COALESCE(SUM(oi.quantity), 0)::int AS "units"
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."sellerId" = $1
         AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
         AND o."createdAt"::date >= $2::date
         AND o."createdAt"::date <= $3::date`,
      [session.userId, startDate, endDate]
    )
    const kpi = kpiRes.rows[0]

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

    // Top products
    const topRes = await pool.query(
      `SELECT
         oi.title,
         SUM(oi.quantity)::int AS "unitsSold",
         SUM(oi."lineTotal")::float AS revenue
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       WHERE oi."sellerId" = $1
         AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
         AND o."createdAt"::date >= $2::date
         AND o."createdAt"::date <= $3::date
       GROUP BY oi.title
       ORDER BY revenue DESC
       LIMIT 10`,
      [session.userId, startDate, endDate]
    )

    // Store info
    const storeRes = await pool.query(
      `SELECT sp."storeName", u.name AS "ownerName", u.email
       FROM "SellerProfile" sp
       LEFT JOIN "User" u ON u.id = sp."userId"
       WHERE sp."userId" = $1 LIMIT 1`,
      [session.userId]
    )
    const store = storeRes.rows[0] || {}

    const dailyRows = dailyRes.rows.map((d: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${new Date(d.day).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${d.orders}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#10b981;font-weight:600">${formatKES(d.revenue)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${d.units}</td>
      </tr>
    `).join('')

    const topRows = topRes.rows.map((p: any, i: number) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i + 1}. ${esc(p.title || 'Item')}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${p.unitsSold}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#10b981;font-weight:600">${formatKES(p.revenue)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Report · ${esc(store.storeName || 'My Store')}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background: #f3f4f6; }
    .page { max-width: 800px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #f59e0b; margin-bottom: 30px; }
    .brand { font-size: 26px; font-weight: 800; color: #f59e0b; }
    .brand-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .meta { text-align: right; font-size: 12px; color: #6b7280; }
    .meta h2 { font-size: 20px; color: #111827; margin: 0 0 6px 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 30px; }
    .kpi { padding: 16px; background: #f9fafb; border-radius: 10px; border-left: 4px solid #06b6d4; }
    .kpi .label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; }
    .kpi .value { font-size: 22px; font-weight: 800; color: #111827; margin-top: 4px; }
    h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 24px 0 10px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { padding: 10px; text-align: left; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 10px; text-transform: uppercase; color: #374151; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
    @media print {
      body { background: white; }
      .page { box-shadow: none; margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand">${esc(store.storeName || 'My Store')}</div>
        <div class="brand-sub">WaveMarket · Sales Report</div>
      </div>
      <div class="meta">
        <h2>Sales Report</h2>
        <p style="margin:2px 0">${new Date(startDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(endDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        ${store.ownerName ? '<p style="margin:2px 0">Owner: ' + esc(store.ownerName) + '</p>' : ''}
        ${store.email ? '<p style="margin:2px 0">' + esc(store.email) + '</p>' : ''}
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Revenue</div>
        <div class="value">${formatKES(kpi.revenue)}</div>
      </div>
      <div class="kpi">
        <div class="label">Orders</div>
        <div class="value">${kpi.orders}</div>
      </div>
      <div class="kpi">
        <div class="label">Units Sold</div>
        <div class="value">${kpi.units}</div>
      </div>
    </div>

    ${dailyRes.rows.length > 0 ? `
    <h3>Daily Breakdown</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th style="text-align:center;width:80px">Orders</th>
          <th style="text-align:right;width:140px">Revenue</th>
          <th style="text-align:center;width:80px">Units</th>
        </tr>
      </thead>
      <tbody>${dailyRows}</tbody>
    </table>
    ` : '<p style="text-align:center;color:#6b7280;padding:20px">No sales in this period</p>'}

    ${topRes.rows.length > 0 ? `
    <h3>Top Products</h3>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;width:100px">Units Sold</th>
          <th style="text-align:right;width:140px">Revenue</th>
        </tr>
      </thead>
      <tbody>${topRows}</tbody>
    </table>
    ` : ''}

    <div class="footer">
      Generated by WaveMarket · ${new Date().toLocaleString('en-KE')}<br>
      This report is system-generated and reflects paid orders only.
    </div>

    <div class="no-print" style="text-align:center;margin-top:20px">
      <button onclick="window.print()" style="padding:12px 30px;background:#f59e0b;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="sales-report-${startDate}-to-${endDate}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Reports PDF error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}