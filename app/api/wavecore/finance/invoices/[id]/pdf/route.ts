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
      `SELECT ci.*, c.name as "customerName", c.email as "customerEmail", c.phone as "customerPhone", c.address as "customerAddress"
       FROM "CustomerInvoice" ci
       LEFT JOIN "Customer" c ON ci."customerId" = c.id
       WHERE ci.id = $1 AND ci."organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const invoice = result.rows[0]
    const docType = invoice.status === 'PAID' ? 'RECEIPT' : 'INVOICE'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docType} ${invoice.number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company { font-size: 24px; font-weight: bold; color: #2563eb; }
          .doc-title { font-size: 20px; font-weight: bold; color: #333; }
          .paid-badge { color: #16a34a; font-weight: bold; font-size: 12px; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-to { font-size: 14px; }
          .doc-details { font-size: 14px; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .totals { text-align: right; font-size: 16px; }
          .total-row { font-weight: bold; font-size: 20px; color: #2563eb; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">IntelliWavve</div>
          <div class="doc-title">${docType}</div>
        </div>

        <div class="info-section">
          <div class="bill-to">
            <strong>${invoice.status === 'PAID' ? 'Received From:' : 'Bill To:'}</strong><br>
            ${invoice.customerName || 'Customer'}<br>
            ${invoice.customerEmail || ''}<br>
            ${invoice.customerPhone || ''}<br>
            ${invoice.customerAddress || ''}
          </div>
          <div class="doc-details">
            <strong>${docType} Number:</strong> ${invoice.number}<br>
            <strong>Date:</strong> ${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}<br>
            <strong>${invoice.status === 'PAID' ? 'Paid Date:' : 'Due Date:'}</strong> ${new Date(invoice.dueDate).toLocaleDateString()}<br>
            <strong>Status:</strong> ${invoice.status}
            ${invoice.status === 'PAID' ? '<br><span class="paid-badge">PAID - RECEIPT</span>' : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${docType === 'RECEIPT' ? 'Payment received' : 'Invoice services'}</td>
              <td>KSh ${Number(invoice.total || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <p>Subtotal: KSh ${Number(invoice.subtotal || 0).toLocaleString()}</p>
          <p>Tax: KSh ${Number(invoice.taxAmount || 0).toLocaleString()}</p>
          <p class="total-row">${docType === 'RECEIPT' ? 'Amount Paid' : 'Total Due'}: KSh ${Number(invoice.total || 0).toLocaleString()}</p>
        </div>

        <div class="footer">
          ${docType === 'RECEIPT' ? 'Payment received. Thank you!' : 'Thank you for your business!'}<br>
          IntelliWavve - World-Class ERP Solutions
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${docType.toLowerCase()}-${invoice.number}.html"`
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}