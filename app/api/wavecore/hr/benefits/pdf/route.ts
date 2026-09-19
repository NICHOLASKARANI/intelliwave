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
      `SELECT * FROM "BenefitProgram" WHERE "organizationId" = $1 ORDER BY name ASC LIMIT 300`,
      [orgId]
    )
    const benefits = res.rows.map(b => ({
      ...b,
      enrolledCount: Number(b.enrolledCount || 0),
      employerContribution: Number(b.employerContribution || 0),
      employeeContribution: Number(b.employeeContribution || 0),
      monthlyEmployerCost: Number(b.enrolledCount || 0) * Number(b.employerContribution || 0),
      monthlyEmployeeCost: Number(b.enrolledCount || 0) * Number(b.employeeContribution || 0),
    }))

    const active = benefits.filter(b => b.status === 'ACTIVE')
    const totalEnrolled = benefits.reduce((s, b) => s + b.enrolledCount, 0)
    const totalEmployer = benefits.reduce((s, b) => s + b.monthlyEmployerCost, 0)
    const totalEmployee = benefits.reduce((s, b) => s + b.monthlyEmployeeCost, 0)

    const bodyRows = benefits.map((b, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${b.name}</b></td>
        <td>${b.category || '—'}</td>
        <td>${b.provider || '—'}</td>
        <td style="text-align:right">${b.enrolledCount}</td>
        <td style="text-align:right">${b.employerContribution.toLocaleString()}</td>
        <td style="text-align:right">${b.employeeContribution.toLocaleString()}</td>
        <td style="text-align:right;font-weight:700;color:#dc2626">${b.monthlyEmployerCost.toLocaleString()}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${b.status === 'ACTIVE' ? '#16a34a22' : '#6b728022'};color:${b.status === 'ACTIVE' ? '#16a34a' : '#6b7280'};font-size:9px;font-weight:700">${b.status}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Benefits Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #db2777; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #db2777; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #db2777; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
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
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Benefits Administration Report</div></div>
  <div class="doc-title"><h1>BENEFITS</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${benefits.length}</div><div class="stat-label">Programs</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${active.length}</div><div class="stat-label">Active</div></div>
  <div class="stat"><div class="stat-num" style="color:#db2777">${totalEnrolled}</div><div class="stat-label">Enrolled</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${Math.round(totalEmployer).toLocaleString()}</div><div class="stat-label">Employer Cost/mo</div></div>
  <div class="stat"><div class="stat-num" style="color:#0891b2">${Math.round(totalEmployee).toLocaleString()}</div><div class="stat-label">Employee Cost/mo</div></div>
</div>

<div class="section-title">Benefit Programs (${benefits.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Program</th>
    <th>Category</th>
    <th>Provider</th>
    <th style="text-align:right">Enrolled</th>
    <th style="text-align:right">Employer</th>
    <th style="text-align:right">Employee</th>
    <th style="text-align:right">Monthly Employer Cost</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px">No benefit programs yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Benefits PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}