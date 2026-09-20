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
      `SELECT * FROM "TrainingProgram" WHERE "organizationId" = $1 ORDER BY "startDate" DESC NULLS LAST LIMIT 300`,
      [orgId]
    )
    const trainings = res.rows.map(t => ({
      ...t,
      enrolledCount: Number(t.enrolledCount || 0),
      maxAttendees: Number(t.maxAttendees || 0),
      costPerAttendee: Number(t.costPerAttendee || 0),
      totalCost: Number(t.enrolledCount || 0) * Number(t.costPerAttendee || 0),
      fillRate: Number(t.maxAttendees || 0) > 0 ? Math.round((Number(t.enrolledCount || 0) / Number(t.maxAttendees)) * 100) : 0,
    }))

    const active = trainings.filter(t => t.status === 'IN_PROGRESS')
    const planned = trainings.filter(t => t.status === 'PLANNED')
    const completed = trainings.filter(t => t.status === 'COMPLETED')
    const totalEnrolled = trainings.reduce((s, t) => s + t.enrolledCount, 0)
    const totalCost = trainings.reduce((s, t) => s + t.totalCost, 0)

    const statusColor = (s: string) =>
      s === 'COMPLETED' ? '#16a34a' :
      s === 'IN_PROGRESS' ? '#0891b2' :
      s === 'PLANNED' ? '#ca8a04' :
      s === 'CANCELLED' ? '#6b7280' :
      '#6b7280'

    const bodyRows = trainings.map((t, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${t.title}</b></td>
        <td>${t.category || '—'}</td>
        <td>${t.provider || '—'}</td>
        <td>${t.trainer || '—'}</td>
        <td style="text-align:center">${t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:right">${t.enrolledCount}/${t.maxAttendees || '—'}</td>
        <td style="text-align:center">${t.fillRate}%</td>
        <td style="text-align:right">${t.totalCost.toLocaleString()}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(t.status)}22;color:${statusColor(t.status)};font-size:9px;font-weight:700">${t.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Training Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #7c3aed; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #7c3aed; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #ede9fe; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #7c3aed; color: white; text-align: left; padding: 7px 5px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 6px 5px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #f5f3ff; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Training & Development Report</div></div>
  <div class="doc-title"><h1>TRAINING</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${trainings.length}</div><div class="stat-label">Programs</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${active.length}</div><div class="stat-label">Active</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${planned.length}</div><div class="stat-label">Planned</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${completed.length}</div><div class="stat-label">Completed</div></div>
  <div class="stat"><div class="stat-num" style="color:#7c3aed">${totalEnrolled}</div><div class="stat-label">Enrolled</div></div>
  <div class="stat"><div class="stat-num" style="color:#7c3aed">${Math.round(totalCost).toLocaleString()}</div><div class="stat-label">Total Cost</div></div>
</div>

<div class="section-title">Training Programs (${trainings.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Title</th>
    <th>Category</th>
    <th>Provider</th>
    <th>Trainer</th>
    <th style="text-align:center">Start</th>
    <th style="text-align:right">Enrolled</th>
    <th style="text-align:center">Fill</th>
    <th style="text-align:right">Cost</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="10" style="text-align:center;color:#9ca3af;padding:24px">No training programs yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Training PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}