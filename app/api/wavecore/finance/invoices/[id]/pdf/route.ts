export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

// GET: Download invoice as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get invoice with customer info
    const result = await pool.query(
      `SELECT ci.*, c.name as "customerName", c.email as "customerEmail", c.phone as "customerPhone", c.address as "customerAddress"
       FROM "CustomerInvoice" ci
       LEFT JOIN "Customer" c ON ci."customerId" = c.id
       WHERE ci.id = $1 AND ci."organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = result.rows[0]

    // Generate PDF using HTML (browser will print to PDF)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company { font-size: 24px; font-weight: bold; color: #2563eb; }
          .invoice-title { font-size: 20px; font-weight: bold; color: #333; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-to { font-size: 14px; }
          .invoice-details { font-size: 14px; text-align: right; }
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
          <div class="invoice-title">INVOICE</div>
        </div>
        
        <div class="info-section">
          <div class="bill-to">
            <strong>Bill To:</strong><br>
            ${invoice.customerName || 'Customer'}<br>
            ${invoice.customerEmail || ''}<br>
            ${invoice.customerPhone || ''}<br>
            ${invoice.customerAddress || ''}
          </div>
          <div class="invoice-details">
            <strong>Invoice Number:</strong> ${invoice.number}<br>
            <strong>Date:</strong> ${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}<br>
            <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}<br>
            <strong>Status:</strong> ${invoice.status}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Invoice services</td>
              <td>1</td>
              <td>KSh ${invoice.subtotal?.toLocaleString() || '0'}</td>
              <td>KSh ${invoice.subtotal?.toLocaleString() || '0'}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="totals">
          <p>Subtotal: KSh ${invoice.subtotal?.toLocaleString() || '0'}</p>
          <p>Tax (16%): KSh ${invoice.taxAmount?.toLocaleString() || '0'}</p>
          <p class="total-row">Total: KSh ${invoice.total?.toLocaleString() || '0'}</p>
        </div>
        
        <div class="footer">
          Thank you for your business!<br>
          IntelliWavve - World-Class ERP Solutions
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.number}.html"`
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}