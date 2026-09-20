export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === PROJECTS RBAC GUARD ===
    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!
    // ===========================
    const orgId = session.organizationId

    const projRes = await pool.query(
      `SELECT * FROM "Project" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 300`,
      [orgId]
    )
    const projects = projRes.rows

    const taskRes = await pool.query(
      `SELECT "projectId", COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'DONE') AS done
       FROM "Task" WHERE "organizationId" = $1 GROUP BY "projectId"`,
      [orgId]
    ).catch(() => ({ rows: [] }))
    const taskMap: Record<string, { total: number; done: number }> = {}
    for (const r of taskRes.rows) taskMap[r.projectId] = { total: Number(r.total), done: Number(r.done) }

    const msRes = await pool.query(
      `SELECT "projectId", COUNT(*) AS total, COUNT(*) FILTER (WHERE completed = true) AS done
       FROM "Milestone" WHERE "organizationId" = $1 GROUP BY "projectId"`,
      [orgId]
    ).catch(() => ({ rows: [] }))
    const msMap: Record<string, { total: number; done: number }> = {}
    for (const r of msRes.rows) msMap[r.projectId] = { total: Number(r.total), done: Number(r.done) }

    const rows = projects.map(p => {
      const tasks = taskMap[p.id] || { total: 0, done: 0 }
      const ms = msMap[p.id] || { total: 0, done: 0 }
      const endDate = p.endDate ? new Date(p.endDate) : null
      const now = new Date()
      const isOverdue = endDate && endDate < now && p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
      return {
        ...p,
        progress: tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : Number(p.progress || 0),
        totalTasks: tasks.total,
        doneTasks: tasks.done,
        totalMilestones: ms.total,
        doneMilestones: ms.done,
        isOverdue,
        budget: Number(p.budget || 0),
      }
    })

    const active = rows.filter(p => p.status === 'ACTIVE')
    const completed = rows.filter(p => p.status === 'COMPLETED')
    const overdue = rows.filter(p => p.isOverdue)
    const totalBudget = rows.reduce((s, p) => s + p.budget, 0)
    const avgProgress = rows.length > 0 ? Math.round(rows.reduce((s, p) => s + p.progress, 0) / rows.length) : 0

    const statusColor = (s: string, overdue: boolean) =>
      overdue ? '#dc2626' :
      s === 'COMPLETED' ? '#16a34a' :
      s === 'ACTIVE' ? '#0891b2' :
      s === 'PLANNING' ? '#ca8a04' :
      s === 'ON_HOLD' ? '#ea580c' :
      '#6b7280'

    const bodyRows = rows.map((r, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${r.title}</b></td>
        <td style="text-align:center">${r.startDate ? new Date(r.startDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:center">${r.endDate ? new Date(r.endDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:right">${r.budget.toLocaleString()}</td>
        <td style="text-align:center">${r.doneTasks}/${r.totalTasks}</td>
        <td style="text-align:center">${r.doneMilestones}/${r.totalMilestones}</td>
        <td style="text-align:center">
          <div style="background:#e5e7eb;border-radius:99px;height:8px;width:80px;display:inline-block;position:relative;overflow:hidden">
            <div style="background:${r.progress >= 100 ? '#16a34a' : r.progress >= 50 ? '#0891b2' : '#ca8a04'};height:8px;width:${r.progress}%"></div>
          </div>
          <span style="font-size:9px;font-weight:700;margin-left:4px">${r.progress}%</span>
        </td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(r.status, r.isOverdue)}22;color:${statusColor(r.status, r.isOverdue)};font-size:9px;font-weight:700">${r.isOverdue ? 'OVERDUE' : r.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Projects Report</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #0d9488; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #0d9488; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #0d9488; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #ccfbf1; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #0d9488; color: white; text-align: left; padding: 8px 6px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 7px 6px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #f0fdfa; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Project Management · Portfolio Report</div></div>
  <div class="doc-title"><h1>PROJECT PORTFOLIO</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${rows.length}</div><div class="stat-label">Total Projects</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${active.length}</div><div class="stat-label">Active</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${completed.length}</div><div class="stat-label">Completed</div></div>
  <div class="stat"><div class="stat-num" style="color:${overdue.length > 0 ? '#dc2626' : '#6b7280'}">${overdue.length}</div><div class="stat-label">Overdue</div></div>
  <div class="stat"><div class="stat-num" style="color:#0d9488">${avgProgress}%</div><div class="stat-label">Avg Progress</div></div>
  <div class="stat"><div class="stat-num" style="color:#0d9488">${Math.round(totalBudget).toLocaleString()}</div><div class="stat-label">Total Budget</div></div>
</div>

<div class="section-title">Project Portfolio (${rows.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Project</th>
    <th style="text-align:center">Start</th>
    <th style="text-align:center">End</th>
    <th style="text-align:right">Budget</th>
    <th style="text-align:center">Tasks</th>
    <th style="text-align:center">Milestones</th>
    <th style="text-align:center">Progress</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px">No projects yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Projects PDF error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}