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

function fmtDate(d: any): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB') } catch { return '—' }
}

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const id = ctx.params.id
    const orgId = g.organizationId

    const cRes = await pool.query(
      `SELECT * FROM "SupplierContract" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (cRes.rowCount === 0) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    const c = cRes.rows[0]

    const [linesRes, msRes, supplierRes, orgRes] = await Promise.all([
      pool.query(
        `SELECT * FROM "SupplierContractLine"
         WHERE "contractId" = $1 AND "organizationId" = $2
         ORDER BY COALESCE("lineNumber", 9999) ASC`,
        [id, orgId]
      ),
      pool.query(
        `SELECT * FROM "SupplierContractMilestone"
         WHERE "contractId" = $1 AND "organizationId" = $2
         ORDER BY "dueDate" ASC NULLS LAST, "createdAt" ASC`,
        [id, orgId]
      ),
      c.supplierId
        ? pool.query(`SELECT * FROM "Supplier" WHERE id = $1`, [c.supplierId])
        : Promise.resolve({ rows: [] }),
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]),
    ])

    const supplier = supplierRes.rows[0] || {}
    const orgName = orgRes.rows[0]?.name || 'Organization'

    const linesHtml = linesRes.rows.map((l: any) => `
      <tr>
        <td class="num">${esc(l.lineNumber || '')}</td>
        <td>${esc(l.description)}</td>
        <td class="num">${esc(l.quantity)} ${esc(l.unitOfMeasure || '')}</td>
        <td class="num">${fmt(l.unitPrice)}</td>
        <td class="num">${fmt(l.taxRate || 0)}%</td>
        <td class="num bold">${fmt(l.lineTotal)}</td>
      </tr>
    `).join('')

    const msHtml = msRes.rows.map((m: any) => `
      <tr>
        <td>${esc(m.name)}</td>
        <td>${fmtDate(m.dueDate)}</td>
        <td class="num">${fmt(m.amount)}</td>
        <td>${esc(m.status)}</td>
        <td>${esc(m.notes || '')}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Contract ${esc(c.contractNumber)} — ${esc(orgName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;color:#111;background:#fff;font-size:13px}
  .actions{margin-bottom:20px;text-align:right}
  .actions button{padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:24px}
  .brand h1{margin:0 0 4px 0;font-size:26px;color:#2563eb}
  .brand .sub{color:#666;font-size:12px}
  .meta{text-align:right}
  .meta h2{margin:0 0 6px 0;font-size:22px;font-weight:800;letter-spacing:0.5px}
  .meta .field{font-size:12px;margin-bottom:3px}
  .meta .label{color:#888;text-transform:uppercase;font-size:9px;font-weight:700;letter-spacing:0.5px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
  .block h3{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#2563eb;margin:0 0 10px 0;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
  .block p{margin:3px 0}
  .block .muted{color:#888;font-size:11px}
  .stamp{margin-top:8px;display:inline-block;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:#e5e7eb;color:#374151}
  .stamp-ACTIVE{background:#d1fae5;color:#065f46}
  .stamp-DRAFT{background:#e5e7eb;color:#374151}
  .stamp-SUSPENDED{background:#fef3c7;color:#92400e}
  .stamp-EXPIRED{background:#ffedd5;color:#9a3412}
  .stamp-TERMINATED{background:#fee2e2;color:#991b1b}
  h2.section{font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#2563eb;margin:28px 0 10px 0;padding-bottom:6px;border-bottom:2px solid #e5e7eb}
  table{width:100%;border-collapse:collapse;font-size:11px}
  thead{background:#f9fafb}
  th{text-align:left;padding:10px 8px;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
  th.num{text-align:right}
  td{padding:10px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  td.bold{font-weight:700}
  .notes{margin-top:24px;padding:14px;background:#f9fafb;border-left:3px solid #2563eb;font-size:11px;white-space:pre-wrap}
  .signature{margin-top:30px;padding:16px;border:1px dashed #9ca3af;border-radius:8px;background:#f9fafb}
  .signature .row{display:flex;gap:24px;margin-top:12px}
  .signature .col{flex:1}
  .signature .line{border-bottom:1px solid #6b7280;height:40px;margin-bottom:4px}
  .signature .label{font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:700}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}
  @media print{.actions{display:none}body{padding:20px}}
</style>
</head>
<body>

<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>

<div class="header">
  <div class="brand">
    <h1>${esc(orgName)}</h1>
    <div class="sub">Supplier Contract</div>
  </div>
  <div class="meta">
    <h2>${esc(c.contractNumber)}</h2>
    <div class="field"><span class="label">Type:</span> ${esc(c.type)}</div>
    <div class="field"><span class="label">Currency:</span> ${esc(c.currency)}</div>
    <div class="field"><span class="label">Created:</span> ${fmtDate(c.createdAt)}</div>
  </div>
</div>

<div class="parties">
  <div class="block">
    <h3>Supplier</h3>
    <p><strong>${esc(supplier.name || c.supplierName || '—')}</strong></p>
    ${supplier.legalName ? '<p class="muted">' + esc(supplier.legalName) + '</p>' : ''}
    ${supplier.address ? '<p>' + esc(supplier.address) + '</p>' : ''}
    ${supplier.city ? '<p>' + esc(supplier.city) + (supplier.country ? ', ' + esc(supplier.country) : '') + '</p>' : ''}
    ${supplier.email ? '<p class="muted">' + esc(supplier.email) + '</p>' : ''}
    ${supplier.phone ? '<p class="muted">' + esc(supplier.phone) + '</p>' : ''}
    ${supplier.taxPin ? '<p class="muted">Tax PIN: ' + esc(supplier.taxPin) + '</p>' : ''}
  </div>
  <div class="block">
    <h3>Contract terms</h3>
    <p><strong>Start:</strong> ${fmtDate(c.startDate)}</p>
    <p><strong>End:</strong> ${fmtDate(c.endDate)}</p>
    <p><strong>Value:</strong> ${esc(c.currency)} ${fmt(c.value)}</p>
    <p><strong>Payment terms:</strong> ${esc(c.paymentTerms || 30)} days</p>
    <p><strong>Auto-renew:</strong> ${c.autoRenew ? 'Yes · ' + esc(c.renewalNoticeDays) + 'd notice' : 'No'}</p>
    <p style="margin-top:12px"><span class="stamp stamp-${esc(c.status)}">${esc(c.status)}</span></p>
  </div>
</div>

${linesHtml ? `
  <h2 class="section">Line items</h2>
  <table>
    <thead>
      <tr><th style="width:30px">#</th><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Tax</th><th class="num">Total</th></tr>
    </thead>
    <tbody>${linesHtml}</tbody>
  </table>
` : ''}

${msHtml ? `
  <h2 class="section">Milestones</h2>
  <table>
    <thead>
      <tr><th>Name</th><th>Due date</th><th class="num">Amount</th><th>Status</th><th>Notes</th></tr>
    </thead>
    <tbody>${msHtml}</tbody>
  </table>
` : ''}

${c.notes ? '<div class="notes">' + esc(c.notes) + '</div>' : ''}

<div class="signature">
  <p style="margin:0 0 8px 0;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#2563eb">Signatures</p>
  ${c.signedAt ? '<p style="margin:0;font-size:11px"><strong>Digitally signed</strong> by ' + esc(c.signedByName || '—') + ' on ' + new Date(c.signedAt).toLocaleString('en-GB') + '</p>' : ''}
  <div class="row">
    <div class="col">
      <div class="line"></div>
      <div class="label">Authorised signatory (Organization)</div>
    </div>
    <div class="col">
      <div class="line"></div>
      <div class="label">Authorised signatory (Supplier)</div>
    </div>
  </div>
</div>

<div class="footer">WaveCore ERP · Procurement · Confidential · Generated ${new Date().toLocaleString('en-GB')}</div>

</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[contract-export-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}