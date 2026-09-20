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
      `SELECT * FROM "OnboardingChecklist" WHERE "organizationId" = $1 ORDER BY "startDate" DESC LIMIT 200`,
      [orgId]
    )
    const checklists = res.rows.map(c => ({
      ...c,
      currentStep: Number(c.currentStep || 0),
      totalSteps: Number(c.totalSteps || 8),
      progress: Number(c.totalSteps) > 0 ? Math.round((Number(c.currentStep || 0) / Number(c.totalSteps)) * 100) : 0,
    }))

    const inProgress = checklists.filter(c => c.status === 'IN_PROGRESS')
    const completed = checklists.filter(c => c.status === 'COMPLETED')
    const avgProgress = checklists.length > 0 ? Math.round(checklists.reduce((s, c) => s + c.progress, 0) / checklists.length) : 0

    const statusColor = (s: string) =>
      s === 'COMPLETED' ? '#16a34a' :
      s === 'IN_PROGRESS' ? '#0891b2' :
      s === 'PENDING' ? '#ca8a04' :
      '#6b7280'

    const bodyRows = checklists.map((c, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${c.employeeName}</b></td>
        <td style="text-align:center">${c.startDate ? new Date(c.startDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:center">${c.targetCompletionDate ? new Date(c.targetCompletionDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:center">${c.currentStep}/${c.totalSteps}</td>
        <td style="text-align:center">${c.progress}%</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(c.status)}22;color:${statusColor(c.status)};font-size:9px;font-weight:700">${c.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Onboarding Report</title>
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
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Onboarding Status Report</div></div>
  <div class="doc-title"><h1>ONBOARDING</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${checklists.length}</div><div class="stat-label">Total</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${inProgress.length}</div><div class="stat-label">In Progress</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${completed.length}</div><div class="stat-label">Completed</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${checklists.length - inProgress.length - completed.length}</div><div class="stat-label">Pending</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${avgProgress}%</div><div class="stat-label">Avg Progress</div></div>
</div>

<div class="section-title">Onboarding Checklists (${checklists.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Employee</th>
    <th style="text-align:center">Start</th>
    <th style="text-align:center">Target</th>
    <th style="text-align:center">Steps</th>
    <th style="text-align:center">Progress</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:24px">No onboarding checklists yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Onboarding PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}