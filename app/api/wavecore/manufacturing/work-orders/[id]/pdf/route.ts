export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const woRes = await pool.query(
      'SELECT * FROM "WorkOrder" WHERE id = $1 AND "organizationId" = $2',
      [params.id, session.organizationId]
    )
    if (woRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const wo = woRes.rows[0]

    const pct = wo.quantity > 0 ? Math.round((Number(wo.completedQty) / Number(wo.quantity)) * 100) : 0
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Work Order ${wo.number}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #7c3aed; padding-bottom: 18px; margin-bottom: 24px; }
  .brand { font-size: 30px; font-weight: 800; color: #7c3aed; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 16px; color: #7c3aed; margin-top: 4px; font-weight: 700; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .meta-card { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  .meta-value { font-size: 15px; font-weight: 700; margin-top: 4px; }
  .section-title { font-size: 14px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.6px; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #ede9fe; }
  .progress-wrap { background: #ede9fe; height: 22px; border-radius: 11px; overflow: hidden; margin-top: 6px; }
  .progress-bar { background: linear-gradient(90deg, #7c3aed, #a855f7); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; }
  .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
  .sign-box { border-top: 1.5px solid #111827; padding-top: 6px; font-size: 11px; color: #6b7280; }
  .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  .barcode { font-family: 'Courier New', monospace; font-size: 22px; letter-spacing: 3px; font-weight: 800; padding: 6px 0; }
</style></head><body>

<div class="hdr">
  <div>
    <div class="brand">WaveCore ERP</div>
    <div class="brand-sub">Manufacturing Execution System</div>
  </div>
  <div class="doc-title">
    <h1>WORK ORDER</h1>
    <div class="num">${wo.number}</div>
  </div>
</div>

<div class="meta-grid">
  <div class="meta-card"><div class="meta-label">Product</div><div class="meta-value">${wo.productId || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Type</div><div class="meta-value">${wo.type || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Priority</div><div class="meta-value">${wo.priority || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Work Center</div><div class="meta-value">${wo.workCenterId || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">BOM</div><div class="meta-value">${wo.bomId || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Status</div><div class="meta-value">${wo.status || '—'}</div></div>
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

${wo.notes ? `<div class="section-title">Notes</div><div style="font-size:12px;padding:10px;background:#f9fafb;border-left:3px solid #7c3aed;border-radius:4px">${wo.notes}</div>` : ''}

<div class="sign-grid">
  <div class="sign-box">Prepared By<br><br></div>
  <div class="sign-box">Approved By<br><br></div>
  <div class="sign-box">QC Inspector<br><br></div>
</div>

<div class="footer">
  <p>Generated by WaveCore ERP · ${new Date().toLocaleString('en-GB')}</p>
  <p>© ${new Date().getFullYear()} IntelliWavve</p>
</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}