export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT so.*, c.name as "customerName"
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON so."customerId" = c.id
       WHERE so.id = $1 AND so."organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const sale = result.rows[0]

    // Get items using CORRECT columns (description, not productId)
    const itemsResult = await pool.query(
      `SELECT * FROM "SalesOrderItem" WHERE "salesOrderId" = $1`,
      [params.id]
    )

    const items = itemsResult.rows

    const html = `<!DOCTYPE html><html><head><title>Sale ${sale.number}</title>
<style>body{font-family:Arial;padding:40px;max-width:700px;margin:0 auto}.header{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:20px}.company{font-size:24px;font-weight:bold;color:#2563eb}.amount{text-align:center;font-size:32px;font-weight:bold;color:#16a34a;margin:20px 0}table{width:100%;border-collapse:collapse;margin-bottom:30px}th{background:#2563eb;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #e5e7eb}.footer{margin-top:40px;text-align:center;font-size:12px;color:#6b7280}</style></head>
<body><div class="header"><div class="company">IntelliWavve</div><div>SALES RECEIPT</div></div>
<div class="amount">KSh ${Number(sale.total || 0).toLocaleString()}</div>
<p><strong>Sale #:</strong> ${sale.number}</p>
<p><strong>Customer:</strong> ${sale.customerName || 'Walk-in Customer'}</p>
<p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString('en-KE')}</p>
<table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
<tbody>${items.map(item => `<tr><td>${item.description || 'Item'}</td><td>${item.quantity}</td><td>KSh ${Number(item.unitPrice || 0).toLocaleString()}</td><td>KSh ${Number(item.total || 0).toLocaleString()}</td></tr>`).join('')}</tbody></table>
<p style="font-weight:bold;font-size:20px;color:#2563eb">TOTAL: KSh ${Number(sale.total || 0).toLocaleString()}</p>
<div class="footer">Generated: ${new Date().toLocaleString('en-KE')}</div>
<script>window.print();</script></body></html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="sale-${sale.number}.html"`
      }
    })
  } catch (error) {
    console.error('Sales PDF error:', error)
    return NextResponse.json({ error: 'PDF failed: ' + (error as Error).message }, { status: 500 })
  }
}