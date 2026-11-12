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

    // Items
    const itemsRes = await pool.query(
      `SELECT oi.*, l.images FROM "MarketplaceOrderItem" oi
       LEFT JOIN "MarketplaceListing" l ON l.id = oi."listingId"
       WHERE oi."orderId" = $1
       ORDER BY oi."createdAt" ASC`,
      [orderId]
    )
    const items = itemsRes.rows

    // Buyer info
    const buyerRes = await pool.query(`SELECT name, email FROM "User" WHERE id = $1`, [order.buyerId])
    const buyer = buyerRes.rows[0] || {}

    // Seller info (assume single seller for this order)
    let seller: any = {}
    if (items.length > 0) {
      const sellerRes = await pool.query(
        `SELECT sp."storeName", sp."paymentPaybill", sp."paymentTill", sp."paymentPersonal",
                sp."preferredPaymentMethod", u.name AS "ownerName", u.email AS "ownerEmail"
         FROM "SellerProfile" sp
         LEFT JOIN "User" u ON u.id = sp."userId"
         WHERE sp."userId" = $1 LIMIT 1`,
        [items[0].sellerId]
      )
      seller = sellerRes.rows[0] || {}
    }

    const itemsHtml = items.map((it: any) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb">${esc(it.title || 'Item')}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center">${esc(it.quantity)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">${formatKES(it.unitPrice)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold">${formatKES(it.lineTotal)}</td>
      </tr>
    `).join('')

    const statusBadge = order.paymentStatus === 'PAID'
      ? '<span style="display:inline-block;padding:4px 12px;background:#10b981;color:white;border-radius:12px;font-size:11px;font-weight:bold">PAID</span>'
      : '<span style="display:inline-block;padding:4px 12px;background:#f59e0b;color:white;border-radius:12px;font-size:11px;font-weight:bold">' + esc(order.paymentStatus || 'PENDING') + '</span>'

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${esc(order.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background: #f3f4f6; }
    .page { max-width: 800px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    h1, h2, h3 { margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #f59e0b; margin-bottom: 30px; }
    .brand { font-size: 28px; font-weight: 800; color: #f59e0b; }
    .brand-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 24px; color: #111827; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .grid h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 8px; font-weight: 700; }
    .grid p { margin: 4px 0; font-size: 14px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { padding: 10px; text-align: left; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #374151; }
    .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-inner { min-width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #111827; padding-top: 12px; margin-top: 8px; font-weight: bold; font-size: 18px; color: #10b981; }
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
        <div class="brand">WaveMarket</div>
        <div class="brand-sub">Marketplace by IntelliWavve · Kenya</div>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p style="margin:4px 0;font-size:14px"><b>${esc(order.orderNumber)}</b></p>
        <p style="margin:4px 0;font-size:13px;color:#6b7280">${new Date(order.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        <p style="margin:8px 0 0 0">${statusBadge}</p>
      </div>
    </div>

    <div class="grid">
      <div>
        <h3>Bill To</h3>
        <p><b>${esc(buyer.name || 'Customer')}</b></p>
        ${buyer.email ? '<p>' + esc(buyer.email) + '</p>' : ''}
        ${order.shippingAddress ? '<p style="color:#6b7280;font-size:13px">' + esc(order.shippingAddress) + '</p>' : ''}
      </div>
      <div>
        <h3>Sold By</h3>
        <p><b>${esc(seller.storeName || seller.ownerName || 'Seller')}</b></p>
        ${seller.ownerEmail ? '<p>' + esc(seller.ownerEmail) + '</p>' : ''}
        ${seller.preferredPaymentMethod ? '<p style="color:#6b7280;font-size:13px">Payment method: ' + esc(seller.preferredPaymentMethod) + '</p>' : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;width:60px">Qty</th>
          <th style="text-align:right;width:120px">Unit Price</th>
          <th style="text-align:right;width:120px">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-inner">
        <div class="totals-row"><span>Subtotal</span><span>${formatKES(order.subtotal)}</span></div>
        <div class="totals-row"><span>Delivery</span><span>${formatKES(order.deliveryFee || 0)}</span></div>
        <div class="totals-row total"><span>TOTAL</span><span>${formatKES(order.total)}</span></div>
      </div>
    </div>

    ${order.paymentReference ? `
    <div style="margin-top:30px;padding:15px;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px">
      <p style="margin:0;font-size:12px;color:#1e40af"><b>M-Pesa Receipt:</b> ${esc(order.paymentReference)}</p>
      ${order.paymentStatus === 'PAID' ? '<p style="margin:4px 0 0 0;font-size:12px;color:#10b981"><b>✓ Payment Verified</b></p>' : ''}
    </div>
    ` : ''}

    <div class="footer">
      Thank you for shopping on WaveMarket!<br>
      Questions? Contact support@intelliwavve.com<br>
      <span style="margin-top:8px;display:inline-block">Generated: ${new Date().toLocaleString('en-KE')}</span>
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
        'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Invoice error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}