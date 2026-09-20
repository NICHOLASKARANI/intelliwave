export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    let sql = `SELECT t.*, p.title AS project_title FROM "Task" t
               LEFT JOIN "Project" p ON p.id = t."projectId" AND p."organizationId" = t."organizationId"
               WHERE t."organizationId" = $1`
    const params: any[] = [orgId]
    if (projectId) { sql += ` AND t."projectId" = $2`; params.push(projectId) }
    sql += ` ORDER BY t.status ASC, t."dueDate" ASC NULLS LAST LIMIT 500`

    const res = await pool.query(sql, params)
    const tasks = res.rows.map(t => {
      const due = t.dueDate ? new Date(t.dueDate) : null
      const now = new Date()
      return {
        ...t,
        isOverdue: due && due < now && t.status !== 'DONE',
        estimatedHours: Number(t.estimatedHours || 0),
        actualHours: Number(t.actualHours || 0),
      }
    })

    const byStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      REVIEW: tasks.filter(t => t.status === 'REVIEW').length,
      DONE: tasks.filter(t => t.status === 'DONE').length,
      BLOCKED: tasks.filter(t => t.status === 'BLOCKED').length,
    }
    const overdue = tasks.filter(t => t.isOverdue).length
    const totalEst = Math.round(tasks.reduce((s, t) => s + t.estimatedHours, 0))
    const totalAct = Math.round(tasks.reduce((s, t) => s + t.actualHours, 0) * 10) / 10

    const statusColor = (s: string, overdue: boolean) =>
      overdue ? '#dc2626' :
      s === 'DONE' ? '#16a34a' :
      s === 'IN_PROGRESS' ? '#0891b2' :
      s === 'REVIEW' ? '#ca8a04' :
      s === 'BLOCKED' ? '#dc2626' :
      '#6b7280'

    const bodyRows = tasks.map((t, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${t.title}</b></td>
        <td>${t.project_title || '—'}</td>
        <td>${t.assigneeId || '—'}</td>
        <td style="text-align:center">${t.priority || 'NORMAL'}</td>
        <td style="text-align:center">${t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:right">${t.estimatedHours || '—'}</td>
        <td style="text-align:right">${t.actualHours || '—'}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(t.status, t.isOverdue)}22;color:${statusColor(t.status, t.isOverdue)};font-size:9px;font-weight:700">${t.isOverdue ? 'OVERDUE' : t.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Task List Report</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #0891b2; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #0891b2; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #0891b2; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin-bottom: 20px; }
  .stat { padding: 10px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 18px; font-weight: 800; }
  .stat-label { font-size: 8px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #cffafe; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #0891b2; color: white; text-align: left; padding: 7px 5px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 6px 5px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #ecfeff; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Project Management · Task List Report</div></div>
  <div class="doc-title"><h1>TASK LIST</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${tasks.length}</div><div class="stat-label">Total</div></div>
  <div class="stat"><div class="stat-num" style="color:#6b7280">${byStatus.TODO}</div><div class="stat-label">To Do</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${byStatus.IN_PROGRESS}</div><div class="stat-label">In Progress</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${byStatus.REVIEW}</div><div class="stat-label">Review</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${byStatus.DONE}</div><div class="stat-label">Done</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${byStatus.BLOCKED}</div><div class="stat-label">Blocked</div></div>
  <div class="stat"><div class="stat-num" style="color:${overdue > 0 ? '#dc2626' : '#6b7280'}">${overdue}</div><div class="stat-label">Overdue</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${totalAct}/${totalEst}</div><div class="stat-label">Hrs Act/Est</div></div>
</div>

<div class="section-title">Tasks (${tasks.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Task</th>
    <th>Project</th>
    <th>Assignee</th>
    <th style="text-align:center">Priority</th>
    <th style="text-align:center">Due</th>
    <th style="text-align:right">Est</th>
    <th style="text-align:right">Act</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px">No tasks yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Tasks PDF error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}