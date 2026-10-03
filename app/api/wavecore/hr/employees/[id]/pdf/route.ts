export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

function esc(s: any): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtDateTime = (d: any) => d ? new Date(d).toLocaleString('en-GB') : '—'
const fmtMoney = (n: any, cur = 'KES') => cur + ' ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const mask = (s: any) => {
  if (!s) return '—'
  const v = String(s)
  if (v.length <= 4) return '••••'
  return '••••' + v.slice(-4)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const r = await pool.query(
      `SELECT * FROM "Employee" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (r.rowCount === 0) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    const emp = r.rows[0]

    const [orgRes, deptRes] = await Promise.all([
      pool.query(`SELECT name FROM "Organization" WHERE id = $1`, [orgId]).catch(() => ({ rows: [] })),
      pool.query(`SELECT name FROM "Department" WHERE id = $1`, [emp.department]).catch(() => ({ rows: [] })),
    ])
    const orgName = orgRes.rows[0]?.name || 'Organization'
    const deptName = deptRes.rows[0]?.name || emp.department || '—'

    const statusColor = (s: string) =>
      s === 'ACTIVE' ? '#16a34a' :
      s === 'ON_LEAVE' ? '#ca8a04' :
      s === 'PROBATION' ? '#0891b2' :
      s === 'SUSPENDED' ? '#ea580c' :
      s === 'TERMINATED' ? '#dc2626' :
      '#6b7280'

    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim()

    const field = (label: string, value: any) => `
      <div class="field">
        <span class="label">${esc(label)}</span>
        <span class="value">${value === '' || value === null || value === undefined ? '—' : value}</span>
      </div>`

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Employee ${esc(emp.employeeId)} — ${esc(fullName)}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; font-size: 12px; }
  .hdr { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { font-size: 22px; font-weight: 800; color: #2563eb; }
  .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h1 { margin: 0; font-size: 20px; letter-spacing: 0.3px; }
  .doc-title .num { font-family: 'Courier New', monospace; font-size: 12px; color: #2563eb; margin-top: 3px; font-weight: 700; }
  .name-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
  .name { font-size: 20px; font-weight: 800; }
  .name .sub { font-size: 11px; color: #6b7280; font-weight: 500; margin-top: 3px; }
  .stamp { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.4px; }
  .section-title { font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #dbeafe; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; row-gap: 8px; }
  .field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f3f4f6; font-size: 11px; }
  .field .label { color: #6b7280; font-weight: 500; }
  .field .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; }
  .muted { color: #9ca3af; font-size: 10px; }
  .notes { margin-top: 8px; padding: 10px; background: #f9fafb; border-left: 3px solid #2563eb; font-size: 11px; white-space: pre-wrap; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>

<div class="hdr">
  <div>
    <div class="brand">${esc(orgName)}</div>
    <div class="brand-sub">Employee Profile</div>
  </div>
  <div class="doc-title">
    <h1>${esc(emp.employeeId || '')}</h1>
    <div class="num">Generated ${new Date().toLocaleDateString('en-GB')}</div>
  </div>
</div>

<div class="name-row">
  <div>
    <div class="name">${esc(fullName)}</div>
    <div class="sub">
      ${esc(emp.preferredName ? '(' + emp.preferredName + ') · ' : '')}
      ${esc(emp.jobTitle || emp.position || 'No position')} · ${esc(deptName)}
    </div>
  </div>
  <div>
    <span class="stamp" style="background:${statusColor(emp.status)}22;color:${statusColor(emp.status)}">${esc(emp.status || '—')}</span>
  </div>
</div>

<h2 class="section-title">Identity</h2>
<div class="grid">
  ${field('Employee Code', esc(emp.employeeId))}
  ${field('Employment Type', esc(emp.employmentType))}
  ${field('First Name', esc(emp.firstName))}
  ${field('Preferred Name', esc(emp.preferredName))}
  ${field('Last Name', esc(emp.lastName))}
  ${field('Date of Birth', fmtDate(emp.dateOfBirth))}
  ${field('Gender', esc(emp.gender))}
  ${field('Marital Status', esc(emp.maritalStatus))}
  ${field('Nationality', esc(emp.nationality))}
  ${field('ID Number', esc(emp.idNumber))}
  ${field('Tax PIN (KRA)', esc(emp.taxPin))}
  ${field('NSSF Number', esc(emp.nssfNumber))}
  ${field('NHIF Number', esc(emp.nhifNumber))}
</div>

<h2 class="section-title">Contact</h2>
<div class="grid">
  ${field('Email', esc(emp.email))}
  ${field('Phone', esc(emp.phone))}
  ${field('Address', esc(emp.address))}
  ${field('City', esc(emp.city))}
  ${field('Country', esc(emp.country))}
  ${field('Emergency Contact', esc(emp.emergencyContact))}
  ${field('Emergency Phone', esc(emp.emergencyPhone))}
</div>

<h2 class="section-title">Employment</h2>
<div class="grid">
  ${field('Department', esc(deptName))}
  ${field('Position', esc(emp.position))}
  ${field('Job Title', esc(emp.jobTitle))}
  ${field('Job Family', esc(emp.jobFamily))}
  ${field('Grade', esc(emp.grade))}
  ${field('Division', esc(emp.division))}
  ${field('Branch', esc(emp.branch))}
  ${field('Cost Center', esc(emp.costCenter))}
  ${field('Reporting Manager', esc(emp.reportingManagerId))}
  ${field('Hire Date', fmtDate(emp.hireDate))}
  ${field('Termination Date', fmtDate(emp.terminationDate))}
  ${field('Status', esc(emp.status))}
</div>

<h2 class="section-title">Payment</h2>
<div class="grid">
  ${field('Salary', fmtMoney(emp.salary, emp.currency || 'KES'))}
  ${field('Currency', esc(emp.currency))}
  ${field('Bank Name', esc(emp.bankName))}
  ${field('Bank Account', mask(emp.bankAccount))}
</div>

${emp.notes ? '<h2 class="section-title">Notes</h2><div class="notes">' + esc(emp.notes) + '</div>' : ''}

<div class="footer">
  Generated by WaveCore ERP · ${fmtDateTime(new Date().toISOString())}<br>
  This document contains personal information. Handle per data-protection policy.
</div>

</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[employee-pdf]', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}