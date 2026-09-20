export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD (wave 2) ===
    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!
    // ============================
    const orgId = session.organizationId

    const res = await pool.query(
      `SELECT l.*,
         e."firstName", e."lastName", e."employeeId" AS "empCode", e.department,
         lt.name AS "leaveTypeName"
       FROM "LeaveRequest" l
       LEFT JOIN "Employee" e ON e.id = l."employeeId" AND e."organizationId" = l."organizationId"
       LEFT JOIN "LeaveType" lt ON lt.id = l."leaveTypeId" AND lt."organizationId" = l."organizationId"
       WHERE l."organizationId" = $1
       ORDER BY l."createdAt" DESC LIMIT 300`,
      [orgId]
    )

    const rows = res.rows.map(r => ({
      ...r,
      employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown',
      days: Number(r.days || 0),
    }))

    const pending = rows.filter(r => r.status === 'PENDING')
    const approved = rows.filter(r => r.status === 'APPROVED')
    const rejected = rows.filter(r => r.status === 'REJECTED')
    const totalDays = Math.round(approved.reduce((s, r) => s + r.days, 0) * 10) / 10

    const statusColor = (s: string) =>
      s === 'APPROVED' ? '#16a34a' :
      s === 'PENDING'  ? '#ca8a04' :
      s === 'REJECTED' ? '#dc2626' :
      s === 'CANCELLED'? '#6b7280' :
      '#6b7280'

    const bodyRows = rows.slice(0, 200).map((r, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${r.employeeName}</b><br><span style="font-family:'Courier New',monospace;font-size:9px;color:#6b7280">${r.empCode || ''}</span></td>
        <td>${r.department || '—'}</td>
        <td>${r.leaveTypeName || '—'}</td>
        <td style="text-align:center">${r.startDate ? new Date(r.startDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:center">${r.endDate ? new Date(r.endDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:right;font-weight:700">${r.days}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(r.status)}22;color:${statusColor(r.status)};font-size:9px;font-weight:700">${r.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Leave Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #ca8a04; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #ca8a04; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #ca8a04; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #ca8a04; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #fef3c7; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #ca8a04; color: white; text-align: left; padding: 7px 5px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 6px 5px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #fffbeb; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Leave & Absence Report</div></div>
  <div class="doc-title"><h1>LEAVE REPORT</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${rows.length}</div><div class="stat-label">Total Requests</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${pending.length}</div><div class="stat-label">Pending</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${approved.length}</div><div class="stat-label">Approved</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${rejected.length}</div><div class="stat-label">Rejected</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${totalDays}</div><div class="stat-label">Days Approved</div></div>
</div>

<div class="section-title">Leave Requests (${Math.min(rows.length, 200)} of ${rows.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Employee</th>
    <th>Department</th>
    <th>Type</th>
    <th style="text-align:center">Start</th>
    <th style="text-align:center">End</th>
    <th style="text-align:right">Days</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">No leave requests yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Leaves PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}