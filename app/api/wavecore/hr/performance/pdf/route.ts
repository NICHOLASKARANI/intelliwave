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
      `SELECT r.*, e."firstName", e."lastName", e."employeeId" AS "empCode", e.department
       FROM "PerformanceReview" r
       LEFT JOIN "Employee" e ON e.id = r."employeeId" AND e."organizationId" = r."organizationId"
       WHERE r."organizationId" = $1 ORDER BY r."reviewDate" DESC LIMIT 500`,
      [orgId]
    )
    const reviews = res.rows.map(r => ({
      ...r,
      employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown',
      score: Number(r.score || 0),
    }))

    const completed = reviews.filter(r => r.status === 'COMPLETED')
    const avgScore = completed.length > 0
      ? Math.round((completed.reduce((s, r) => s + r.score, 0) / completed.length) * 10) / 10
      : 0
    const buckets = { outstanding: 0, exceeds: 0, meets: 0, needs: 0 }
    for (const r of completed) {
      if (r.score >= 4.5) buckets.outstanding++
      else if (r.score >= 3.5) buckets.exceeds++
      else if (r.score >= 2.5) buckets.meets++
      else buckets.needs++
    }

    const bodyRows = reviews.map((r, i) => {
      const scoreColor = r.score >= 4.5 ? '#16a34a' : r.score >= 3.5 ? '#0891b2' : r.score >= 2.5 ? '#ca8a04' : '#dc2626'
      return `
        <tr>
          <td style="text-align:center;color:#6b7280">${i + 1}</td>
          <td><b>${r.employeeName}</b></td>
          <td>${r.department || '—'}</td>
          <td>${r.reviewPeriod || '—'}</td>
          <td>${r.reviewType || '—'}</td>
          <td style="text-align:right;font-weight:700;color:${scoreColor}">${r.score.toFixed(1)}</td>
          <td style="text-align:center">${r.goalsAchieved || 0}/${r.goalsTotal || 0}</td>
          <td style="text-align:center">${r.status}</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Performance Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #ca8a04; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #ca8a04; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #ca8a04; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
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
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Performance Review Report</div></div>
  <div class="doc-title"><h1>PERFORMANCE</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${reviews.length}</div><div class="stat-label">Total Reviews</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${completed.length}</div><div class="stat-label">Completed</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${avgScore.toFixed(1)}</div><div class="stat-label">Avg Score</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${buckets.outstanding}</div><div class="stat-label">Outstanding</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${buckets.exceeds}</div><div class="stat-label">Exceeds</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${buckets.needs}</div><div class="stat-label">Needs Improvement</div></div>
</div>

<div class="section-title">Review Log (${reviews.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Employee</th>
    <th>Department</th>
    <th>Period</th>
    <th>Type</th>
    <th style="text-align:right">Score</th>
    <th style="text-align:center">Goals</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">No performance reviews yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Performance PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}