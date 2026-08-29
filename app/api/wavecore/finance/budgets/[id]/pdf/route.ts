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
      `SELECT * FROM "Budget" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const budget = result.rows[0]

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Budget ${budget.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; color: #059669; }
          .doc-title { font-size: 18px; font-weight: bold; }
          .amount-display { text-align: center; margin: 30px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #059669; }
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
            <div class="doc-title">BUDGET REPORT</div>
            <div style="font-size: 14px; color: #6b7280;">${budget.name}</div>
          </div>
        </div>

        <div class="amount-display">
          <div style="font-size: 14px; color: #6b7280;">TOTAL BUDGET AMOUNT</div>
          <div class="amount">KSh ${Number(budget.amount || 0).toLocaleString()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Details</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Budget Name</td>
              <td>${budget.name}</td>
            </tr>
            <tr>
              <td>Amount</td>
              <td>KSh ${Number(budget.amount || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Start Date</td>
              <td>${budget.startDate ? new Date(budget.startDate).toLocaleDateString('en-KE') : 'N/A'}</td>
            </tr>
            <tr>
              <td>End Date</td>
              <td>${budget.endDate ? new Date(budget.endDate).toLocaleDateString('en-KE') : 'N/A'}</td>
            </tr>
            <tr>
              <td>Created</td>
              <td>${new Date(budget.createdAt).toLocaleDateString('en-KE')}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          This is a system-generated budget report from IntelliWavve ERP.<br>
          Generated: ${new Date().toLocaleString('en-KE')}
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="budget-${budget.name}.html"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'PDF failed' }, { status: 500 })
  }
}