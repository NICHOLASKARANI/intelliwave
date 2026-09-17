export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const horizon = 14

    const wcRes = await pool.query(
      `SELECT id, name, code, capacity, efficiency FROM "WorkCenter" WHERE "organizationId" = $1 ORDER BY name ASC`,
      [session.organizationId]
    )

    const woRes = await pool.query(
      `SELECT id, number, "productId", "workCenterId", status, quantity, "completedQty", "startDate", "endDate"
       FROM "WorkOrder"
       WHERE "organizationId" = $1 AND status NOT IN ('COMPLETED', 'CANCELLED')`,
      [session.organizationId]
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates: Date[] = []
    for (let i = 0; i < horizon; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }

    const workCenters = wcRes.rows.map(wc => {
      const capPerDay = Number(wc.capacity || 0) * (Number(wc.efficiency) || 1)
      const assignedWOs = woRes.rows.filter(w =>
        w.workCenterId === wc.id || w.workCenterId === wc.name || w.workCenterId === wc.code
      )
      const queue = assignedWOs.reduce((s, w) => s + Math.max(0, Number(w.quantity) - Number(w.completedQty || 0)), 0)

      const daily: { pct: number; date: string }[] = []
      for (const d of dates) {
        let load = 0
        for (const w of assignedWOs) {
          const remaining = Math.max(0, Number(w.quantity) - Number(w.completedQty || 0))
          if (remaining === 0) continue
          const start = w.startDate ? new Date(w.startDate) : today
          const end = w.endDate ? new Date(w.endDate) : (() => { const e = new Date(start); e.setDate(e.getDate() + 7); return e })()
          start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999)
          if (d < start || d > end) continue
          const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          load += remaining / totalDays
        }
        const pct = capPerDay > 0 ? Math.round((load / capPerDay) * 100) : 0
        daily.push({ date: d.toISOString().slice(0, 10), pct })
      }

      const totalLoad = daily.reduce((s, d) => s + d.pct * capPerDay / 100, 0)
      const totalCapacity = daily.reduce((s, _) => s + capPerDay, 0)
      const utilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0
      const peakPct = daily.length > 0 ? Math.max(...daily.map(d => d.pct)) : 0
      let status = 'OK'
      if (capPerDay === 0) status = 'NO_CAPACITY'
      else if (peakPct > 100) status = 'OVERLOADED'
      else if (peakPct >= 70) status = 'HIGH'
      else if (utilization === 0) status = 'IDLE'
      else if (utilization < 30) status = 'UNDERUTILIZED'

      return { name: wc.name, code: wc.code, capacity: capPerDay, queue, utilization, peakPct, status, daily }
    })

    const totalCapacity = workCenters.reduce((s, w) => s + w.capacity * horizon, 0)
    const totalLoad = workCenters.reduce((s, w) => s + (w.utilization / 100) * w.capacity * horizon, 0)
    const overallUtil = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0
    const overloaded = workCenters.filter(w => w.status === 'OVERLOADED').length
    const underutil = workCenters.filter(w => w.status === 'UNDERUTILIZED' || w.status === 'IDLE').length
    const bottleneck = workCenters.slice().sort((a, b) => b.peakPct - a.peakPct)[0] || null

    const statusColor = (s: string) =>
      s === 'OVERLOADED' ? '#dc2626' : s === 'HIGH' ? '#ca8a04'
      : s === 'UNDERUTILIZED' ? '#2563eb' : s === 'IDLE' ? '#6b7280'
      : s === 'NO_CAPACITY' ? '#7c3aed' : '#16a34a'

    const heatCell = (pct: number) => {
      if (pct === 0) return { bg: '#f3f4f6', fg: '#9ca3af' }
      if (pct > 100) return { bg: '#dc2626', fg: '#ffffff' }
      if (pct >= 70) return { bg: '#f59e0b', fg: '#ffffff' }
      if (pct >= 30) return { bg: '#10b981', fg: '#ffffff' }
      return { bg: '#d1fae5', fg: '#065f46' }
    }

    const wcRows = workCenters.map(w => {
      const color = statusColor(w.status)
      const dayCells = w.daily.map(d => {
        const c = heatCell(d.pct)
        return `<td style="text-align:center;background:${c.bg};color:${c.fg};font-size:9px;font-weight:700;padding:6px 2px">${d.pct}</td>`
      }).join('')
      return `
        <tr>
          <td><b>${w.name}</b>${w.code ? ` <span style="color:#6b7280;font-size:9px">(${w.code})</span>` : ''}</td>
          <td style="text-align:right">${w.capacity.toFixed(0)}</td>
          <td style="text-align:right">${w.queue}</td>
          <td style="text-align:right;font-weight:700">${w.utilization}%</td>
          <td style="text-align:right;font-weight:700;color:${color}">${w.peakPct}%</td>
          <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${color}22;color:${color};font-size:9px;font-weight:700">${w.status}</span></td>
          ${dayCells}
        </tr>`
    }).join('')

    const dateHeaders = dates.map(d => `<th style="text-align:center;font-size:9px;padding:6px 2px">${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</th>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Capacity Report</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #7c3aed; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { font-size: 26px; font-weight: 800; color: #7c3aed; }
  .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 20px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 13px; color: #7c3aed; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #ede9fe; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #7c3aed; color: white; text-align: left; padding: 7px 6px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 6px; border-bottom: 1px solid #f3f4f6; }
  .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  .legend { display: flex; gap: 12px; font-size: 9px; margin-top: 10px; }
  .legend-item { display: flex; align-items: center; gap: 4px; }
  .legend-swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Manufacturing · Capacity Planning Report</div></div>
  <div class="doc-title"><h1>CAPACITY</h1><div class="num">${dates[0].toLocaleDateString('en-GB')} → ${dates[dates.length - 1].toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${workCenters.length}</div><div class="stat-label">Work Centers</div></div>
  <div class="stat"><div class="stat-num">${Math.round(totalCapacity)}</div><div class="stat-label">Total Capacity</div></div>
  <div class="stat"><div class="stat-num">${Math.round(totalLoad)}</div><div class="stat-label">Total Load</div></div>
  <div class="stat"><div class="stat-num" style="color:${overallUtil > 90 ? '#dc2626' : overallUtil > 70 ? '#ca8a04' : '#16a34a'}">${overallUtil}%</div><div class="stat-label">Utilization</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${overloaded}</div><div class="stat-label">Overloaded</div></div>
  <div class="stat"><div class="stat-num" style="font-size:11px;font-weight:700">${bottleneck?.name || '—'}</div><div class="stat-label">Bottleneck</div></div>
</div>

<div class="section-title">Capacity Heatmap · Next ${horizon} Days</div>
<table>
  <thead>
    <tr>
      <th>Work Center</th>
      <th style="text-align:right">Cap/Day</th>
      <th style="text-align:right">Queue</th>
      <th style="text-align:right">Util</th>
      <th style="text-align:right">Peak</th>
      <th style="text-align:center">Status</th>
      ${dateHeaders}
    </tr>
  </thead>
  <tbody>${wcRows || '<tr><td colspan="20" style="text-align:center;color:#9ca3af">No work centers configured</td></tr>'}</tbody>
</table>

<div class="legend">
  <div class="legend-item"><span class="legend-swatch" style="background:#d1fae5"></span> Low (&lt;30%)</div>
  <div class="legend-item"><span class="legend-swatch" style="background:#10b981"></span> Good (30-70%)</div>
  <div class="legend-item"><span class="legend-swatch" style="background:#f59e0b"></span> High (70-100%)</div>
  <div class="legend-item"><span class="legend-swatch" style="background:#dc2626"></span> Overloaded (&gt;100%)</div>
  <div class="legend-item"><span class="legend-swatch" style="background:#f3f4f6"></span> No load</div>
</div>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve · Utilization = Load / Capacity</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Capacity PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}