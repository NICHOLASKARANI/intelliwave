export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const depRes = await pool.query(
      `SELECT * FROM "Department" WHERE "organizationId" = $1 ORDER BY name ASC LIMIT 500`,
      [orgId]
    )
    const empRes = await pool.query(
      `SELECT department, COUNT(*) AS cnt, COALESCE(SUM(salary),0) AS salary_sum
       FROM "Employee" WHERE "organizationId" = $1 AND status = 'ACTIVE'
       GROUP BY department`,
      [orgId]
    )
    const empMap: Record<string, { count: number; salary: number }> = {}
    for (const row of empRes.rows) {
      empMap[row.department || 'Unassigned'] = {
        count: Number(row.cnt || 0),
        salary: Number(row.salary_sum || 0),
      }
    }

    const rows = depRes.rows.map(d => {
      const live = empMap[d.name] || { count: 0, salary: 0 }
      const budget = Number(d.budgetAmount || 0)
      const annual = Math.round(live.salary)
      const variance = budget > 0 ? annual - budget : 0
      const utilization = budget > 0 ? Math.round((annual / budget) * 100) : 0
      return { ...d, employeeCount: live.count, annualCost: annual, monthlyCost: Math.round(annual / 12), variance, utilization }
    })

    const totalEmp = rows.reduce((s, r) => s + r.employeeCount, 0)
    const totalBudget = rows.reduce((s, r) => s + Number(r.budgetAmount || 0), 0)
    const totalAnnual = rows.reduce((s, r) => s + r.annualCost, 0)
    const overCount = rows.filter(r => r.variance > 0).length

    const bodyRows = rows.map((r, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${r.name}</b>${r.code ? ` <span style="color:#6b7280;font-size:9px">(${r.code})</span>` : ''}</td>
        <td>${r.head || '—'}</td>
        <td style="text-align:right">${r.employeeCount}</td>
        <td style="text-align:right">${Math.round(Number(r.budgetAmount || 0)).toLocaleString()}</td>
        <td style="text-align:right">${r.annualCost.toLocaleString()}</td>
        <td style="text-align:right;font-weight:700;color:${r.variance > 0 ? '#dc2626' : '#16a34a'}">
          ${r.variance === 0 ? '—' : (r.variance > 0 ? '+' : '') + r.variance.toLocaleString()}
        </td>
        <td style="text-align:center;font-weight:700;color:${r.utilization > 100 ? '#dc2626' : r.utilization > 90 ? '#ca8a04' : '#16a34a'}">
          ${r.utilization > 0 ? r.utilization + '%' : '—'}
        </td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Departments Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #4f46e5; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #4f46e5; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #4f46e5; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #e0e7ff; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #4f46e5; color: white; text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; }
  tbody td { padding: 7px 6px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #eef2ff; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Department Structure Report</div></div>
  <div class="doc-title"><h1>DEPARTMENTS</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${rows.length}</div><div class="stat-label">Departments</div></div>
  <div class="stat"><div class="stat-num">${totalEmp}</div><div class="stat-label">Active Employees</div></div>
  <div class="stat"><div class="stat-num">${Math.round(totalBudget).toLocaleString()}</div><div class="stat-label">Total Budget</div></div>
  <div class="stat"><div class="stat-num" style="color:#4f46e5">${totalAnnual.toLocaleString()}</div><div class="stat-label">Annual Cost</div></div>
  <div class="stat"><div class="stat-num" style="color:${overCount > 0 ? '#dc2626' : '#16a34a'}">${overCount}</div><div class="stat-label">Over Budget</div></div>
</div>

<div class="section-title">Department Breakdown (${rows.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Department</th>
    <th>Head</th>
    <th style="text-align:right">Employees</th>
    <th style="text-align:right">Budget</th>
    <th style="text-align:right">Annual Cost</th>
    <th style="text-align:right">Variance</th>
    <th style="text-align:center">Utilization</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px">No departments defined yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Departments PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}