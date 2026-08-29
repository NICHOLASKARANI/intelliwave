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
      `SELECT br.*, ba."accountName", ba."accountNumber", ba."bankName"
       FROM "BankReconciliation" br
       LEFT JOIN "BankAccount" ba ON br."bankAccountId" = ba.id
       WHERE br.id = $1 AND br."organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const recon = result.rows[0]
    const isMatched = recon.status === 'MATCHED'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bank Reconciliation ${recon.id.substring(0, 8)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .doc-title { font-size: 18px; font-weight: bold; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-MATCHED { background: #dcfce7; color: #16a34a; }
          .status-UNMATCHED { background: #fee2e2; color: #dc2626; }
          .info-section { margin-bottom: 30px; font-size: 14px; }
          .balance-display { text-align: center; margin: 30px 0; }
          .balance { font-size: 28px; font-weight: bold; }
          .matched { color: #16a34a; }
          .unmatched { color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #7c3aed; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">IntelliWavve</div>
            <div style="font-size: 12px; color: #6b7280;">World-Class ERP Solutions</div>
          </div>
          <div style="text-align: right;">
            <div class="doc-title">BANK RECONCILIATION</div>
            <div style="font-size: 14px; color: #6b7280;">${recon.id.substring(0, 8)}</div>
            <span class="status status-${recon.status}">${recon.status}</span>
          </div>
        </div>

        <div class="info-section">
          <strong>Bank Account:</strong> ${recon.bankName || 'N/A'} - ${recon.accountName || 'N/A'}<br>
          <strong>Account Number:</strong> ${recon.accountNumber || 'N/A'}<br>
          <strong>Date:</strong> ${new Date(recon.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount (KSh)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bank Statement Balance</td>
              <td style="text-align: right;">${Number(recon.statementBalance || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Book Balance (ERP)</td>
              <td style="text-align: right;">${Number(recon.bookBalance || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Difference</strong></td>
              <td style="text-align: right;" class="${isMatched ? 'matched' : 'unmatched'}">
                <strong>KSh ${Number(recon.difference || 0).toLocaleString()}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="balance-display">
          <div style="font-size: 14px; color: #6b7280;">RECONCILIATION STATUS</div>
          <div class="balance ${isMatched ? 'matched' : 'unmatched'}">
            ${isMatched ? '✓ ACCOUNTS MATCHED' : '⚠ DIFFERENCE DETECTED'}
          </div>
        </div>

        <div class="footer">
          This is a system-generated bank reconciliation from IntelliWavve ERP.<br>
          Generated: ${new Date().toLocaleString('en-KE')}
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="reconciliation-${recon.id.substring(0, 8)}.html"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'PDF failed' }, { status: 500 })
  }
}