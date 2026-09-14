export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const woRes = await pool.query(
      `SELECT wo.*, p.name AS "productName", p.sku AS "productSku",
              wc.name AS "workCenterName", wc.code AS "workCenterCode", b.name AS "bomName"
       FROM "WorkOrder" wo
       LEFT JOIN "Product" p ON p.id = wo."productId"
       LEFT JOIN "WorkCenter" wc ON wc.id = wo."workCenterId"
       LEFT JOIN "BillOfMaterial" b ON b.id = wo."bomId"
       WHERE wo.id = $1 AND wo."organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (woRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const wo = woRes.rows[0]

    let components: any[] = []
    if (wo.bomId) {
      const c = await pool.query(
        `SELECT bc.quantity, bc.unit, bc.scrapRate, bc.operation,
                p.name AS "componentName", p.sku AS "componentSku"
         FROM "BOMComponent" bc
         LEFT JOIN "Product" p ON p.id = bc."productId"
         WHERE bc."bomId" = $1`,
        [wo.bomId]
      )
      components = c.rows
    }

    const pct = wo.quantity > 0 ? Math.round((Number(wo.completedQty) / Number(wo.quantity)) * 100) : 0
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    const componentsRows = components.length > 0
      ? components.map((c, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${c.componentSku || '—'}</td>
            <td>${c.componentName || '—'}</td>
            <td>${c.operation || '—'}</td>
            <td style="text-align:right">${Number(c.quantity).toFixed(2)} ${c.unit || ''}</td>
            <td style="text-align:right">${c.scrapRate ? Number(c.scrapRate).toFixed(1) + '%' : '0%'}</td>
          </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:#9ca3af">No BOM components attached</td></tr>'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Work Order ${wo.number}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; padding: 0; }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #7c3aed; padding-bottom: 18px; margin-bottom: 24px; }
  .brand { font-size: 30px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 22px; margin: 0; color: #111827; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 16px; color: #7c3aed; margin-top: 4px; font-weight: 700; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .meta-card { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  .meta-value { font-size: 15px; font-weight: 700; color: #111827; margin-top: 4px; }
  .section-title { font-size: 14px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.6px; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #ede9fe; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #7c3aed; color: white; text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
  tbody td { padding: 9px 8px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #faf5ff; }
  .progress-wrap { background: #ede9fe; height: 22px; border-radius: 11px; overflow: hidden; margin-top: 6px; }
  .progress-bar { background: linear-gradient(90deg, #7c3aed, #a855f7); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; }
  .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
  .sign-box { border-top: 1.5px solid #111827; padding-top: 6px; font-size: 11px; color: #6b7280; }
  .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  .barcode { font-family: 'Courier New', monospace; font-size: 22px; letter-spacing: 3px; font-weight: 800; color: #111827; padding: 6px 0; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
  .badge-draft { background: #fef3c7; color: #92400e; }
  .badge-released { background: #dbeafe; color: #1e40af; }
  .badge-inprogress { background: #fef9c3; color: #854d0e; }
  .badge-completed { background: #dcfce7; color: #166534; }
  .badge-cancelled { background: #fee2e2; color: #991b1b; }
</style></head><body>

<div class="hdr">
  <div>
    <div class="brand">WaveCore ERP</div>
    <div class="brand-sub">Manufacturing Execution System</div>
  </div>
  <div class="doc-title">
    <h1>WORK ORDER</h1>
    <div class="num">${wo.number}</div>
    <div style="margin-top:8px"><span class="badge badge-${(wo.status || 'draft').toLowerCase().replace('_', '')}">${wo.status || 'DRAFT'}</span></div>
  </div>
</div>

<div class="meta-grid">
  <div class="meta-card"><div class="meta-label">Product</div><div class="meta-value">${wo.productName || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">SKU</div><div class="meta-value">${wo.productSku || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Type</div><div class="meta-value">${wo.type || 'MANUFACTURING'}</div></div>
  <div class="meta-card"><div class="meta-label">Priority</div><div class="meta-value">${wo.priority || 'MEDIUM'}</div></div>
  <div class="meta-card"><div class="meta-label">Work Center</div><div class="meta-value">${wo.workCenterName || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">BOM</div><div class="meta-value">${wo.bomName || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Start Date</div><div class="meta-value">${fmtDate(wo.startDate)}</div></div>
  <div class="meta-card"><div class="meta-label">Due Date</div><div class="meta-value">${fmtDate(wo.endDate)}</div></div>
  <div class="meta-card"><div class="meta-label">Created</div><div class="meta-value">${fmtDate(wo.createdAt)}</div></div>
</div>

<div class="section-title">Production Progress</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center">
  <div>
    <div style="font-size:12px;color:#6b7280">Completed <b>${wo.completedQty || 0}</b> of <b>${wo.quantity}</b> units</div>
    <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%">${pct}%</div></div>
  </div>
  <div style="text-align:right">
    <div class="barcode">*${wo.number}*</div>
    <div style="font-size:10px;color:#9ca3af;letter-spacing:1px">SCAN FOR TRACKING</div>
  </div>
</div>

<div class="section-title">Bill of Materials</div>
<table>
  <thead><tr><th>#</th><th>SKU</th><th>Component</th><th>Operation</th><th style="text-align:right">Qty</th><th style="text-align:right">Scrap %</th></tr></thead>
  <tbody>${componentsRows}</tbody>
</table>

${wo.notes ? `<div class="section-title">Notes</div><div style="font-size:12px;color:#374151;padding:10px;background:#f9fafb;border-left:3px solid #7c3aed;border-radius:4px">${wo.notes}</div>` : ''}

<div class="sign-grid">
  <div class="sign-box">Prepared By<br><br></div>
  <div class="sign-box">Approved By<br><br></div>
  <div class="sign-box">QC Inspector<br><br></div>
</div>

<div class="footer">
  <p>Generated by WaveCore ERP · ${new Date().toLocaleString('en-GB')} · Page 1 of 1</p>
  <p>This is a system-generated document. © ${new Date().getFullYear()} IntelliWavve</p>
</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('PDF error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}