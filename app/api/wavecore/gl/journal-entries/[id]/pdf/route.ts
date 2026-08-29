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
      `SELECT je.*, ji.debit, ji.credit, coa.name as "accountName", coa.code as "accountCode"
       FROM "JournalEntry" je
       LEFT JOIN "JournalItem" ji ON ji."journalEntryId" = je.id
       LEFT JOIN "ChartOfAccount" coa ON ji."accountId" = coa.id
       WHERE je.id = $1 AND je."organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const entry = result.rows[0]
    const items = result.rows

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Journal Entry ${entry.number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company { font-size: 24px; font-weight: bold; color: #2563eb; }
          .doc-title { font-size: 20px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .totals { text-align: right; font-size: 16px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">IntelliWavve</div>
          <div class="doc-title">JOURNAL ENTRY</div>
        </div>

        <div style="margin-bottom: 30px;">
          <strong>Entry Number:</strong> ${entry.number}<br>
          <strong>Date:</strong> ${new Date(entry.date).toLocaleDateString()}<br>
          <strong>Description:</strong> ${entry.description || ''}<br>
          <strong>Reference:</strong> ${entry.reference || 'N/A'}<br>
          <strong>Status:</strong> ${entry.status}
        </div>

        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.accountCode || ''} - ${item.accountName || ''}</td>
                <td>KSh ${Number(item.debit || 0).toLocaleString()}</td>
                <td>KSh ${Number(item.credit || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Total Amount: KSh ${Number(entry.amount || 0).toLocaleString()}</strong></p>
        </div>

        <div class="footer">
          IntelliWavve - World-Class ERP Solutions
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="journal-${entry.number}.html"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}