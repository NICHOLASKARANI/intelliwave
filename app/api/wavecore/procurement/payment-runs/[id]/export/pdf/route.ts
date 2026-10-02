export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement } from '@/lib/wavecore/procurement-guard'

function esc(s: any): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const fmt = (n: any) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtDateTime = (d: any) => d ? new Date(d).toLocaleString('en-GB') : '—'

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const id = ctx.params.id
    const orgId = g.organizationId

    const runRes = await pool.query(
      `SELECT * FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (runRes.rowCount === 0) return NextResponse.json({ error: 'Payment run not found' }, { status: 404 })
    const run = runRes.rows[0]

    const [linesRes, orgRes, bankRes] = await Promise.all([
      pool.query(
        `SELECT l.*, s.name AS "supplierNameFull", s."legalName" AS "supplierLegalName",
                s.address AS "supplierAddress", s.email AS "supplierEmail",
                s.phone AS "supplierPhone", s."taxPin" AS "supplierTaxPin"
         FROM "PaymentRunLine" l
         LEFT JOIN "Supplier" s ON s.id = l."supplierId"
         WHERE l."paymentRunId" = $1 AND l."organizationId" = $2
         ORDER BY COALESCE(l."lineNumber", 9999) ASC, l."createdAt" ASC`,
        [id, orgId]
      ),
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]),
      run.bankAccountId
        ? pool.query(
            `SELECT * FROM "BankAccount" WHERE id = $1 AND "organizationId" = $2`,
            [run.bankAccountId, orgId]
          )
        : Promise.resolve({ rows: [] }),
    ])

    const orgName = orgRes.rows[0]?.name || 'Organization'
    const bank = bankRes.rows[0] || {}

    let totalAmount = 0
    const linesHtml = linesRes.rows.map((l: any, i: number) => {
      const amt = Number(l.amount || 0)
      totalAmount += amt
      return `
        <tr>
          <td class="num">${i + 1}</td>
          <td>
            <strong>${esc(l.invoiceNumber || '—')}</strong>
            ${l.paymentReference ? '<br><span class="muted">ref ' + esc(l.paymentReference) + '</span>' : ''}
            ${l.status ? '<br><span class="status-pill">' + esc(l.status) + '</span>' : ''}
          </td>
          <td>
            <strong>${esc(l.supplierNameFull || l.supplierName || '—')}</strong>
            ${l.supplierLegalName && l.supplierLegalName !== l.supplierNameFull ? '<br><span class="muted">' + esc(l.supplierLegalName) + '</span>' : ''}
            ${l.supplierEmail ? '<br><span class="muted">' + esc(l.supplierEmail) + '</span>' : ''}
            ${l.supplierPhone ? '<br><span class="muted">' + esc(l.supplierPhone) + '</span>' : ''}
          </td>
          <td class="num muted">${esc(l.supplierTaxPin || '—')}</td>
          <td class="num bold">${esc(l.currency || run.currency)} ${fmt(amt)}</td>
        </tr>
      `
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Payment Run ${esc(run.runNumber)} — ${esc(orgName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;color:#111;background:#fff;font-size:13px}
  .actions{margin-bottom:20px;text-align:right}
  .actions button{padding:10px 20px;background:#059669;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #059669;padding-bottom:20px;margin-bottom:24px}
  .brand h1{margin:0 0 4px 0;font-size:26px;color:#059669}
  .brand .sub{color:#666;font-size:12px}
  .meta{text-align:right}
  .meta h2{margin:0 0 6px 0;font-size:22px;font-weight:800;letter-spacing:0.5px}
  .meta .field{font-size:12px;margin-bottom:3px}
  .meta .label{color:#888;text-transform:uppercase;font-size:9px;font-weight:700;letter-spacing:0.5px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
  .block h3{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#059669;margin:0 0 10px 0;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
  .block p{margin:3px 0}
  .block .muted{color:#888;font-size:11px}
  .stamp{margin-top:8px;display:inline-block;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:#e5e7eb;color:#374151}
  .stamp-DRAFT{background:#e5e7eb;color:#374151}
  .stamp-PENDING_APPROVAL{background:#fef3c7;color:#92400e}
  .stamp-APPROVED{background:#dbeafe;color:#1e40af}
  .stamp-EXECUTING{background:#cffafe;color:#155e75}
  .stamp-EXECUTED{background:#d1fae5;color:#065f46}
  .stamp-FAILED{background:#fee2e2;color:#991b1b}
  .stamp-CANCELLED{background:#f3f4f6;color:#6b7280}
  h2.section{font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#059669;margin:28px 0 10px 0;padding-bottom:6px;border-bottom:2px solid #e5e7eb}
  table{width:100%;border-collapse:collapse;font-size:11px}
  thead{background:#f9fafb}
  th{text-align:left;padding:10px 8px;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
  th.num{text-align:right}
  td{padding:10px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  td.bold{font-weight:700}
  .muted{color:#9ca3af;font-size:10px}
  .totals{margin-top:20px;margin-left:auto;width:280px}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}
  .totals .row.grand{border-top:2px solid #111;padding-top:10px;margin-top:6px;font-size:16px;font-weight:800}
  .status-pill{display:inline-block;padding:2px 8px;border-radius:9999px;background:#e5e7eb;color:#374151;font-size:9px;font-weight:700}
  .notes{margin-top:24px;padding:14px;background:#f9fafb;border-left:3px solid #059669;font-size:11px;white-space:pre-wrap}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}
  @media print{.actions{display:none}body{padding:20px}}
</style>
</head>
<body>

<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>

<div class="header">
  <div class="brand">
    <h1>${esc(orgName)}</h1>
    <div class="sub">Payment Run Advice</div>
  </div>
  <div class="meta">
    <h2>${esc(run.runNumber)}</h2>
    <div class="field"><span class="label">Method:</span> ${esc(run.method)}</div>
    <div class="field"><span class="label">Currency:</span> ${esc(run.currency)}</div>
    <div class="field"><span class="label">Payment date:</span> ${fmtDate(run.paymentDate)}</div>
    <div class="field"><span class="label">Cutoff:</span> ${fmtDate(run.cutoffDate)}</div>
  </div>
</div>

<div class="parties">
  <div class="block">
    <h3>Bank / Account</h3>
    ${bank.bankName ? '<p><strong>' + esc(bank.bankName) + '</strong></p>' : '<p class="muted">No bank account linked</p>'}
    ${bank.accountName ? '<p>' + esc(bank.accountName) + '</p>' : ''}
    ${bank.accountNumber ? '<p class="muted">Acct ' + esc(bank.accountNumber) + '</p>' : ''}
    ${bank.branch ? '<p class="muted">Branch ' + esc(bank.branch) + '</p>' : ''}
    ${bank.swift ? '<p class="muted">SWIFT ' + esc(bank.swift) + '</p>' : ''}
  </div>
  <div class="block">
    <h3>Run Status</h3>
    <p><span class="stamp stamp-${esc(run.status)}">${esc(run.status)}</span></p>
    <p><strong>${linesRes.rowCount}</strong> invoice${linesRes.rowCount === 1 ? '' : 's'} in this run</p>
    ${run.approvedByName ? '<p class="muted">Approved by ' + esc(run.approvedByName) + ' on ' + fmtDateTime(run.approvedAt) + '</p>' : ''}
    ${run.executedAt ? '<p class="muted">Executed ' + fmtDateTime(run.executedAt) + '</p>' : ''}
    ${run.failureReason ? '<p class="muted" style="color:#991b1b">Failure: ' + esc(run.failureReason) + '</p>' : ''}
  </div>
</div>

<h2 class="section">Payment Lines</h2>
<table>
  <thead>
    <tr>
      <th style="width:30px">#</th>
      <th>Invoice / Reference</th>
      <th>Supplier</th>
      <th class="num">Tax PIN</th>
      <th class="num">Amount</th>
    </tr>
  </thead>
  <tbody>${linesHtml || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:30px">No payment lines</td></tr>'}</tbody>
</table>

<div class="totals">
  <div class="row grand"><span>Total</span><span>${esc(run.currency)} ${fmt(totalAmount)}</span></div>
</div>

${run.notes ? '<div class="notes"><h3 style="margin:0 0 6px 0;font-size:10px;text-transform:uppercase;color:#059669">Notes</h3>' + esc(run.notes) + '</div>' : ''}

<div class="footer">WaveCore ERP · Procurement · Confidential · Generated ${new Date().toLocaleString('en-GB')}</div>

</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[payment-run-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}