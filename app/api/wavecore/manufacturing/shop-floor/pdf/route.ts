export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const wcRes = await pool.query(
      `SELECT id, name, code, capacity, efficiency FROM "WorkCenter" WHERE "organizationId" = $1`,
      [session.organizationId]
    )
    const wcMap: Record<string, any> = {}
    for (const wc of wcRes.rows) {
      wcMap[wc.id] = wc
      wcMap[wc.name] = wc
      if (wc.code) wcMap[wc.code] = wc
    }

    const woRes = await pool.query(
      `SELECT id, number, "productId", "workCenterId", status, quantity, "completedQty",
              priority, "startDate", "endDate", "updatedAt", "createdAt"
       FROM "WorkOrder"
       WHERE "organizationId" = $1
       ORDER BY "updatedAt" DESC NULLS LAST
       LIMIT 500`,
      [session.organizationId]
    )

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const enrich = (wo: any) => {
      const wc = wcMap[wo.workCenterId] || null
      const pct = Number(wo.quantity) > 0 ? Math.round((Number(wo.completedQty || 0) / Number(wo.quantity)) * 100) : 0
      const remaining = Math.max(0, Number(wo.quantity) - Number(wo.completedQty || 0))
      return {
        number: wo.number,
        product: wo.productId,
        workCenterName: wc?.name || wo.workCenterId || 'Unassigned',
        workCenterKey: wo.workCenterId,
        status: wo.status,
        priority: wo.priority,
        quantity: Number(wo.quantity),
        completedQty: Number(wo.completedQty || 0),
        remaining,
        pct,
        dueDate: wo.endDate,
        updatedAt: wo.updatedAt,
      }
    }

    const running = woRes.rows.filter(w => w.status === 'IN_PROGRESS').map(enrich)
    const queued = woRes.rows.filter(w => w.status === 'DRAFT' || w.status === 'RELEASED').map(enrich)
    const completedToday = woRes.rows.filter(w => w.status === 'COMPLETED' && w.updatedAt && new Date(w.updatedAt) >= todayStart).map(enrich)

    const workCenters = wcRes.rows.map(wc => {
      const activeWO = running.find(w => w.workCenterKey === wc.id || w.workCenterKey === wc.name)
      const queuedCount = queued.filter(w => w.workCenterKey === wc.id || w.workCenterKey === wc.name).length
      const openQty = [...running, ...queued]
        .filter(w => w.workCenterKey === wc.id || w.workCenterKey === wc.name)
        .reduce((s, w) => s + w.remaining, 0)
      const util = Number(wc.capacity) > 0 ? Math.min(999, Math.round((openQty / Number(wc.capacity)) * 100)) : 0
      return {
        name: wc.name,
        code: wc.code,
        activeWO: activeWO ? { number: activeWO.number, product: activeWO.product, pct: activeWO.pct } : null,
        queuedCount,
        utilization: util,
        status: activeWO ? 'RUNNING' : (queuedCount > 0 ? 'QUEUED' : 'IDLE'),
      }
    })

    const totalQty = woRes.rows.reduce((s, w) => s + Number(w.quantity || 0), 0)
    const completedQty = woRes.rows.reduce((s, w) => s + Number(w.completedQty || 0), 0)
    const completedTotal = woRes.rows.filter(w => w.status === 'COMPLETED').length
    const onTimeCompleted = woRes.rows
      .filter(w => w.status === 'COMPLETED')
      .filter(w => !w.endDate || new Date(w.updatedAt) <= new Date(w.endDate)).length
    const onTimePct = completedTotal > 0 ? Math.round((onTimeCompleted / completedTotal) * 100) : 100

    const summary = {
      total: woRes.rows.length,
      running: running.length,
      queued: queued.length,
      completedToday: completedToday.length,
      overdue: woRes.rows.filter(w => w.status !== 'COMPLETED' && w.endDate && new Date(w.endDate) < now).length,
      throughput: completedQty,
      onTimePct,
    }

    const fmtTime = (d: any) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
    const statusBadge = (s: string) => {
      const color = s === 'IN_PROGRESS' ? '#ca8a04' : s === 'COMPLETED' ? '#16a34a' : s === 'DRAFT' ? '#6b7280' : '#2563eb'
      return `<span style="padding:2px 8px;border-radius:8px;background:${color}22;color:${color};font-size:9px;font-weight:700">${s}</span>`
    }

    const runningRows = running.map(w => `
      <tr>
        <td style="font-family:'Courier New',monospace;font-size:11px"><b>${w.number}</b></td>
        <td>${w.product || '—'}</td>
        <td>${w.workCenterName}</td>
        <td style="text-align:center">${statusBadge(w.status)}</td>
        <td style="text-align:right">${w.completedQty}/${w.quantity}</td>
        <td style="text-align:center">${w.pct}%</td>
      </tr>`).join('')

    const queuedRows = queued.map(w => `
      <tr>
        <td style="font-family:'Courier New',monospace;font-size:11px"><b>${w.number}</b></td>
        <td>${w.product || '—'}</td>
        <td>${w.workCenterName}</td>
        <td>${w.priority}</td>
        <td style="text-align:right">${w.remaining}</td>
        <td style="text-align:center;font-size:10px">${w.dueDate ? new Date(w.dueDate).toLocaleDateString('en-GB') : '—'}</td>
      </tr>`).join('')

    const completedRows = completedToday.map(w => `
      <tr>
        <td style="font-family:'Courier New',monospace;font-size:11px"><b>${w.number}</b></td>
        <td>${w.product || '—'}</td>
        <td>${w.workCenterName}</td>
        <td style="text-align:right">${w.quantity}</td>
        <td style="text-align:center;font-size:10px">${fmtTime(w.updatedAt)}</td>
      </tr>`).join('')

    const wcRows = workCenters.map(w => {
      const color = w.utilization > 90 ? '#dc2626' : w.utilization > 70 ? '#ca8a04' : w.utilization > 0 ? '#16a34a' : '#6b7280'
      const statusText = w.status === 'RUNNING' ? 'RUNNING' : w.status === 'QUEUED' ? 'QUEUED' : 'IDLE'
      return `<tr>
        <td><b>${w.name}</b>${w.code ? ` <span style="color:#6b7280;font-size:10px">(${w.code})</span>` : ''}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${color}22;color:${color};font-size:9px;font-weight:700">${statusText}</span></td>
        <td style="text-align:center;font-size:10px">${w.activeWO ? w.activeWO.number : '—'}</td>
        <td style="text-align:right">${w.queuedCount}</td>
        <td style="text-align:right;font-weight:700;color:${color}">${w.utilization}%</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Shop Floor Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #059669; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #059669; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #d1fae5; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #059669; color: white; text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; }
  tbody td { padding: 7px 6px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #ecfdf5; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Manufacturing · Shop Floor Report</div></div>
  <div class="doc-title"><h1>SHOP FLOOR</h1><div class="num">${new Date().toLocaleString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${summary.total}</div><div class="stat-label">Total WOs</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${summary.running}</div><div class="stat-label">Running</div></div>
  <div class="stat"><div class="stat-num" style="color:#2563eb">${summary.queued}</div><div class="stat-label">Queued</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${summary.completedToday}</div><div class="stat-label">Today</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${summary.overdue}</div><div class="stat-label">Overdue</div></div>
  <div class="stat"><div class="stat-num">${summary.throughput}</div><div class="stat-label">Output</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${summary.onTimePct}%</div><div class="stat-label">On-Time</div></div>
</div>

<div class="section-title">Work Center Live Status</div>
<table>
  <thead><tr><th>Work Center</th><th style="text-align:center">Status</th><th style="text-align:center">Current WO</th><th style="text-align:right">Queued</th><th style="text-align:right">Utilization</th></tr></thead>
  <tbody>${wcRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af">No work centers</td></tr>'}</tbody>
</table>

<div class="section-title">Running Work Orders (${running.length})</div>
<table>
  <thead><tr><th>Number</th><th>Product</th><th>Work Center</th><th style="text-align:center">Status</th><th style="text-align:right">Done/Qty</th><th style="text-align:center">Progress</th></tr></thead>
  <tbody>${runningRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af">Nothing running</td></tr>'}</tbody>
</table>

<div class="section-title">Queued Work Orders (${queued.length})</div>
<table>
  <thead><tr><th>Number</th><th>Product</th><th>Work Center</th><th>Priority</th><th style="text-align:right">Remaining</th><th style="text-align:center">Due</th></tr></thead>
  <tbody>${queuedRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af">Nothing queued</td></tr>'}</tbody>
</table>

<div class="section-title">Completed Today (${completedToday.length})</div>
<table>
  <thead><tr><th>Number</th><th>Product</th><th>Work Center</th><th style="text-align:right">Qty</th><th style="text-align:center">Finished</th></tr></thead>
  <tbody>${completedRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af">Nothing completed today</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Shop Floor PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}