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
      `SELECT * FROM "Employee" WHERE "organizationId" = $1 ORDER BY "firstName" ASC, "lastName" ASC LIMIT 1000`,
      [orgId]
    )

    const employees = res.rows.map(e => ({
      ...e,
      fullName: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
      salary: Number(e.salary || 0),
    }))

    const active = employees.filter(e => e.status === 'ACTIVE')
    const totalPayroll = active.reduce((s, e) => s + e.salary, 0)
    const avgSalary = active.length > 0 ? Math.round(totalPayroll / active.length) : 0
    const depts = new Set(employees.map(e => e.department).filter(Boolean))

    const statusColor = (s: string) =>
      s === 'ACTIVE' ? '#16a34a' :
      s === 'ON_LEAVE' || s === 'LEAVE' ? '#ca8a04' :
      s === 'TERMINATED' ? '#dc2626' :
      s === 'PROBATION' ? '#0891b2' :
      '#6b7280'

    const bodyRows = employees.map((e, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td style="font-family:'Courier New',monospace;font-size:9px">${e.employeeId || '—'}</td>
        <td><b>${e.fullName}</b></td>
        <td>${e.email || '—'}</td>
        <td>${e.phone || '—'}</td>
        <td>${e.department || '—'}</td>
        <td>${e.jobTitle || e.position || '—'}</td>
        <td style="text-align:right">${e.salary.toLocaleString()}</td>
        <td style="text-align:center">${e.hireDate ? new Date(e.hireDate).toLocaleDateString('en-GB') : '—'}</td>
        <td style="text-align:center"><span style="padding:2px 8px;border-radius:8px;background:${statusColor(e.status)}22;color:${statusColor(e.status)};font-size:9px;font-weight:700">${e.status || '—'}</span></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Employee Directory</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #2563eb; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 14px; color: #2563eb; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 800; }
  .stat-label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #dbeafe; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  thead th { background: #2563eb; color: white; text-align: left; padding: 7px 5px; font-size: 8px; text-transform: uppercase; }
  tbody td { padding: 5px 4px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #eff6ff; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Employee Directory</div></div>
  <div class="doc-title"><h1>EMPLOYEES</h1><div class="num">${new Date().toLocaleDateString('en-GB')}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${employees.length}</div><div class="stat-label">Total</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${active.length}</div><div class="stat-label">Active</div></div>
  <div class="stat"><div class="stat-num" style="color:#2563eb">${depts.size}</div><div class="stat-label">Departments</div></div>
  <div class="stat"><div class="stat-num" style="color:#2563eb">${Math.round(totalPayroll / 12).toLocaleString()}</div><div class="stat-label">Monthly Payroll</div></div>
  <div class="stat"><div class="stat-num" style="color:#2563eb">${avgSalary.toLocaleString()}</div><div class="stat-label">Avg Salary</div></div>
</div>

<div class="section-title">Employee Directory (${employees.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Code</th>
    <th>Full Name</th>
    <th>Email</th>
    <th>Phone</th>
    <th>Department</th>
    <th>Job Title</th>
    <th style="text-align:right">Salary</th>
    <th style="text-align:center">Hire Date</th>
    <th style="text-align:center">Status</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="10" style="text-align:center;color:#9ca3af;padding:24px">No employees yet</td></tr>'}</tbody>
</table>

<div class="footer"><p>Generated by WaveCore ERP · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Employees PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}