export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const res = await pool.query(
      `SELECT * FROM "SupportTicket" WHERE "organizationId" = $1 
       ORDER BY CASE priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, "createdAt" DESC 
       LIMIT 500`,
      [orgId]
    )
    const tickets = res.rows

    const now = new Date()
    const enriched = tickets.map(t => {
      const dueAt = t.dueAt ? new Date(t.dueAt) : null
      const resolved = t.resolvedAt ? new Date(t.resolvedAt) : null
      const isOverdue = !resolved && dueAt && dueAt < now
      const daysOpen = Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return { ...t, isOverdue, daysOpen }
    })

    const open = enriched.filter(t => t.status === 'OPEN')
    const inProgress = enriched.filter(t => t.status === 'IN_PROGRESS')
    const pending = enriched.filter(t => t.status === 'PENDING')
    const resolvedList = enriched.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')
    const overdue = enriched.filter(t => t.isOverdue)

    const statusColor = (s: string, overdue: boolean) =>
      overdue ? '#dc2626' :
      s === 'OPEN' ? '#0891b2' :
      s === 'IN_PROGRESS' ? '#ca8a04' :
      s === 'PENDING' ? '#ea580c' :
      s === 'RESOLVED' ? '#16a34a' :
      s === 'CLOSED' ? '#6b7280' :
      '#6b7280'

    const priorityColor = (p: string) =>
      p === 'URGENT' ? '#dc2626' :
      p === 'HIGH' ? '#ea580c' :
      p === 'MEDIUM' ? '#0891b2' :
      '#6b7280'

    const bodyRows = enriched.map((t, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${t.subject}</b></td>
        <td>${t.customerName || '—'}</td>
        <td>${t.category || 'GENERAL'}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${priorityColor(t.priority)}22;color:${priorityColor(t.priority)};font-size:9px;font-weight:700">${t.priority}</span></td>
        <td>${t.assigneeName || 'Unassigned'}</td>
        <td style="text-align:center">${new Date(t.createdAt).toLocaleDateString('en-GB')}</td>
        <td style="text-align:center">${t.daysOpen}d</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(t.status, t.isOverdue)}22;color:${statusColor(t.status, t.isOverdue)};font-size:9px;font-weight:700">${t.isOverdue ? 'OVERDUE' : t.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Ticket Report</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #db2777; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #db2777; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #db2777; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #db2777; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #fce7f3; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #db2777; color: white; text-align: left; padding: 7px 5px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 6px 5px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #fdf2f8; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Helpdesk · Ticket Report</div></div>
  <div class="doc-title"><h1>TICKET REPORT</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${enriched.length}</div><div class="stat-label">Total Tickets</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${open.length}</div><div class="stat-label">Open</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${inProgress.length}</div><div class="stat-label">In Progress</div></div>
  <div class="stat"><div class="stat-num" style="color:#ea580c">${pending.length}</div><div class="stat-label">Pending</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${resolvedList.length}</div><div class="stat-label">Resolved</div></div>
  <div class="stat"><div class="stat-num" style="color:${overdue.length > 0 ? '#dc2626' : '#6b7280'}">${overdue.length}</div><div class="stat-label">Overdue</div></div>
</div>

<div class="section-title">Support Tickets (${enriched.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Subject</th>
    <th>Customer</th>
    <th>Category</th>
    <th style="text-align:center">Priority</th>
    <th>Assignee</th>
    <th style="text-align:center">Created</th>
    <th style="text-align:center">Age</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px">No tickets yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Tickets PDF error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}