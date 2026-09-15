export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wcRes = await pool.query(
      `SELECT * FROM "WorkCenter" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )
    if (wcRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const wc = wcRes.rows[0]

    const woRes = await pool.query(
      `SELECT number, "productId", status, quantity, "completedQty", priority, "endDate", "createdAt"
       FROM "WorkOrder"
       WHERE "organizationId" = $1
         AND ("workCenterId" = $2 OR "workCenterId" = $3)
       ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId, params.id, wc.name]
    )
    const wos = woRes.rows

    const openWOs = wos.filter((w: any) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED')
    const totalOpenQty = openWOs.reduce((s: number, w: any) => s + (Number(w.quantity) - Number(w.completedQty || 0)), 0)
    const loadPct = wc.capacity > 0 ? Math.min(999, Math.round((totalOpenQty / Number(wc.capacity)) * 100)) : 0
    const efficiencyPct = Math.round(Number(wc.efficiency || 0) * 100)

    const woRows = wos.length > 0
      ? wos.map((w: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td style="font-family:'Courier New',monospace">${w.number}</td>
            <td>${w.productId || '—'}</td>
            <td>${w.status}</td>
            <td style="text-align:right">${w.quantity}</td>
            <td style="text-align:right">${w.completedQty || 0}</td>
            <td>${w.priority}</td>
            <td>${w.endDate ? new Date(w.endDate).toLocaleDateString('en-GB') : '—'}</td>
          </tr>`).join('')
      : '<tr><td colspan="8" style="text-align:center;color:#9ca3af">No work orders assigned</td></tr>'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Work Center ${wc.name}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #f59e0b; padding-bottom: 18px; margin-bottom: 24px; }
  .brand { font-size: 30px; font-weight: 800; color: #f59e0b; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 16px; color: #f59e0b; margin-top: 4px; font-weight: 700; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .meta-card { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fffbeb; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  .meta-value { font-size: 15px; font-weight: 700; margin-top: 4px; }
  .section-title { font-size: 14px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.6px; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #fef3c7; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #f59e0b; color: white; text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; }
  tbody td { padding: 9px 8px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #fffbeb; }
  .bar-wrap { background: #fef3c7; height: 24px; border-radius: 12px; overflow: hidden; margin: 8px 0; }
  .bar { background: linear-gradient(90deg, #f59e0b, #f97316); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 700; }
  .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
</style></head><body>

<div class="hdr">
  <div>
    <div class="brand">WaveCore ERP</div>
    <div class="brand-sub">Manufacturing · Work Center</div>
  </div>
  <div class="doc-title">
    <h1>WORK CENTER</h1>
    <div class="num">${wc.code || wc.name}</div>
  </div>
</div>

<div class="meta-grid">
  <div class="meta-card"><div class="meta-label">Name</div><div class="meta-value">${wc.name}</div></div>
  <div class="meta-card"><div class="meta-label">Code</div><div class="meta-value">${wc.code || '—'}</div></div>
  <div class="meta-card"><div class="meta-label">Capacity / Period</div><div class="meta-value">${wc.capacity || 0}</div></div>
  <div class="meta-card"><div class="meta-label">Efficiency</div><div class="meta-value">${efficiencyPct}%</div></div>
  <div class="meta-card"><div class="meta-label">Cost / Hour</div><div class="meta-value">${Number(wc.costPerHour || 0).toFixed(2)}</div></div>
  <div class="meta-card"><div class="meta-label">Created</div><div class="meta-value">${new Date(wc.createdAt).toLocaleDateString('en-GB')}</div></div>
</div>

${wc.description ? `<div style="font-size:12px;padding:10px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;margin-bottom:20px">${wc.description}</div>` : ''}

<div class="section-title">Current Load vs Capacity</div>
<div style="font-size:12px;color:#6b7280;margin-bottom:6px">${totalOpenQty} units queued · Capacity ${wc.capacity || 0}</div>
<div class="bar-wrap"><div class="bar" style="width:${Math.min(100, loadPct)}%">${loadPct}%</div></div>

<div class="section-title">Assigned Work Orders (${wos.length})</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Number</th><th>Product</th><th>Status</th>
      <th style="text-align:right">Qty</th>
      <th style="text-align:right">Completed</th>
      <th>Priority</th><th>Due</th>
    </tr>
  </thead>
  <tbody>${woRows}</tbody>
</table>

<div class="footer">
  <p>Generated by WaveCore ERP · ${new Date().toLocaleString('en-GB')}</p>
  <p>© ${new Date().getFullYear()} IntelliWavve</p>
</div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Center PDF error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}