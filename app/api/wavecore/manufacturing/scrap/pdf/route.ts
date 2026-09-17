export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT * FROM "ScrapRecord" WHERE "organizationId" = $1 ORDER BY "scrapDate" DESC LIMIT 500`,
      [session.organizationId]
    )
    const records = res.rows.map(r => ({
      ...r,
      totalCost: Number(r.quantity || 0) * Number(r.unitCost || 0),
    }))

    const totalQty = records.reduce((s, r) => s + Number(r.quantity || 0), 0)
    const totalCost = records.reduce((s, r) => s + r.totalCost, 0)

    const reasonMap: Record<string, { count: number; qty: number; cost: number }> = {}
    for (const r of records) {
      const k = r.reason || 'OTHER'
      if (!reasonMap[k]) reasonMap[k] = { count: 0, qty: 0, cost: 0 }
      reasonMap[k].count += 1
      reasonMap[k].qty += Number(r.quantity || 0)
      reasonMap[k].cost += r.totalCost
    }
    const byReason = Object.entries(reasonMap).map(([reason, v]) => ({ reason, ...v })).sort((a, b) => b.cost - a.cost)

    const prodMap: Record<string, { count: number; qty: number; cost: number }> = {}
    for (const r of records) {
      const k = r.productName || 'Unknown'
      if (!prodMap[k]) prodMap[k] = { count: 0, qty: 0, cost: 0 }
      prodMap[k].count += 1
      prodMap[k].qty += Number(r.quantity || 0)
      prodMap[k].cost += r.totalCost
    }
    const byProduct = Object.entries(prodMap).map(([product, v]) => ({ product, ...v })).sort((a, b) => b.cost - a.cost).slice(0, 5)

    const reasonColor = (r: string) =>
      r === 'DEFECT' ? '#dc2626' : r === 'REWORK' ? '#ca8a04'
      : r === 'DAMAGE' ? '#ea580c' : r === 'EXPIRY' ? '#7c3aed'
      : '#6b7280'

    const reasonRows = byReason.map(r => `
      <tr>
        <td><span style="padding:2px 8px;border-radius:8px;background:${reasonColor(r.reason)}22;color:${reasonColor(r.reason)};font-size:9px;font-weight:700">${r.reason}</span></td>
        <td style="text-align:right">${r.count}</td>
        <td style="text-align:right">${r.qty.toFixed(1)}</td>
        <td style="text-align:right;font-weight:700">${Math.round(r.cost).toLocaleString()}</td>
      </tr>`).join('')

    const prodRows = byProduct.map(p => `
      <tr>
        <td><b>${p.product}</b></td>
        <td style="text-align:right">${p.count}</td>
        <td style="text-align:right">${p.qty.toFixed(1)}</td>
        <td style="text-align:right;font-weight:700;color:#dc2626">${Math.round(p.cost).toLocaleString()}</td>
      </tr>`).join('')

    const logRows = records.slice(0, 100).map(r => `
      <tr>
        <td style="font-size:9px">${r.scrapDate ? new Date(r.scrapDate).toLocaleDateString('en-GB') : '—'}</td>
        <td>${r.productName}</td>
        <td>${r.workOrderNumber || '—'}</td>
        <td style="text-align:center"><span style="padding:2px 6px;border-radius:6px;background:${reasonColor(r.reason)}22;color:${reasonColor(r.reason)};font-size:8px;font-weight:700">${r.reason}</span></td>
        <td style="text-align:right">${Number(r.quantity).toFixed(1)}</td>
        <td style="text-align:right">${Number(r.unitCost || 0).toFixed(2)}</td>
        <td style="text-align:right;font-weight:700">${r.totalCost.toFixed(2)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Scrap Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #dc2626; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #dc2626; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #dc2626; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #fee2e2; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #dc2626; color: white; text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; }
  tbody td { padding: 7px 6px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #fef2f2; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Manufacturing · Scrap & Rework Report</div></div>
  <div class="doc-title"><h1>SCRAP REPORT</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${records.length}</div><div class="stat-label">Total Events</div></div>
  <div class="stat"><div class="stat-num">${totalQty.toFixed(1)}</div><div class="stat-label">Total Qty</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${Math.round(totalCost).toLocaleString()}</div><div class="stat-label">Total Value</div></div>
  <div class="stat"><div class="stat-num">${records.length > 0 ? Math.round(totalCost / records.length).toLocaleString() : 0}</div><div class="stat-label">Avg / Event</div></div>
  <div class="stat"><div class="stat-num" style="font-size:11px;font-weight:700">${byReason[0]?.reason || '—'}</div><div class="stat-label">Top Reason</div></div>
</div>

<div class="grid-2">
  <div>
    <div class="section-title">By Reason</div>
    <table>
      <thead><tr><th>Reason</th><th style="text-align:right">Count</th><th style="text-align:right">Qty</th><th style="text-align:right">Value</th></tr></thead>
      <tbody>${reasonRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">No data</td></tr>'}</tbody>
    </table>
  </div>
  <div>
    <div class="section-title">Top Products</div>
    <table>
      <thead><tr><th>Product</th><th style="text-align:right">Count</th><th style="text-align:right">Qty</th><th style="text-align:right">Value</th></tr></thead>
      <tbody>${prodRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">No data</td></tr>'}</tbody>
    </table>
  </div>
</div>

<div class="section-title">Full Scrap Log (${Math.min(records.length, 100)} of ${records.length})</div>
<table>
  <thead><tr><th>Date</th><th>Product</th><th>Work Order</th><th style="text-align:center">Reason</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Cost</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${logRows || '<tr><td colspan="7" style="text-align:center;color:#9ca3af">No scrap records</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Scrap PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}