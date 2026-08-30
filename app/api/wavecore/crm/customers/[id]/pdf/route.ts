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
      `SELECT * FROM "Customer" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customer = result.rows[0]

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer - ${customer.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; color: #2563eb; }
          .customer-card { background: #f9fafb; border-radius: 15px; padding: 30px; }
          .field { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #6b7280; }
          .value { font-weight: bold; color: #111827; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">IntelliWavve</div>
          <div style="font-size: 14px; color: #6b7280;">Customer Details</div>
        </div>

        <div class="customer-card">
          <h2 style="text-align: center; color: #2563eb; margin-bottom: 20px;">${customer.name || 'N/A'}</h2>
          
          <div class="field">
            <span class="label">Email</span>
            <span class="value">${customer.email || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Phone</span>
            <span class="value">${customer.phone || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Type</span>
            <span class="value">${customer.type || 'INDIVIDUAL'}</span>
          </div>
          <div class="field">
            <span class="label">Status</span>
            <span class="value">${customer.status || 'ACTIVE'}</span>
          </div>
          <div class="field">
            <span class="label">Created</span>
            <span class="value">${new Date(customer.createdAt).toLocaleDateString('en-KE')}</span>
          </div>
        </div>

        <div class="footer">
          This is a system-generated customer record from IntelliWavve ERP.<br>
          Generated: ${new Date().toLocaleString('en-KE')}
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="customer-${customer.name}.html"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'PDF failed' }, { status: 500 })
  }
}