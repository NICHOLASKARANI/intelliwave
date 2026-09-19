export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const res = await pool.query(
      `SELECT a.*, e."firstName", e."lastName", e."employeeId" AS "empCode", e.department
       FROM "Attendance" a
       LEFT JOIN "Employee" e ON e.id = a."employeeId" AND e."organizationId" = a."organizationId"
       WHERE a."organizationId" = $1
       ORDER BY a.date DESC LIMIT 500`,
      [orgId]
    )

    const rows = res.rows.map(r => {
      let hours = 0
      if (r.checkIn && r.checkOut) {
        hours = (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60)
        if (hours < 0) hours = 0
      }
      return { ...r, hoursWorked: Math.round(hours * 10) / 10, employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown' }
    })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayRows = rows.filter(r => r.date && new Date(r.date) >= todayStart)
    const present = todayRows.filter(r => r.status === 'PRESENT').length
    const late = todayRows.filter(r => r.status === 'LATE').length
    const absent = todayRows.filter(r => r.status === 'ABSENT').length
    const leave = todayRows.filter(r => r.status === 'LEAVE').length

    const totalHours = Math.round(rows.reduce((s, r) => s + r.hoursWorked, 0) * 10) / 10

    const statusColor = (s: string) =>
      s === 'PRESENT' ? '#16a34a' :
      s === 'LATE'    ? '#ca8a04' :
      s === 'ABSENT'  ? '#dc2626' :
      s === 'LEAVE'   ? '#7c3aed' :
      '#6b7280'

    const bodyRows = rows.slice(0, 200).map((r, i) => {
      const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'
      const inStr  = r.checkIn  ? new Date(r.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
      const outStr = r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
      return `
        <tr>
          <td style="text-align:center;color:#6b7280">${i + 1}</td>
          <td>${dateStr}</td>
          <td><b>${r.employeeName}</b></td>
          <td style="font-family:'Courier New',monospace;font-size:9px">${r.empCode || '—'}</td>
          <td>${r.department || '—'}</td>
          <td style="text-align:center">${inStr}</td>
          <td style="text-align:center">${outStr}</td>
          <td style="text-align:right">${r.hoursWorked || '—'}</td>
          <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(r.status)}22;color:${statusColor(r.status)};font-size:9px;font-weight:700">${r.status || '—'}</span></td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Attendance Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #16a34a; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #16a34a; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #dcfce7; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #16a34a; color: white; text-align: left; padding: 7px 5px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 6px 5px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #f0fdf4; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Attendance Report</div></div>
  <div class="doc-title"><h1>ATTENDANCE</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num" style="color:#16a34a">${present}</div><div class="stat-label">Present Today</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${late}</div><div class="stat-label">Late</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${absent}</div><div class="stat-label">Absent</div></div>
  <div class="stat"><div class="stat-num" style="color:#7c3aed">${leave}</div><div class="stat-label">On Leave</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${totalHours}</div><div class="stat-label">Total Hours</div></div>
</div>

<div class="section-title">Attendance Log (${Math.min(rows.length, 200)} of ${rows.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Date</th>
    <th>Employee</th>
    <th>Code</th>
    <th>Department</th>
    <th style="text-align:center">Check In</th>
    <th style="text-align:center">Check Out</th>
    <th style="text-align:right">Hours</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px">No attendance records yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Attendance PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}