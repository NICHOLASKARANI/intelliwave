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

    const reqRes = await pool.query(
      `SELECT * FROM "PurchaseRequisition" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (reqRes.rowCount === 0) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
    const r = reqRes.rows[0]

    const [linesRes, approvalsRes, orgRes, userRes] = await Promise.all([
      pool.query(
        `SELECT * FROM "PurchaseRequisitionLine"
         WHERE "requisitionId" = $1 AND "organizationId" = $2
         ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
        [id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT * FROM "PurchaseRequisitionApproval"
         WHERE "requisitionId" = $1 AND "organizationId" = $2
         ORDER BY "stepNumber" ASC NULLS LAST, "createdAt" ASC`,
        [id, orgId]
      ).catch(() => ({ rows: [] })),
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]),
      r.requestedBy
        ? pool.query(`SELECT name, email FROM "User" WHERE id = $1`, [r.requestedBy])
        : Promise.resolve({ rows: [] }),
    ])

    const orgName = orgRes.rows[0]?.name || 'Organization'
    const requester = userRes.rows[0] || {}

    const linesHtml = linesRes.rows.map((l: any) => `
      <tr>
        <td class="num">${esc(l.lineNumber || '')}</td>
        <td>
          <strong>${esc(l.description || l.itemDescription || '')}</strong>
          ${l.specifications ? '<br><span class="muted">' + esc(l.specifications) + '</span>' : ''}
          ${l.category ? '<br><span class="muted">Category: ' + esc(l.category) + '</span>' : ''}
        </td>
        <td class="num">${fmt(l.quantity)} ${esc(l.unitOfMeasure || '')}</td>
        <td class="num">${fmt(l.unitPrice)}</td>
        <td class="num">${fmt(l.taxRate || 0)}%</td>
        <td class="num bold">${fmt(l.lineTotal || l.total || 0)}</td>
      </tr>
    `).join('')

    const approvalsHtml = approvalsRes.rows.map((a: any) => `
      <tr>
        <td class="num">${esc(a.stepNumber || '')}</td>
        <td>${esc(a.approverRole || a.role || 'Approver')}${a.approverName ? ' · ' + esc(a.approverName) : ''}</td>
        <td>${esc(a.status || 'PENDING')}</td>
        <td>${fmtDate(a.decidedAt || a.createdAt)}</td>
        <td>${esc(a.comment || a.notes || '—')}</td>
      </tr>
    `).join('')

    const statusStamp = esc(r.status)
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Requisition ${esc(r.requisitionNumber)} — ${esc(orgName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;color:#111;background:#fff;font-size:13px}
  .actions{margin-bottom:20px;text-align:right}
  .actions button{padding:10px 20px;background:#10b981;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #10b981;padding-bottom:20px;margin-bottom:24px}
  .brand h1{margin:0 0 4px 0;font-size:26px;color:#10b981}
  .brand .sub{color:#666;font-size:12px}
  .meta{text-align:right}
  .meta h2{margin:0 0 6px 0;font-size:22px;font-weight:800;letter-spacing:0.5px}
  .meta .field{font-size:12px;margin-bottom:3px}
  .meta .label{color:#888;text-transform:uppercase;font-size:9px;font-weight:700;letter-spacing:0.5px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
  .block h3{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#10b981;margin:0 0 10px 0;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
  .block p{margin:3px 0}
  .block .muted{color:#888;font-size:11px}
  .stamp{margin-top:8px;display:inline-block;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:#e5e7eb;color:#374151}
  .stamp-DRAFT{background:#e5e7eb;color:#374151}
  .stamp-SUBMITTED{background:#fef3c7;color:#92400e}
  .stamp-APPROVED{background:#d1fae5;color:#065f46}
  .stamp-REJECTED{background:#fee2e2;color:#991b1b}
  .stamp-CONVERTED{background:#dbeafe;color:#1e40af}
  .stamp-CANCELLED{background:#f3f4f6;color:#6b7280}
  h2.section{font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#10b981;margin:28px 0 10px 0;padding-bottom:6px;border-bottom:2px solid #e5e7eb}
  table{width:100%;border-collapse:collapse;font-size:11px}
  thead{background:#f9fafb}
  th{text-align:left;padding:10px 8px;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
  th.num{text-align:right}
  td{padding:10px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  td.bold{font-weight:700}
  .totals{margin-top:20px;margin-left:auto;width:280px}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}
  .totals .row.grand{border-top:2px solid #111;padding-top:10px;margin-top:6px;font-size:16px;font-weight:800}
  .notes{margin-top:24px;padding:14px;background:#f9fafb;border-left:3px solid #10b981;font-size:11px;white-space:pre-wrap}
  .reason{margin-top:24px;padding:14px;background:#fef2f2;border-left:3px solid #dc2626;font-size:11px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}
  @media print{.actions{display:none}body{padding:20px}}
</style>
</head>
<body>

<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>

<div class="header">
  <div class="brand">
    <h1>${esc(orgName)}</h1>
    <div class="sub">Purchase Requisition</div>
  </div>
  <div class="meta">
    <h2>${esc(r.requisitionNumber)}</h2>
    <div class="field"><span class="label">Date:</span> ${fmtDate(r.createdAt)}</div>
    <div class="field"><span class="label">Priority:</span> ${esc(r.priority)}</div>
    <div class="field"><span class="label">Category:</span> ${esc(r.category)}</div>
    <div class="field"><span class="label">Currency:</span> ${esc(r.currency)}</div>
  </div>
</div>

<div class="parties">
  <div class="block">
    <h3>Requested by</h3>
    <p><strong>${esc(requester.name || r.requestedByName || '—')}</strong></p>
    ${requester.email ? '<p class="muted">' + esc(requester.email) + '</p>' : ''}
    ${r.departmentId ? '<p><strong>Department:</strong> ' + esc(r.departmentId) + '</p>' : ''}
    ${r.projectId ? '<p><strong>Project:</strong> ' + esc(r.projectId) + '</p>' : ''}
    ${r.costCenter ? '<p><strong>Cost center:</strong> ' + esc(r.costCenter) + '</p>' : ''}
    ${r.location ? '<p><strong>Location:</strong> ' + esc(r.location) + '</p>' : ''}
    ${r.type ? '<p><strong>Type:</strong> ' + esc(r.type) + '</p>' : ''}
  </div>
  <div class="block">
    <h3>Delivery & Timing</h3>
    <p><strong>Needed by:</strong> ${fmtDate(r.neededBy)}</p>
    ${r.isEmergency ? '<p><strong>Emergency:</strong> YES</p>' : ''}
    ${r.isRecurring ? '<p><strong>Recurring:</strong> YES</p>' : ''}
    <p style="margin-top:12px"><span class="stamp stamp-${statusStamp}">${statusStamp}</span></p>
  </div>
</div>

<h2 class="section">Items Requested</h2>
<table>
  <thead>
    <tr>
      <th style="width:30px">#</th>
      <th>Description</th>
      <th class="num">Qty</th>
      <th class="num">Unit Price</th>
      <th class="num">Tax</th>
      <th class="num">Total</th>
    </tr>
  </thead>
  <tbody>${linesHtml || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:30px">No line items</td></tr>'}</tbody>
</table>

<div class="totals">
  <div class="row"><span>Subtotal</span><span>${esc(r.currency)} ${fmt(r.subtotal)}</span></div>
  <div class="row"><span>Tax</span><span>${esc(r.currency)} ${fmt(r.taxAmount)}</span></div>
  <div class="row grand"><span>Total</span><span>${esc(r.currency)} ${fmt(r.totalAmount)}</span></div>
</div>

${approvalsRes.rows.length > 0 ? `
  <h2 class="section">Approval Trail</h2>
  <table>
    <thead>
      <tr><th style="width:40px">Step</th><th>Approver</th><th>Status</th><th>Decided</th><th>Comment</th></tr>
    </thead>
    <tbody>${approvalsHtml}</tbody>
  </table>
` : ''}

${r.notes ? '<h2 class="section">Notes</h2><div class="notes">' + esc(r.notes) + '</div>' : ''}
${r.rejectionReason ? '<div class="reason"><strong>Rejection reason:</strong><br>' + esc(r.rejectionReason) + '</div>' : ''}

<div class="footer">WaveCore ERP · Procurement · Confidential · Generated ${new Date().toLocaleString('en-GB')}</div>

</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[requisition-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}