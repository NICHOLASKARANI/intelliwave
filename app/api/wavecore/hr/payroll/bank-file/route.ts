export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

function escCsv(s: any): string {
  if (s === null || s === undefined) return ''
  const v = String(s)
  if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
  return v
}

const fmt = (n: any) => Number(n || 0).toFixed(2)

/**
 * GET /api/wavecore/hr/payroll/bank-file?periodId=...
 *
 * Returns a CSV salary payment file for the given period — one row
 * per employee. Columns are the common shape Kenyan banks accept for
 * bulk salary upload. Rows with missing bank details are included
 * with an EMPTY account number and a warning comment in a trailing
 * block so the operator can fix before uploading.
 *
 * Guarded with HR_EXPORT. Read-only.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_EXPORT')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')
    if (!periodId) return NextResponse.json({ error: 'periodId is required' }, { status: 400 })

    const periodRes = await pool.query(
      `SELECT id, name, "startDate", "endDate", "paymentDate" FROM "PayrollPeriod"
       WHERE id = $1 AND "organizationId" = $2`,
      [periodId, orgId]
    )
    if (periodRes.rowCount === 0) return NextResponse.json({ error: 'Period not found' }, { status: 404 })
    const period = periodRes.rows[0]

    const r = await pool.query(
      `SELECT pi.id, pi."netPay", pi."payrollPeriodId",
              e."firstName", e."lastName", e."employeeId" AS "empCode",
              e."bankName", e."bankAccount", e.currency
       FROM "PayrollItem" pi
       LEFT JOIN "Employee" e ON e.id = pi."employeeId" AND e."organizationId" = pi."organizationId"
       WHERE pi."organizationId" = $1 AND pi."payrollPeriodId" = $2
       ORDER BY e."firstName" ASC, e."lastName" ASC`,
      [orgId, periodId]
    )

    if (r.rowCount === 0) {
      return NextResponse.json({ error: 'No payslips in this period — run payroll first' }, { status: 409 })
    }

    const header = [
      'LineNumber',
      'EmployeeCode',
      'EmployeeName',
      'BankName',
      'BankAccount',
      'Amount',
      'Currency',
      'Reference',
    ].join(',')

    const refBase = 'SAL-' + (period.name || 'PERIOD').replace(/[^A-Za-z0-9]+/g, '').toUpperCase()

    const warnings: string[] = []
    let index = 0
    const rows = r.rows.map((row: any) => {
      index++
      const name = ((row.firstName || '') + ' ' + (row.lastName || '')).trim()
      const bank = row.bankName || ''
      const acct = row.bankAccount || ''
      if (!bank) warnings.push('Line ' + index + ' (' + name + '): missing bank name')
      if (!acct) warnings.push('Line ' + index + ' (' + name + '): missing bank account')
      const ref = refBase + '-' + (row.empCode || row.id.slice(0, 6))
      return [
        escCsv(index),
        escCsv(row.empCode || ''),
        escCsv(name),
        escCsv(bank),
        escCsv(acct),
        escCsv(fmt(row.netPay)),
        escCsv(row.currency || 'KES'),
        escCsv(ref),
      ].join(',')
    }).join('\n')

    const warningBlock = warnings.length > 0
      ? '\n\n# WARNINGS — fix these before uploading to the bank\n#' +
        warnings.map(w => '\n# ' + w).join('')
      : ''

    const csv = header + '\n' + rows + '\n' + warningBlock + '\n'

    const periodSlug = (period.name || 'period').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()
    const stamp = new Date().toISOString().slice(0, 10)
    const filename = 'bank-file-' + periodSlug + '-' + stamp + '.csv'

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[payroll-bank-file]', error)
    return NextResponse.json({ error: 'Failed to generate bank file' }, { status: 500 })
  }
}