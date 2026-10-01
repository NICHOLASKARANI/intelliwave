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

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const id = ctx.params.id
    const orgId = g.organizationId

    const invRes = await pool.query(
      `SELECT * FROM "SupplierInvoice" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (invRes.rowCount === 0) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    const inv = invRes.rows[0]

    const [linesRes, supplierRes, poRes, grnRes, orgRes] = await Promise.all([
      pool.query(
        `SELECT * FROM "SupplierInvoiceLine"
         WHERE "supplierInvoiceId" = $1 AND "organizationId" = $2
         ORDER BY COALESCE("lineNumber", 9999) ASC`,
        [id, orgId]
      ),
      inv.supplierId
        ? pool.query(
            `SELECT id, name, "legalName", address, city, country, email, phone, "taxPin" FROM "Supplier" WHERE id = $1`,
            [inv.supplierId]
          )
        : Promise.resolve({ rows: [] }),
      inv.purchaseOrderId
        ? pool.query(
            `SELECT id, number, status FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
            [inv.purchaseOrderId, orgId]
          )
        : Promise.resolve({ rows: [] }),
      inv.goodsReceiptId
        ? pool.query(
            `SELECT id, "grnNumber", status, "receivedAt" FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
            [inv.goodsReceiptId, orgId]
          )
        : Promise.resolve({ rows: [] }),
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]),
    ])

    const supplier = supplierRes.rows[0] || {}
    const po = poRes.rows[0] || {}
    const grn = grnRes.rows[0] || {}
    const orgName = orgRes.rows[0]?.name || 'Organization'

    const linesHtml = linesRes.rows.map((l: any) => {
      const matchStatus = l.matchStatus || 'UNMATCHED'
      const matchClass = matchStatus === 'MATCHED' ? 'status-matched' : matchStatus === 'EXCEPTION' ? 'status-exception' : matchStatus === 'PARTIAL' ? 'status-partial' : ''
      return `
        <tr>
          <td class="num">${esc(l.lineNumber || '')}</td>
          <td>
            <strong>${esc(l.description || '')}</strong>
            ${l.purchaseOrderItemId ? '<br><span class="muted">linked to PO line</span>' : ''}
            ${l.goodsReceiptLineId ? '<br><span class="muted">linked to GRN line</span>' : ''}
            ${l.matchNotes ? '<br><span class="muted">' + esc(l.matchNotes) + '</span>' : ''}
          </td>
          <td class="num">${fmt(l.quantity)}</td>
          <td class="num">${fmt(l.unitPrice)}</td>
          <td class="num">${fmt(l.taxRate || 0)}%</td>
          <td class="num bold">${fmt(l.lineTotal)}</td>
          <td class="center"><span class="match-pill ${matchClass}">${esc(matchStatus)}</span></td>
        </tr>
      `
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${esc(inv.invoiceNumber)} — ${esc(orgName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;color:#111;background:#fff;font-size:13px}
  .actions{margin-bottom:20px;text-align:right}
  .actions button{padding:10px 20px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #4f46e5;padding-bottom:20px;margin-bottom:24px}
  .brand h1{margin:0 0 4px 0;font-size:26px;color:#4f46e5}
  .brand .sub{color:#666;font-size:12px}
  .meta{text-align:right}
  .meta h2{margin:0 0 6px 0;font-size:22px;font-weight:800;letter-spacing:0.5px}
  .meta .field{font-size:12px;margin-bottom:3px}
  .meta .label{color:#888;text-transform:uppercase;font-size:9px;font-weight:700;letter-spacing:0.5px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
  .block h3{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#4f46e5;margin:0 0 10px 0;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
  .block p{margin:3px 0}
  .block .muted{color:#888;font-size:11px}
  .stamp{margin-top:8px;display:inline-block;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:#e5e7eb;color:#374151}
  .stamp-DRAFT{background:#e5e7eb;color:#374151}
  .stamp-SUBMITTED{background:#fef3c7;color:#92400e}
  .stamp-MATCHED{background:#d1fae5;color:#065f46}
  .stamp-PARTIAL_MATCH{background:#ffedd5;color:#9a3412}
  .stamp-MISMATCH{background:#fee2e2;color:#991b1b}
  .stamp-APPROVED{background:#d1fae5;color:#065f46}
  .stamp-REJECTED{background:#fee2e2;color:#991b1b}
  .stamp-PAID{background:#e9d5ff;color:#6b21a8}
  .stamp-CANCELLED{background:#f3f4f6;color:#6b7280}
  h2.section{font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#4f46e5;margin:28px 0 10px 0;padding-bottom:6px;border-bottom:2px solid #e5e7eb}
  table{width:100%;border-collapse:collapse;font-size:11px}
  thead{background:#f9fafb}
  th{text-align:left;padding:10px 8px;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
  th.num{text-align:right}
  th.center{text-align:center}
  td{padding:10px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  td.bold{font-weight:700}
  td.center{text-align:center}
  .muted{color:#9ca3af;font-size:10px}
  .totals{margin-top:20px;margin-left:auto;width:280px}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}
  .totals .row.grand{border-top:2px solid #111;padding-top:10px;margin-top:6px;font-size:16px;font-weight:800}
  .match-pill{display:inline-block;padding:3px 10px;border-radius:9999px;font-size:10px;font-weight:700}
  .status-matched{background:#d1fae5;color:#065f46}
  .status-exception{background:#fee2e2;color:#991b1b}
  .status-partial{background:#ffedd5;color:#9a3412}
  .notes{margin-top:24px;padding:14px;background:#f9fafb;border-left:3px solid #4f46e5;font-size:11px;white-space:pre-wrap}
  .match-summary{margin-top:24px;padding:14px;background:#eef2ff;border-left:3px solid #4f46e5;font-size:11px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}
  @media print{.actions{display:none}body{padding:20px}}
</style>
</head>
<body>

<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>

<div class="header">
  <div class="brand">
    <h1>${esc(orgName)}</h1>
    <div class="sub">Supplier Invoice</div>
  </div>
  <div class="meta">
    <h2>${esc(inv.invoiceNumber)}</h2>
    ${inv.supplierInvoiceRef ? '<div class="field"><span class="label">Supplier ref:</span> ' + esc(inv.supplierInvoiceRef) + '</div>' : ''}
    <div class="field"><span class="label">Invoice date:</span> ${fmtDate(inv.invoiceDate)}</div>
    ${inv.dueDate ? '<div class="field"><span class="label">Due date:</span> ' + fmtDate(inv.dueDate) + '</div>' : ''}
    <div class="field"><span class="label">Currency:</span> ${esc(inv.currency)}</div>
  </div>
</div>

<div class="parties">
  <div class="block">
    <h3>Supplier</h3>
    <p><strong>${esc(supplier.name || inv.supplierName || '—')}</strong></p>
    ${supplier.legalName ? '<p class="muted">' + esc(supplier.legalName) + '</p>' : ''}
    ${supplier.address ? '<p>' + esc(supplier.address) + '</p>' : ''}
    ${supplier.city ? '<p>' + esc(supplier.city) + (supplier.country ? ', ' + esc(supplier.country) : '') + '</p>' : ''}
    ${supplier.email ? '<p class="muted">' + esc(supplier.email) + '</p>' : ''}
    ${supplier.phone ? '<p class="muted">' + esc(supplier.phone) + '</p>' : ''}
    ${supplier.taxPin ? '<p class="muted">Tax PIN: ' + esc(supplier.taxPin) + '</p>' : ''}
  </div>
  <div class="block">
    <h3>References</h3>
    ${po.number ? '<p><strong>Purchase Order:</strong> ' + esc(po.number) + ' (' + esc(po.status) + ')</p>' : ''}
    ${grn.grnNumber ? '<p><strong>Goods Receipt:</strong> ' + esc(grn.grnNumber) + '</p>' : ''}
    <p><strong>Match status:</strong> ${esc(inv.matchStatus || 'UNMATCHED')}</p>
    <p style="margin-top:12px"><span class="stamp stamp-${esc(inv.status)}">${esc(inv.status)}</span></p>
  </div>
</div>

<h2 class="section">Invoice Lines</h2>
<table>
  <thead>
    <tr>
      <th style="width:30px">#</th>
      <th>Description</th>
      <th class="num">Qty</th>
      <th class="num">Unit Price</th>
      <th class="num">Tax</th>
      <th class="num">Line Total</th>
      <th class="center">Match</th>
    </tr>
  </thead>
  <tbody>${linesHtml || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:30px">No line items</td></tr>'}</tbody>
</table>

<div class="totals">
  <div class="row"><span>Subtotal</span><span>${esc(inv.currency)} ${fmt(inv.subtotal)}</span></div>
  <div class="row"><span>Tax</span><span>${esc(inv.currency)} ${fmt(inv.taxAmount)}</span></div>
  <div class="row grand"><span>Total</span><span>${esc(inv.currency)} ${fmt(inv.total)}</span></div>
</div>

${inv.matchNotes ? '<div class="match-summary"><strong>Match summary:</strong> ' + esc(inv.matchNotes) + '</div>' : ''}

${inv.notes ? '<div class="notes"><h3 style="margin:0 0 6px 0;font-size:10px;text-transform:uppercase;color:#4f46e5">Notes</h3>' + esc(inv.notes) + '</div>' : ''}

${inv.approvedByName ? '<p style="margin-top:24px;font-size:11px;color:#6b7280">Approved by ' + esc(inv.approvedByName) + ' on ' + fmtDate(inv.approvedAt) + '</p>' : ''}
${inv.paidAt ? '<p style="margin-top:4px;font-size:11px;color:#6b7280">Paid on ' + fmtDate(inv.paidAt) + (inv.paymentReference ? ' (ref: ' + esc(inv.paymentReference) + ')' : '') + '</p>' : ''}

<div class="footer">WaveCore ERP · Procurement · Confidential · Generated ${new Date().toLocaleString('en-GB')}</div>

</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[invoice-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}