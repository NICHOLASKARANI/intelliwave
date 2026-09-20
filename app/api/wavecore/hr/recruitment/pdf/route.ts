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

    const jobsRes = await pool.query(
      `SELECT * FROM "JobPosting" WHERE "organizationId" = $1 ORDER BY "postedDate" DESC LIMIT 200`,
      [orgId]
    )
    const appRes = await pool.query(
      `SELECT "jobPostingId", stage, COUNT(*) AS cnt FROM "Applicant" WHERE "organizationId" = $1 GROUP BY "jobPostingId", stage`,
      [orgId]
    )
    const appMap: Record<string, number> = {}
    for (const r of appRes.rows) {
      appMap[r.jobPostingId] = (appMap[r.jobPostingId] || 0) + Number(r.cnt)
    }

    const jobs = jobsRes.rows
    const totalApplicants = Object.values(appMap).reduce((s, v) => s + v, 0)
    const openJobs = jobs.filter(j => j.status === 'OPEN')
    const closedJobs = jobs.filter(j => j.status === 'CLOSED')

    const stageTotalMap: Record<string, number> = {}
    for (const r of appRes.rows) { stageTotalMap[r.stage] = (stageTotalMap[r.stage] || 0) + Number(r.cnt) }
    const stages = ['APPLIED','SCREENING','INTERVIEW','ASSESSMENT','OFFER','HIRED','REJECTED']

    const jobRows = jobs.map((j, i) => {
      const posted = j.postedDate ? new Date(j.postedDate).toLocaleDateString('en-GB') : '—'
      const closing = j.closingDate ? new Date(j.closingDate).toLocaleDateString('en-GB') : '—'
      const statusColor = j.status === 'OPEN' ? '#16a34a' : j.status === 'CLOSED' ? '#6b7280' : '#ca8a04'
      return `
        <tr>
          <td style="text-align:center;color:#6b7280">${i + 1}</td>
          <td><b>${j.title}</b></td>
          <td>${j.location || '—'}</td>
          <td>${j.employmentType || '—'}</td>
          <td style="text-align:right">${appMap[j.id] || 0}</td>
          <td style="text-align:center">${posted}</td>
          <td style="text-align:center">${closing}</td>
          <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor}22;color:${statusColor};font-size:9px;font-weight:700">${j.status}</span></td>
        </tr>`
    }).join('')

    const stageRows = stages.filter(s => stageTotalMap[s]).map(s => `
      <tr>
        <td>${s}</td>
        <td style="text-align:right;font-weight:700">${stageTotalMap[s]}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Recruitment Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #0891b2; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #0891b2; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #0891b2; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #cffafe; }
  .grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #0891b2; color: white; text-align: left; padding: 7px 5px; font-size: 9px; text-transform: uppercase; }
  tbody td { padding: 6px 5px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #ecfeff; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Recruitment Report</div></div>
  <div class="doc-title"><h1>RECRUITMENT</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${jobs.length}</div><div class="stat-label">Total Jobs</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${openJobs.length}</div><div class="stat-label">Open</div></div>
  <div class="stat"><div class="stat-num" style="color:#6b7280">${closedJobs.length}</div><div class="stat-label">Closed</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${totalApplicants}</div><div class="stat-label">Total Applicants</div></div>
  <div class="stat"><div class="stat-num" style="color:#ca8a04">${(stageTotalMap['INTERVIEW'] || 0) + (stageTotalMap['ASSESSMENT'] || 0)}</div><div class="stat-label">In Interview</div></div>
</div>

<div class="grid-2">
  <div>
    <div class="section-title">Open Positions & Applicants (${jobs.length})</div>
    <table>
      <thead><tr>
        <th style="text-align:center">#</th>
        <th>Job Title</th>
        <th>Location</th>
        <th>Type</th>
        <th style="text-align:right">Applicants</th>
        <th style="text-align:center">Posted</th>
        <th style="text-align:center">Closing</th>
        <th style="text-align:center">Status</th>
      </tr></thead>
      <tbody>${jobRows || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">No job postings yet</td></tr>'}</tbody>
    </table>
  </div>
  <div>
    <div class="section-title">Pipeline Breakdown</div>
    <table>
      <thead><tr><th>Stage</th><th style="text-align:right">Count</th></tr></thead>
      <tbody>${stageRows || '<tr><td colspan="2" style="text-align:center;color:#9ca3af;padding:24px">No applicants yet</td></tr>'}</tbody>
    </table>
  </div>
</div>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Recruitment PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}