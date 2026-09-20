export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // === RBAC GUARD ===
    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!
    // ==================
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')

    const periodRes = await pool.query(
      `SELECT * FROM "PayrollPeriod" WHERE "organizationId" = $1 ORDER BY "startDate" DESC LIMIT 50`,
      [orgId]
    )
    const periods = periodRes.rows
    const activePeriod = periodId
      ? periods.find(p => p.id === periodId)
      : periods.find(p => p.status === 'OPEN' || p.status === 'DRAFT' || p.status === 'PROCESSED') || periods[0]

    let rows: any[] = []
    if (activePeriod) {
      const res = await pool.query(
        `SELECT pi.*, e."firstName", e."lastName", e."employeeId" AS "empCode", e.department, e."jobTitle"
         FROM "PayrollItem" pi
         LEFT JOIN "Employee" e ON e.id = pi."employeeId" AND e."organizationId" = pi."organizationId"
         WHERE pi."organizationId" = $1 AND pi."periodId" = $2
         ORDER BY e."firstName" ASC LIMIT 500`,
        [orgId, activePeriod.id]
      )
      rows = res.rows.map(r => ({
        ...r,
        employeeName: r.firstName ? `${r.firstName} ${r.lastName}` : 'Unknown',
        gross: Number(r.grossPay || 0),
        net: Number(r.netPay || 0),
        deductions: Number(r.deductions || 0),
        paye: Number(r.paye || 0),
        nssf: Number(r.nssf || 0),
        shif: Number(r.shif || 0),
        housing: Number(r.housingLevy || 0),
      }))
    }

    const totalGross = rows.reduce((s, r) => s + r.gross, 0)
    const totalNet = rows.reduce((s, r) => s + r.net, 0)
    const totalDed = rows.reduce((s, r) => s + r.deductions, 0)
    const totalPaye = rows.reduce((s, r) => s + r.paye, 0)
    const totalNssf = rows.reduce((s, r) => s + r.nssf, 0)
    const totalShif = rows.reduce((s, r) => s + r.shif, 0)

    const bodyRows = rows.map((r, i) => `
      <tr>
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td><b>${r.employeeName}</b><br><span style="font-family:'Courier New',monospace;font-size:9px;color:#6b7280">${r.empCode || ''}</span></td>
        <td>${r.department || '—'}</td>
        <td style="text-align:right">${r.gross.toLocaleString()}</td>
        <td style="text-align:right;color:#dc2626">${r.paye.toLocaleString()}</td>
        <td style="text-align:right;color:#dc2626">${r.nssf.toLocaleString()}</td>
        <td style="text-align:right;color:#dc2626">${r.shif.toLocaleString()}</td>
        <td style="text-align:right;color:#dc2626">${r.housing.toLocaleString()}</td>
        <td style="text-align:right;color:#6b7280">${r.deductions.toLocaleString()}</td>
        <td style="text-align:right;font-weight:700;color:#16a34a">${r.net.toLocaleString()}</td>
      </tr>`).join('')

    const periodLabel = activePeriod
      ? `${activePeriod.name} (${activePeriod.startDate ? new Date(activePeriod.startDate).toLocaleDateString('en-GB') : '—'} – ${activePeriod.endDate ? new Date(activePeriod.endDate).toLocaleDateString('en-GB') : '—'})`
      : 'No active period'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Payroll Register</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 4px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 800; color: #7c3aed; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .doc-title h1 { font-size: 22px; margin: 0; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 12px; color: #7c3aed; margin-top: 4px; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 20px; }
  .stat { padding: 10px; border: 2px solid #e5e7eb; border-radius: 10px; text-align: center; }
  .stat-num { font-size: 16px; font-weight: 800; }
  .stat-label { font-size: 8px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; margin-top: 3px; }
  .section-title { font-size: 13px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #ede9fe; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  thead th { background: #7c3aed; color: white; text-align: left; padding: 6px 4px; font-size: 8px; text-transform: uppercase; }
  tbody td { padding: 5px 4px; border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #f5f3ff; }
  tfoot td { padding: 8px 4px; border-top: 2px solid #7c3aed; font-weight: 800; background: #f5f3ff; font-size: 10px; }
  .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body>

<div class="hdr">
  <div><div class="brand">WaveCore ERP</div><div class="brand-sub">Human Resources · Payroll Register</div></div>
  <div class="doc-title"><h1>PAYROLL REGISTER</h1><div class="num">${periodLabel}</div></div>
</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${rows.length}</div><div class="stat-label">Payslips</div></div>
  <div class="stat"><div class="stat-num" style="color:#7c3aed">${Math.round(totalGross).toLocaleString()}</div><div class="stat-label">Gross</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${Math.round(totalPaye).toLocaleString()}</div><div class="stat-label">PAYE</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${Math.round(totalNssf).toLocaleString()}</div><div class="stat-label">NSSF</div></div>
  <div class="stat"><div class="stat-num" style="color:#dc2626">${Math.round(totalShif).toLocaleString()}</div><div class="stat-label">SHIF</div></div>
  <div class="stat"><div class="stat-num" style="color:#16a34a">${Math.round(totalNet).toLocaleString()}</div><div class="stat-label">Net Pay</div></div>
</div>

<div class="section-title">Employee Payslips (${rows.length})</div>
<table>
  <thead><tr>
    <th style="text-align:center">#</th>
    <th>Employee</th>
    <th>Department</th>
    <th style="text-align:right">Gross</th>
    <th style="text-align:right">PAYE</th>
    <th style="text-align:right">NSSF</th>
    <th style="text-align:right">SHIF</th>
    <th style="text-align:right">Housing</th>
    <th style="text-align:right">Total Ded.</th>
    <th style="text-align:right">Net Pay</th>
  </tr></thead>
  <tbody>${bodyRows || '<tr><td colspan="10" style="text-align:center;color:#9ca3af;padding:24px">No payroll items for this period yet</td></tr>'}</tbody>
  ${rows.length > 0 ? `<tfoot>
    <tr>
      <td colspan="3">TOTALS (${rows.length} employees)</td>
      <td style="text-align:right">${Math.round(totalGross).toLocaleString()}</td>
      <td style="text-align:right">${Math.round(totalPaye).toLocaleString()}</td>
      <td style="text-align:right">${Math.round(totalNssf).toLocaleString()}</td>
      <td style="text-align:right">${Math.round(totalShif).toLocaleString()}</td>
      <td style="text-align:right">—</td>
      <td style="text-align:right">${Math.round(totalDed).toLocaleString()}</td>
      <td style="text-align:right">${Math.round(totalNet).toLocaleString()}</td>
    </tr>
  </tfoot>` : ''}
</table>

<div class="footer"><p>Generated by WaveCore ERP · Statutory values computed per Kenya tax rules · © ${new Date().getFullYear()} IntelliWavve</p></div>

<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Payroll PDF error:', error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}