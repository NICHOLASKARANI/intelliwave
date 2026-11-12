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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.id
    const orderRes = await pool.query(`SELECT * FROM "MarketplaceOrder" WHERE id = $1`, [orderId])
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderRes.rows[0]

    // Only show receipt for PAID orders
    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json({ error: 'Receipt only available for paid orders' }, { status: 400 })
    }

    // Authorization: buyer OR seller OR admin
    const isBuyer = order.buyerId === session.userId
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'
    if (!isBuyer && !isAdmin) {
      const sellerCheck = await pool.query(
        `SELECT 1 FROM "MarketplaceOrderItem" WHERE "orderId" = $1 AND "sellerId" = $2 LIMIT 1`,
        [orderId, session.userId]
      )
      if (sellerCheck.rows.length === 0) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const itemsRes = await pool.query(
      `SELECT * FROM "MarketplaceOrderItem" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
      [orderId]
    )
    const items = itemsRes.rows

    const buyerRes = await pool.query(`SELECT name, email, phone FROM "User" WHERE id = $1`, [order.buyerId])
    const buyer = buyerRes.rows[0] || {}

    let seller: any = {}
    if (items.length > 0) {
      const sellerRes = await pool.query(
        `SELECT sp."storeName", u.name AS "ownerName" FROM "SellerProfile" sp
         LEFT JOIN "User" u ON u.id = sp."userId"
         WHERE sp."userId" = $1 LIMIT 1`,
        [items[0].sellerId]
      )
      seller = sellerRes.rows[0] || {}
    }

    const itemsHtml = items.map((it: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${esc(it.title || 'Item')} × ${esc(it.quantity)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatKES(it.lineTotal)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${esc(order.orderNumber)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background: #f3f4f6; }
    .page { max-width: 480px; margin: 20px auto; background: white; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .head { text-align: center; padding-bottom: 20px; border-bottom: 2px dashed #e5e7eb; margin-bottom: 20px; }
    .head h1 { font-size: 22px; color: #10b981; margin: 0 0 4px 0; }
    .head p { font-size: 11px; color: #6b7280; margin: 0; }
    .verified-stamp { display: inline-block; margin-top: 12px; padding: 6px 16px; background: #10b981; color: white; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .row .label { color: #6b7280; }
    .row .value { font-weight: 600; color: #111827; }
    .section { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .section h3 { font-size: 10px; text-transform: uppercase; color: #9ca3af; margin: 0 0 8px 0; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid #111827; font-size: 18px; font-weight: bold; color: #10b981; }
    .footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 2px dashed #e5e7eb; font-size: 11px; color: #6b7280; }
    @media print {
      body { background: white; }
      .page { box-shadow: none; margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="head">
      <h1>✓ Payment Confirmed</h1>
      <p>WaveMarket · IntelliWavve</p>
      <div class="verified-stamp">VERIFIED</div>
    </div>

    <div class="section">
      <h3>Order</h3>
      <div class="row"><span class="label">Order Number</span><span class="value">${esc(order.orderNumber)}</span></div>
      <div class="row"><span class="label">Date Paid</span><span class="value">${order.updatedAt ? new Date(order.updatedAt).toLocaleString('en-KE') : new Date(order.createdAt).toLocaleString('en-KE')}</span></div>
      <div class="row"><span class="label">M-Pesa Receipt</span><span class="value" style="font-family:monospace">${esc(order.paymentReference || '—')}</span></div>
    </div>

    <div class="section">
      <h3>Payment From</h3>
      <div class="row"><span class="label">Buyer</span><span class="value">${esc(buyer.name || 'Customer')}</span></div>
      ${buyer.phone ? '<div class="row"><span class="label">Phone</span><span class="value">' + esc(buyer.phone) + '</span></div>' : ''}
    </div>

    <div class="section">
      <h3>Paid To</h3>
      <div class="row"><span class="label">Seller</span><span class="value">${esc(seller.storeName || seller.ownerName || 'Seller')}</span></div>
    </div>

    <div class="section">
      <h3>Items</h3>
      <table><tbody>${itemsHtml}</tbody></table>
    </div>

    <div class="total-row"><span>TOTAL PAID</span><span>${formatKES(order.total)}</span></div>

    <div class="footer">
      This receipt confirms payment for your WaveMarket order.<br>
      Keep it for your records.<br>
      <span style="margin-top:8px;display:inline-block">Generated: ${new Date().toLocaleString('en-KE')}</span>
    </div>

    <div class="no-print" style="text-align:center;margin-top:20px">
      <button onclick="window.print()" style="padding:12px 30px;background:#10b981;color:white;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="receipt-${order.orderNumber}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Receipt error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}