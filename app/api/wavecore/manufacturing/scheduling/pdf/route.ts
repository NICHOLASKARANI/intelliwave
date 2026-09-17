export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load data directly (no internal fetch)
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
              priority, "startDate", "endDate", "createdAt"
       FROM "WorkOrder"
       WHERE "organizationId" = $1
         AND status NOT IN ('COMPLETED', 'CANCELLED')
       ORDER BY priority DESC, "endDate" ASC NULLS LAST, "createdAt" ASC`,
      [session.organizationId]
    )

    const priorityRank: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    const now = new Date()
    const scheduled = woRes.rows.map((wo: any, i: number) => {
      const wc = wcMap[wo.workCenterId] || null
      const capacity = Number(wc?.capacity || 0)
      const efficiency = Number(wc?.efficiency || 1)
      const remaining = Math.max(0, Number(wo.quantity) - Number(wo.completedQty || 0))
      const dailyThroughput = capacity > 0 ? capacity * (efficiency > 0 ? efficiency : 1) : 0
      const estimatedDays = dailyThroughput > 0 ? Math.max(1, Math.ceil(remaining / dailyThroughput)) : 1
      const startDate = wo.startDate ? new Date(wo.startDate) : new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + estimatedDays)
      let scheduleStatus = 'ON_TRACK'
      if (wo.endDate && endDate > new Date(wo.endDate)) scheduleStatus = 'AT_RISK'
      if (wo.endDate && now > new Date(wo.endDate)) scheduleStatus = 'DELAYED'
      if (!wc) scheduleStatus = 'NO_WC'
      return {
        number: wo.number,
        product: wo.productId,
        workCenterName: wc?.name || wo.workCenterId || 'Unassigned',
        workCenterKey: wo.workCenterId,
        priority: wo.priority,
        quantity: Number(wo.quantity),
        remaining,
        estimatedDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dueDate: wo.endDate,
        scheduleStatus,
        priorityRank: priorityRank[wo.priority] ?? 99,
        order: i,
      }
    })

    // Work center load
    const wcLoad: Record<string, { total: number; count: number; capacity: number }> = {}
    for (const s of scheduled) {
      const key = s.workCenterName || 'Unassigned'
      if (!wcLoad[key]) {
        const wc = wcMap[s.workCenterKey] || null
        wcLoad[key] = { total: 0, count: 0, capacity: Number(wc?.capacity || 0) }
      }
      wcLoad[key].total += s.remaining
      wcLoad[key].count += 1
    }
    const workCenterLoad = Object.entries(wcLoad).map(([name, v]) => ({
      name,
      count: v.count,
      totalQty: v.total,
      capacity: v.capacity,
      utilization: v.capacity > 0 ? Math.round((v.total / v.capacity) * 100) : 0,
    })).sort((a, b) => b.utilization - a.utilization)

    const summary = {
      total: scheduled.length,
      onTrack: scheduled.filter(s => s.scheduleStatus === 'ON_TRACK').length,
      atRisk: scheduled.filter(s => s.scheduleStatus === 'AT_RISK').length,
      delayed: scheduled.filter(s => s.scheduleStatus === 'DELAYED').length,
      noWc: scheduled.filter(s => s.scheduleStatus === 'NO_WC').length,
      totalDuration: scheduled.reduce((s, x) => s + x.estimatedDays, 0),
      avgLoad: workCenterLoad.length > 0 ? Math.round(workCenterLoad.reduce((s, w) => s + w.utilization, 0) / workCenterLoad.length) : 0,
      bottleneck: workCenterLoad[0]?.name || '—',
    }

    // Render HTML
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'
    const statusColor = (s: string) => s === 'ON_TRACK' ? '#16a34a' : s === 'AT_RISK' ? '#ca8a04' : s === 'DELAYED' ? '#dc2626' : '#6b7280'

    const rows = scheduled.map(s => `
      <tr>
        <td style="font-family:'Courier New',monospace;font-size:11px"><b>${s.number}</b></td>
        <td>${s.product || '—'}</td>
        <td>${s.workCenterName || '—'}</td>
        <td>${s.priority}</td>
        <td style="text-align:right">${s.quantity}</td>
        <td style="text-align:right">${s.remaining}</td>
        <td style="text-align:center">${fmtDate(s.startDate)}</td>
        <td style="text-align:center">${fmtDate(s.endDate)}</td>
        <td style="text-align:center">${s.estimatedDays}d</td>
        <td style="text-align:center"><span style="padding:3px 8px;border-radius:10px;background:${statusColor(s.scheduleStatus)}22;color:${statusColor(s.scheduleStatus)};font-size:9px;font-weight:700">${s.scheduleStatus.replace('_', ' ')}</span></td>
      </tr>`).join('')

    const wcRows = workCenterLoad.map(w => {
      const color = w.utilization > 90 ? '#dc2626' : w.utilization > 70 ? '#ca8a04' : '#16a34a'
      return `<tr><td><b>${w.name}</b></td><td style="text-align:right">${w.count}</td><td style="text-align:right">${w.totalQty}</td><td style="text-align:right">${w.capacity}</td><td style="text-align:right;font-weight:700;color:${color}">${w.utilization}%</td></tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Production Schedule</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #2563eb; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #2563eb; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #dbeafe; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #2563eb; color: white; text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; }
  tbody td { padding: 7px 6px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #eff6ff; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Manufacturing · Production Schedule</div></div>
  <div class="doc-title"><h1>PRODUCTION SCHEDULE</h1><div class="num">${new Date().toLocaleString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${summary.total}</div><div class="stat-label">Scheduled</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${summary.onTrack}</div><div class="stat-label">On Track</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${summary.atRisk}</div><div class="stat-label">At Risk</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${summary.delayed}</div><div class="stat-label">Delayed</div></div>
  <div class="stat"><div class="stat-num">${summary.avgLoad}%</div><div class="stat-label">Avg Load</div></div>
  <div class="stat"><div class="stat-num" style="font-size:11px;font-weight:700">${summary.bottleneck}</div><div class="stat-label">Bottleneck</div></div>
</div>

<div class="section-title">Work Center Utilization</div>
<table>
  <thead><tr><th>Work Center</th><th style="text-align:right">Open WOs</th><th style="text-align:right">Queued Qty</th><th style="text-align:right">Capacity</th><th style="text-align:right">Utilization</th></tr></thead>
  <tbody>${wcRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af">No work center data</td></tr>'}</tbody>
</table>

<div class="section-title">Schedule (${scheduled.length} work orders)</div>
<table>
  <thead><tr><th>Number</th><th>Product</th><th>Work Center</th><th>Priority</th><th style="text-align:right">Qty</th><th style="text-align:right">Remaining</th><th style="text-align:center">Start</th><th style="text-align:center">End</th><th style="text-align:center">Days</th><th style="text-align:center">Status</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="10" style="text-align:center;color:#9ca3af">No work orders to schedule</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Scheduling PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}