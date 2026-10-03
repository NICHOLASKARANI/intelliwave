export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

function esc(s: any): string {
  if (s === null || s === undefined) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const fmtMoney = (n: any) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB') : '—'

export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const r = await pool.query(
      `SELECT pi.*,
              e."firstName", e."lastName", e."employeeId" AS "empCode", e."jobTitle",
              e.department, e."taxPin", e."nssfNumber", e."nhifNumber", e."bankName", e."bankAccount",
              p.name AS "periodName", p."startDate" AS "periodStart", p."endDate" AS "periodEnd", p."paymentDate" AS "paymentDate"
       FROM "PayrollItem" pi
       LEFT JOIN "Employee" e ON e.id = pi."employeeId" AND e."organizationId" = pi."organizationId"
       LEFT JOIN "PayrollPeriod" p ON p.id = pi."payrollPeriodId" AND p."organizationId" = pi."organizationId"
       WHERE pi.id = $1 AND pi."organizationId" = $2`,
      [params.itemId, orgId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 })

    const item = r.rows[0]
    const orgRes = await pool.query('SELECT name FROM "Organization" WHERE id = $1', [orgId]).catch(() => ({ rows: [] }))
    const orgName = orgRes.rows[0]?.name || 'Organization'

    const gross = Number(item.grossPay || item.basicSalary || 0)
    const allowances = Number(item.allowances || 0)
    const basic = Number(item.basicSalary || gross)
    const paye = Number(item.paye || 0)
    const nssf = Number(item.nssf || 0)
    const shif = Number(item.shif || 0)
    const housing = Number(item.housingLevy || 0)
    const totalDeductions = Number(item.deductions || (paye + nssf + shif + housing))
    const net = Number(item.netPay || (gross - totalDeductions))

    const employeeName = (item.firstName || '') + ' ' + (item.lastName || '')
    const mask = (s: any) => {
      if (!s) return '—'
      const v = String(s)
      return v.length > 4 ? '\u2022\u2022\u2022\u2022' + v.slice(-4) : '\u2022\u2022\u2022\u2022'
    }

    const row = (label: string, value: any, opts?: { bold?: boolean; red?: boolean; green?: boolean; indent?: boolean }) => {
      const cls = (opts?.bold ? 'bold ' : '') + (opts?.red ? 'red ' : '') + (opts?.green ? 'green ' : '') + (opts?.indent ? 'indent' : '')
      return '<tr class="' + cls + '"><td class="lbl">' + esc(label) + '</td><td class="amt">' + value + '</td></tr>'
    }

    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payslip — ' + esc(employeeName) + '</title>' +
      '<style>' +
      '@page { size: A4 portrait; margin: 12mm; }' +
      'body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 0; font-size: 11px; }' +
      '.hdr { display: flex; justify-content: space-between; border-bottom: 3px solid #7c3aed; padding-bottom: 12px; margin-bottom: 16px; }' +
      '.brand { font-size: 20px; font-weight: 800; color: #7c3aed; }' +
      '.brand-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }' +
      '.doc-title h1 { font-size: 18px; margin: 0; letter-spacing: 0.5px; }' +
      '.doc-title .sub { font-size: 10px; color: #7c3aed; font-family: "Courier New", monospace; font-weight: 700; margin-top: 3px; }' +
      '.employee { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 18px; padding: 12px; background: #f9fafb; border-radius: 8px; }' +
      '.employee .k { color: #6b7280; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700; }' +
      '.employee .v { font-weight: 600; font-size: 11px; }' +
      '.section-title { font-size: 11px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 6px; padding-bottom: 4px; border-bottom: 2px solid #ede9fe; }' +
      'table.totals { width: 100%; border-collapse: collapse; }' +
      'table.totals tr { border-bottom: 1px solid #f3f4f6; }' +
      'table.totals td { padding: 6px 4px; }' +
      'table.totals td.lbl { color: #6b7280; }' +
      'table.totals td.amt { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }' +
      'table.totals tr.bold td { font-weight: 800; color: #111827; font-size: 12px; }' +
      'table.totals tr.red td.amt { color: #dc2626; }' +
      'table.totals tr.green td.amt { color: #16a34a; }' +
      'table.totals tr.indent td.lbl { padding-left: 16px; }' +
      '.net-box { margin-top: 12px; padding: 14px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; display: flex; justify-content: space-between; align-items: center; }' +
      '.net-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; opacity: 0.9; }' +
      '.net-box .amount { font-size: 22px; font-weight: 800; }' +
      '.footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center; }' +
      '</style></head><body>' +

      '<div class="hdr">' +
        '<div><div class="brand">' + esc(orgName) + '</div><div class="brand-sub">Employee Payslip</div></div>' +
        '<div class="doc-title"><h1>PAYSLIP</h1><div class="sub">' + esc(item.periodName || '') + '</div></div>' +
      '</div>' +

      '<div class="employee">' +
        '<div><div class="k">Employee</div><div class="v">' + esc(employeeName) + '</div></div>' +
        '<div><div class="k">Employee Code</div><div class="v">' + esc(item.empCode || '—') + '</div></div>' +
        '<div><div class="k">Job Title</div><div class="v">' + esc(item.jobTitle || '—') + '</div></div>' +
        '<div><div class="k">Department</div><div class="v">' + esc(item.department || '—') + '</div></div>' +
        '<div><div class="k">Tax PIN</div><div class="v">' + esc(item.taxPin || '—') + '</div></div>' +
        '<div><div class="k">NSSF No.</div><div class="v">' + esc(item.nssfNumber || '—') + '</div></div>' +
        '<div><div class="k">Period</div><div class="v">' + fmtDate(item.periodStart) + ' → ' + fmtDate(item.periodEnd) + '</div></div>' +
        '<div><div class="k">Payment Date</div><div class="v">' + fmtDate(item.paymentDate) + '</div></div>' +
        '<div><div class="k">Bank</div><div class="v">' + esc(item.bankName || '—') + '</div></div>' +
        '<div><div class="k">Account</div><div class="v">' + esc(mask(item.bankAccount)) + '</div></div>' +
      '</div>' +

      '<div class="section-title">Earnings</div>' +
      '<table class="totals">' +
        row('Basic Salary', fmtMoney(basic)) +
        (allowances > 0 ? row('Allowances', fmtMoney(allowances)) : '') +
        row('Gross Pay', fmtMoney(gross), { bold: true }) +
      '</table>' +

      '<div class="section-title">Statutory Deductions</div>' +
      '<table class="totals">' +
        row('PAYE (Income Tax)', fmtMoney(paye), { red: true }) +
        row('NSSF (Pension)', fmtMoney(nssf), { red: true }) +
        row('SHIF (Health)', fmtMoney(shif), { red: true }) +
        row('Housing Levy', fmtMoney(housing), { red: true }) +
        row('Total Statutory Deductions', fmtMoney(paye + nssf + shif + housing), { bold: true, red: true }) +
      '</table>' +

      '<div class="section-title">Summary</div>' +
      '<table class="totals">' +
        row('Gross Pay', fmtMoney(gross)) +
        row('Total Deductions', fmtMoney(totalDeductions), { red: true }) +
      '</table>' +

      '<div class="net-box">' +
        '<div class="label">Net Pay</div>' +
        '<div class="amount">KSh ' + fmtMoney(net) + '</div>' +
      '</div>' +

      '<div class="section-title">Employer Contributions</div>' +
      '<table class="totals">' +
        row('Employer NSSF (matching)', fmtMoney(nssf)) +
        row('Employer Housing Levy (1.5%)', fmtMoney(housing)) +
        row('Total Employer Cost', fmtMoney(gross + nssf + housing), { bold: true }) +
      '</table>' +

      '<div class="footer">' +
        'This payslip is computer-generated and does not require a signature.<br>' +
        'WaveCore ERP · Statutory values computed per Kenyan tax rules · Generated ' + new Date().toLocaleString('en-GB') +
      '</div>' +

      '<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>' +
      '</body></html>'

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[payslip-pdf]', error)
    return NextResponse.json({ error: 'Failed to generate payslip' }, { status: 500 })
  }
}