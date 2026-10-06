export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
function money(n: any): string {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function dateFmt(d: any): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB') } catch { return '—' }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const oRes = await pool.query(
      `SELECT o.*, c.name AS "customerName", c.email AS "customerEmail",
              c.phone AS "customerPhone", c.company AS "customerCompany",
              u.name AS "ownerName", u.email AS "ownerEmail"
       FROM "Opportunity" o
       LEFT JOIN "Customer" c ON c.id = o."customerId"
       LEFT JOIN "User" u ON u.id = o."assignedToId"
       WHERE o.id = $1 AND o."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (oRes.rowCount === 0) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    const opp = oRes.rows[0]

    const actsRes = await pool.query(
      `SELECT id, type, subject, description, "dueDate", completed, "createdAt"
       FROM "Activity" WHERE "opportunityId" = $1 AND "organizationId" = $2
       ORDER BY "createdAt" DESC LIMIT 50`,
      [params.id, session.organizationId]
    ).catch(() => ({ rows: [] as any[] }))
    const acts = actsRes.rows

    const actsHtml = acts.length === 0
      ? '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:16px;">No activities logged.</td></tr>'
      : acts.map((a: any) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${dateFmt(a.createdAt)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(a.type)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(a.subject)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${dateFmt(a.dueDate)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${a.completed ? 'Yes' : 'No'}</td>
          </tr>`).join('')

    const weighted = (Number(opp.amount || 0) * Number(opp.probability || 0)) / 100

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Opportunity — ${esc(opp.name)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 24px; }
    .company { font-size: 26px; font-weight: bold; color: #059669; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .doc-meta { text-align: right; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .card { background: #f9fafb; border-radius: 12px; padding: 18px; }
    .card h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
    .card p { margin: 2px 0; font-size: 14px; }
    .kpi { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .kpi > div { background: #ecfdf5; border-radius: 10px; padding: 14px; text-align: center; }
    .kpi .label { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
    .kpi .value { font-size: 20px; font-weight: bold; color: #059669; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
    .notes { background: #fffbeb; border-left: 4px solid #d97706; padding: 12px; border-radius: 6px; font-size: 13px; margin-top: 16px; white-space: pre-wrap; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">IntelliWavve</div>
      <div class="subtitle">Opportunity Details</div>
    </div>
    <div class="doc-meta">
      <p><strong>${esc(opp.name)}</strong></p>
      <p>Stage: <strong>${esc((opp.stage || '').replace('_', ' '))}</strong></p>
      <p>Created: ${dateFmt(opp.createdAt)}</p>
    </div>
  </div>

  <div class="kpi">
    <div><div class="label">Amount</div><div class="value">${money(opp.amount)}</div></div>
    <div><div class="label">Probability</div><div class="value">${esc(opp.probability || 0)}%</div></div>
    <div><div class="label">Weighted</div><div class="value">${money(weighted)}</div></div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Customer</h3>
      <p><strong>${esc(opp.customerName || '—')}</strong></p>
      ${opp.customerCompany ? `<p>${esc(opp.customerCompany)}</p>` : ''}
      ${opp.customerEmail ? `<p>${esc(opp.customerEmail)}</p>` : ''}
      ${opp.customerPhone ? `<p>${esc(opp.customerPhone)}</p>` : ''}
    </div>
    <div class="card">
      <h3>Ownership</h3>
      <p><strong>${esc(opp.ownerName || 'Unassigned')}</strong></p>
      ${opp.ownerEmail ? `<p>${esc(opp.ownerEmail)}</p>` : ''}
      <p style="margin-top:10px;">Expected close: <strong>${dateFmt(opp.expectedCloseDate)}</strong></p>
    </div>
  </div>

  ${opp.notes ? `<div class="notes"><strong>Notes:</strong><br>${esc(opp.notes)}</div>` : ''}

  <h3 style="margin-top:32px;font-size:13px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;">Activity history (${acts.length})</h3>
  <table>
    <thead>
      <tr>
        <th style="width:110px;">Logged</th>
        <th style="width:100px;">Type</th>
        <th>Subject</th>
        <th style="width:110px;">Due</th>
        <th style="width:90px;">Completed</th>
      </tr>
    </thead>
    <tbody>${actsHtml}</tbody>
  </table>

  <div class="footer">
    System-generated opportunity record from IntelliWavve ERP.<br>
    Generated ${new Date().toLocaleString('en-KE')}
  </div>

  <script>window.print();</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="opportunity-${opp.name || opp.id.substring(0, 8)}.html"`,
      },
    })
  } catch (error) {
    console.error('[opportunity pdf]', error)
    return NextResponse.json({ error: 'PDF failed: ' + (error as Error).message }, { status: 500 })
  }
}