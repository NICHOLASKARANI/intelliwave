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
      `SELECT cp.*, ci.number as "invoiceNumber", ci.total as "invoiceTotal", c.name as "customerName", c.email as "customerEmail"
       FROM "CustomerPayment" cp
       LEFT JOIN "CustomerInvoice" ci ON cp."invoiceId" = ci.id
       LEFT JOIN "Customer" c ON ci."customerId" = c.id
       WHERE cp.id = $1 AND cp."organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const payment = result.rows[0]

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt ${payment.number || payment.id.substring(0, 8)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; color: #059669; }
          .doc-title { font-size: 18px; font-weight: bold; color: #333; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .amount-display { text-align: center; margin: 30px 0; }
          .amount { font-size: 36px; font-weight: bold; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #059669; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">IntelliWavve</div>
            <div style="font-size: 12px; color: #6b7280;">World-Class ERP Solutions</div>
          </div>
          <div style="text-align: right;">
            <div class="doc-title">PAYMENT RECEIPT</div>
            <div style="font-size: 14px; color: #6b7280;">${payment.number || payment.id.substring(0, 8)}</div>
          </div>
        </div>

        <div class="amount-display">
          <div style="font-size: 14px; color: #6b7280;">AMOUNT RECEIVED</div>
          <div class="amount">KSh ${Number(payment.amount || 0).toLocaleString()}</div>
        </div>

        <div class="info-section">
          <div>
            <strong>Received From:</strong> ${payment.customerName || 'Customer'}<br>
            <strong>Email:</strong> ${payment.customerEmail || 'N/A'}<br>
            <strong>Invoice:</strong> ${payment.invoiceNumber || 'N/A'}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
            <strong>Time:</strong> ${new Date(payment.createdAt).toLocaleTimeString('en-KE')}<br>
            <strong>Method:</strong> ${payment.method || 'N/A'}
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
              <td>Payment received${payment.invoiceNumber ? ' for Invoice ' + payment.invoiceNumber : ''}</td>
              <td>KSh ${Number(payment.amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          This is a system-generated payment receipt from IntelliWavve ERP.<br>
          Generated: ${new Date().toLocaleString('en-KE')}
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="payment-${payment.number || payment.id.substring(0, 8)}.html"`
      }
    })
  } catch (error) {
    console.error('Payment PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}