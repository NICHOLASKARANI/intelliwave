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

    // Get journal entry with items and account details
    const result = await pool.query(
      `SELECT je.*, 
        ji.id as "itemId", ji.debit, ji.credit, 
        coa.code as "accountCode", coa.name as "accountName", coa.type as "accountType"
       FROM "JournalEntry" je
       LEFT JOIN "JournalItem" ji ON ji."journalEntryId" = je.id
       LEFT JOIN "ChartOfAccount" coa ON ji."accountId" = coa.id
       WHERE je.id = $1 AND je."organizationId" = $2
       ORDER BY ji."createdAt" ASC`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const entry = result.rows[0]
    const items = result.rows.filter(r => r.itemId)
    const totalDebit = items.reduce((sum, i) => sum + Number(i.debit || 0), 0)
    const totalCredit = items.reduce((sum, i) => sum + Number(i.credit || 0), 0)

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Journal Entry ${entry.number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; color: #2563eb; }
          .doc-title { font-size: 18px; font-weight: bold; color: #333; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-POSTED { background: #dcfce7; color: #16a34a; }
          .status-DRAFT { background: #f3f4f6; color: #6b7280; }
          .status-APPROVED { background: #dbeafe; color: #2563eb; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; font-size: 13px; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          tr:nth-child(even) { background: #f9fafb; }
          .totals { text-align: right; font-size: 15px; margin-top: 10px; }
          .total-row { font-weight: bold; font-size: 18px; color: #2563eb; }
          .balanced { color: #16a34a; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .signature-line { display: flex; justify-content: space-between; margin-top: 60px; }
          .sig { text-align: center; font-size: 12px; color: #6b7280; }
          .sig-line { border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">IntelliWavve</div>
            <div style="font-size: 12px; color: #6b7280;">World-Class ERP Solutions</div>
          </div>
          <div style="text-align: right;">
            <div class="doc-title">JOURNAL ENTRY</div>
            <div style="font-size: 14px; color: #6b7280;">${entry.number}</div>
            <span class="status-badge status-${entry.status}">${entry.status}</span>
          </div>
        </div>

        <div class="info-section">
          <div>
            <strong>Date:</strong> ${new Date(entry.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
            <strong>Reference:</strong> ${entry.reference || 'N/A'}<br>
            <strong>Description:</strong> ${entry.description || 'N/A'}
          </div>
          <div style="text-align: right;">
            <strong>Entry ID:</strong> ${entry.id.substring(0, 8)}...<br>
            <strong>Created:</strong> ${new Date(entry.createdAt).toLocaleString('en-KE')}<br>
            <strong>Items:</strong> ${items.length}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th style="text-align: right;">Debit (KSh)</th>
              <th style="text-align: right;">Credit (KSh)</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? items.map(item => `
              <tr>
                <td>${item.accountCode || 'N/A'}</td>
                <td>${item.accountName || 'N/A'}</td>
                <td>${item.accountType || 'N/A'}</td>
                <td style="text-align: right;">${Number(item.debit || 0).toLocaleString()}</td>
                <td style="text-align: right;">${Number(item.credit || 0).toLocaleString()}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; color: #6b7280;">No line items</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="totals">
          <p>Total Debit: <strong>KSh ${totalDebit.toLocaleString()}</strong></p>
          <p>Total Credit: <strong>KSh ${totalCredit.toLocaleString()}</strong></p>
          <p class="total-row ${totalDebit === totalCredit ? 'balanced' : ''}">
            ${totalDebit === totalCredit ? '✓ BALANCED' : '⚠ NOT BALANCED'}: KSh ${Number(entry.amount || 0).toLocaleString()}
          </p>
        </div>

        <div class="signature-line">
          <div class="sig">
            <div class="sig-line"></div>
            Prepared By
          </div>
          <div class="sig">
            <div class="sig-line"></div>
            Approved By
          </div>
          <div class="sig">
            <div class="sig-line"></div>
            Date
          </div>
        </div>

        <div class="footer">
          This is a system-generated journal entry from IntelliWavve ERP.<br>
          Generated: ${new Date().toLocaleString('en-KE')}
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="journal-entry-${entry.number}.html"`
      }
    })
  } catch (error) {
    console.error('Journal PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}