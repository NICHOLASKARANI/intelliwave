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

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const id = ctx.params.id
    const orgId = g.organizationId

    const poRes = await pool.query(
      `SELECT * FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (poRes.rowCount === 0) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    const po = poRes.rows[0]

    const [linesRes, supplierRes, orgRes, reqRes] = await Promise.all([
      pool.query(
        `SELECT * FROM "PurchaseOrderItem"
         WHERE "purchaseOrderId" = $1
         ORDER BY COALESCE("lineNumber", 9999) ASC, "createdAt" ASC`,
        [id]
      ),
      po.supplierId
        ? pool.query(`SELECT * FROM "Supplier" WHERE id = $1`, [po.supplierId])
        : Promise.resolve({ rows: [] }),
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]),
      po.requisitionId
        ? pool.query(`SELECT "requisitionNumber", title FROM "PurchaseRequisition" WHERE id = $1`, [po.requisitionId])
        : Promise.resolve({ rows: [] }),
    ])

    const supplier = supplierRes.rows[0] || {}
    const orgName = orgRes.rows[0]?.name || 'Organization'
    const reqRow = reqRes.rows[0] || null

    const linesHtml = linesRes.rows.map((l: any) => `
      <tr>
        <td class="num">${esc(l.lineNumber || '')}</td>
        <td>
          <strong>${esc(l.description)}</strong>
          ${l.unitOfMeasure ? '<br><span class="muted">' + esc(l.unitOfMeasure) + '</span>' : ''}
          ${l.specifications ? '<br><span class="muted">' + esc(l.specifications) + '</span>' : ''}
        </td>
        <td class="num">${fmt(l.quantity)}</td>
        <td class="num">${fmt(l.unitPrice)}</td>
        <td class="num">${fmt(l.taxRate || 0)}%</td>
        <td class="num">${fmt(l.receivedQty || 0)}</td>
        <td class="num bold">${fmt(l.total)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PO ${esc(po.number)} — ${esc(orgName)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;color:#111;background:#fff;font-size:13px}
  .actions{margin-bottom:20px;text-align:right}
  .actions button{padding:10px 20px;background:#e11d48;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #e11d48;padding-bottom:20px;margin-bottom:24px}
  .brand{display:flex;flex-direction:column}
  .brand h1{margin:0 0 4px 0;font-size:26px;color:#e11d48}
  .brand .sub{color:#666;font-size:12px}
  .po-meta{text-align:right}
  .po-meta h2{margin:0 0 6px 0;font-size:22px;font-weight:800;letter-spacing:0.5px}
  .po-meta .field{font-size:12px;margin-bottom:3px}
  .po-meta .label{color:#888;text-transform:uppercase;font-size:9px;font-weight:700;letter-spacing:0.5px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
  .block h3{font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#e11d48;margin:0 0 10px 0;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
  .block p{margin:3px 0}
  .block .muted{color:#888;font-size:11px}
  table.items{width:100%;border-collapse:collapse;font-size:11px;margin-top:24px}
  table.items th{text-align:left;background:#f9fafb;padding:10px 8px;font-weight:700;text-transform:uppercase;font-size:9px;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
  table.items th.num{text-align:right}
  table.items td{padding:10px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  table.items td.num{text-align:right;font-variant-numeric:tabular-nums}
  table.items td.bold{font-weight:700}
  table.items .muted{color:#9ca3af;font-size:10px}
  .totals{margin-top:20px;margin-left:auto;width:280px}
  .totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}
  .totals .row.grand{border-top:2px solid #111;padding-top:10px;margin-top:6px;font-size:16px;font-weight:800}
  .notes{margin-top:24px;padding:14px;background:#f9fafb;border-left:3px solid #e11d48;font-size:11px}
  .notes h3{margin:0 0 6px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#e11d48}
  .stamp{margin-top:24px;display:inline-block;padding:6px 14px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
  .stamp-DRAFT{background:#e5e7eb;color:#374151}
  .stamp-SUBMITTED{background:#fef3c7;color:#92400e}
  .stamp-APPROVED{background:#d1fae5;color:#065f46}
  .stamp-SENT{background:#dbeafe;color:#1e40af}
  .stamp-ACKNOWLEDGED{background:#cffafe;color:#155e75}
  .stamp-CLOSED{background:#374151;color:#e5e7eb}
  .stamp-CANCELLED{background:#f3f4f6;color:#6b7280}
  .stamp-REJECTED{background:#fee2e2;color:#991b1b}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}
  @media print{.actions{display:none}body{padding:20px}}
</style>
</head>
<body>

<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>

<div class="header">
  <div class="brand">
    <h1>${esc(orgName)}</h1>
    <div class="sub">Purchase Order</div>
  </div>
  <div class="po-meta">
    <h2>${esc(po.number)}</h2>
    <div class="field"><span class="label">Date:</span> ${esc(po.date ? new Date(po.date).toLocaleDateString('en-GB') : '')}</div>
    <div class="field"><span class="label">Type:</span> ${esc(po.type)}</div>
    <div class="field"><span class="label">Currency:</span> ${esc(po.currency)}</div>
    ${po.paymentTerms ? '<div class="field"><span class="label">Terms:</span> ' + esc(po.paymentTerms) + ' days</div>' : ''}
    ${reqRow ? '<div class="field"><span class="label">From:</span> Req ' + esc(reqRow.requisitionNumber) + '</div>' : ''}
  </div>
</div>

<div class="parties">
  <div class="block">
    <h3>Supplier</h3>
    <p><strong>${esc(supplier.name || po.supplierName || '—')}</strong></p>
    ${supplier.legalName ? '<p class="muted">' + esc(supplier.legalName) + '</p>' : ''}
    ${supplier.address ? '<p>' + esc(supplier.address) + '</p>' : ''}
    ${supplier.city ? '<p>' + esc(supplier.city) + (supplier.country ? ', ' + esc(supplier.country) : '') + '</p>' : ''}
    ${supplier.email ? '<p class="muted">' + esc(supplier.email) + '</p>' : ''}
    ${supplier.phone ? '<p class="muted">' + esc(supplier.phone) + '</p>' : ''}
    ${supplier.taxPin ? '<p class="muted">Tax PIN: ' + esc(supplier.taxPin) + '</p>' : ''}
  </div>
  <div class="block">
    <h3>Delivery</h3>
    ${po.deliveryDate ? '<p><strong>Delivery Date:</strong> ' + esc(new Date(po.deliveryDate).toLocaleDateString('en-GB')) + '</p>' : '<p class="muted">No delivery date specified</p>'}
    ${po.deliveryLocation ? '<p><strong>Location:</strong> ' + esc(po.deliveryLocation) + '</p>' : ''}
    ${po.incoterms ? '<p><strong>Incoterms:</strong> ' + esc(po.incoterms) + '</p>' : ''}
    <p style="margin-top:12px"><span class="stamp stamp-${esc(po.status)}">${esc(po.status)}</span></p>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th style="width:30px">#</th>
      <th>Description</th>
      <th class="num">Qty</th>
      <th class="num">Unit Price</th>
      <th class="num">Tax</th>
      <th class="num">Received</th>
      <th class="num">Total</th>
    </tr>
  </thead>
  <tbody>${linesHtml || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:30px">No line items</td></tr>'}</tbody>
</table>

<div class="totals">
  <div class="row"><span>Subtotal</span><span>${esc(po.currency)} ${fmt(po.subtotal)}</span></div>
  <div class="row"><span>Tax</span><span>${esc(po.currency)} ${fmt(po.taxAmount)}</span></div>
  <div class="row grand"><span>Total</span><span>${esc(po.currency)} ${fmt(po.total || po.amount)}</span></div>
</div>

${po.notes ? '<div class="notes"><h3>Notes</h3>' + esc(po.notes) + '</div>' : ''}
${po.rejectionReason ? '<div class="notes" style="border-left-color:#dc2626;background:#fef2f2"><h3 style="color:#dc2626">Reason</h3>' + esc(po.rejectionReason) + '</div>' : ''}

<div class="footer">WaveCore ERP · Procurement · Confidential · Generated ${new Date().toLocaleString('en-GB')}</div>

</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[po-export-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}