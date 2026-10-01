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
const fmtNum = (n: any) => Number(n || 0).toLocaleString()

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const id = ctx.params.id
    const orgId = g.organizationId

    const grnRes = await pool.query(
      `SELECT * FROM "GoodsReceipt" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (grnRes.rowCount === 0) return NextResponse.json({ error: 'Goods receipt not found' }, { status: 404 })
    const grn = grnRes.rows[0]

    const [linesRes, poRes, supplierRes, orgRes] = await Promise.all([
      pool.query(
        `SELECT * FROM "GoodsReceiptLine"
         WHERE "goodsReceiptId" = $1 AND "organizationId" = $2
         ORDER BY COALESCE("lineNumber", 9999) ASC`,
        [id, orgId]
      ),
      grn.purchaseOrderId
        ? pool.query(
            `SELECT id, number, status, "supplierName", "supplierId", currency, "deliveryDate"
             FROM "PurchaseOrder" WHERE id = $1 AND "organizationId" = $2`,
            [grn.purchaseOrderId, orgId]
          )
        : Promise.resolve({ rows: [] }),
      pool.query(
        `SELECT s.name, s."legalName", s.address, s.city, s.country, s.email, s.phone, s."taxPin"
         FROM "Supplier" s
         WHERE s.id = (
           SELECT "supplierId" FROM "PurchaseOrder" WHERE id = $1
         ) LIMIT 1`,
        [grn.purchaseOrderId]
      ).catch(() => ({ rows: [] })),
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]),
    ])

    const po = poRes.rows[0] || {}
    const supplier = supplierRes.rows[0] || {}
    const orgName = orgRes.rows[0]?.name || 'Organization'

    const linesHtml = linesRes.rows.map((l: any) => {
      const accepted = Math.max(0, Number(l.receivedQty || 0) - Number(l.rejectedQty || 0) - Number(l.damagedQty || 0))
      return `
        <tr>
          <td class="num">${esc(l.lineNumber || '')}</td>
          <td>
            <strong>${esc(l.description || '')}</strong>
            ${l.unitOfMeasure ? '<br><span class="muted">' + esc(l.unitOfMeasure) + '</span>' : ''}
            ${l.batchNumber ? '<br><span class="muted">Batch ' + esc(l.batchNumber) + '</span>' : ''}
          </td>
          <td class="num">${fmtNum(l.orderedQty)}</td>
          <td class="num">${fmtNum(l.receivedQty)}</td>
          <td class="num">${fmtNum(l.rejectedQty)}</td>
          <td class="num">${fmtNum(l.damagedQty)}</td>
          <td class="num bold">${fmtNum(accepted)}</td>
          <td class="num">${fmt(l.unitPrice)}</td>
          <td class="num bold">${fmt(l.lineTotal)}</td>
        </tr>
      `
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GRN ${esc(grn.grnNumber)} — ${esc(orgName)}</title>
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
  .stamp-SUBMITTED{background:#dbeafe;color:#1e40af}
  .stamp-INSPECTED{background:#fef3c7;color:#92400e}
  .stamp-ACCEPTED{background:#d1fae5;color:#065f46}
  .stamp-REJECTED{background:#fee2e2;color:#991b1b}
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
  .variance{margin-top:24px;padding:14px;background:#fef3c7;border-left:3px solid #d97706;font-size:11px}
  .notes{margin-top:24px;padding:14px;background:#f9fafb;border-left:3px solid #10b981;font-size:11px;white-space:pre-wrap}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}
  @media print{.actions{display:none}body{padding:20px}}
</style>
</head>
<body>

<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>

<div class="header">
  <div class="brand">
    <h1>${esc(orgName)}</h1>
    <div class="sub">Goods Receipt Note</div>
  </div>
  <div class="meta">
    <h2>${esc(grn.grnNumber)}</h2>
    <div class="field"><span class="label">Received:</span> ${fmtDate(grn.receivedAt)}</div>
    ${grn.receivedByName ? '<div class="field"><span class="label">Received by:</span> ' + esc(grn.receivedByName) + '</div>' : ''}
    ${po.number ? '<div class="field"><span class="label">Against PO:</span> ' + esc(po.number) + '</div>' : ''}
    <div class="field"><span class="label">Currency:</span> ${esc(grn.currency)}</div>
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
    <h3>Delivery Details</h3>
    ${grn.deliveryNoteNumber ? '<p><strong>Delivery note:</strong> ' + esc(grn.deliveryNoteNumber) + '</p>' : ''}
    ${grn.vehicleNumber ? '<p><strong>Vehicle:</strong> ' + esc(grn.vehicleNumber) + '</p>' : ''}
    ${grn.driverName ? '<p><strong>Driver:</strong> ' + esc(grn.driverName) + '</p>' : ''}
    ${grn.warehouseId ? '<p><strong>Warehouse:</strong> ' + esc(grn.warehouseId) + '</p>' : ''}
    ${grn.locationId ? '<p><strong>Location:</strong> ' + esc(grn.locationId) + '</p>' : ''}
    <p style="margin-top:12px"><span class="stamp stamp-${esc(grn.status)}">${esc(grn.status)}</span></p>
  </div>
</div>

<h2 class="section">Received Items</h2>
<table>
  <thead>
    <tr>
      <th style="width:30px">#</th>
      <th>Description</th>
      <th class="num">Ordered</th>
      <th class="num">Received</th>
      <th class="num">Rejected</th>
      <th class="num">Damaged</th>
      <th class="num">Accepted</th>
      <th class="num">Unit Price</th>
      <th class="num">Line Total</th>
    </tr>
  </thead>
  <tbody>${linesHtml || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:30px">No line items</td></tr>'}</tbody>
</table>

<div class="totals">
  <div class="row grand"><span>Total Received</span><span>${esc(grn.currency)} ${fmt(grn.totalReceived)}</span></div>
</div>

${grn.hasVariance ? '<div class="variance"><strong>⚠ Variance detected:</strong> One or more lines exceeded the ordered quantity.</div>' : ''}

${grn.notes ? '<div class="notes"><h3 style="margin:0 0 6px 0;font-size:10px;text-transform:uppercase;color:#10b981">Notes</h3>' + esc(grn.notes) + '</div>' : ''}

<div class="footer">WaveCore ERP · Procurement · Confidential · Generated ${new Date().toLocaleString('en-GB')}</div>

</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[grn-pdf]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}