export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

function escCsv(s: any): string {
  if (s === null || s === undefined) return ''
  const v = String(s)
  if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
  return v
}

const fmt = (n: any) => Number(n || 0).toFixed(2)

/**
 * GET /api/wavecore/procurement/payment-runs/[id]/export
 * Returns a CSV bank file for the run.
 * Allowed when status ∈ { APPROVED, EXECUTED }.
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'EXPORT')
  const id = ctx.params.id

  const r = await pool.query(
    `SELECT * FROM "PaymentRun" WHERE id = $1 AND "organizationId" = $2`,
    [id, g.organizationId]
  )
  if (r.rowCount === 0) return NextResponse.json({ error: 'Payment run not found' }, { status: 404 })
  const run = r.rows[0]
  if (!['APPROVED','EXECUTED'].includes(run.status)) {
    return NextResponse.json({ error: 'Export allowed only for APPROVED or EXECUTED runs' }, { status: 409 })
  }

  const linesRes = await pool.query(
    `SELECT l.*, s."taxPin" AS "supplierTaxPin", s.email AS "supplierEmail"
     FROM "PaymentRunLine" l
     LEFT JOIN "Supplier" s ON s.id = l."supplierId"
     WHERE l."paymentRunId" = $1 AND l."organizationId" = $2
     ORDER BY l."createdAt" ASC`,
    [id, g.organizationId]
  )

  const header = [
    'LineNumber',
    'InvoiceNumber',
    'SupplierName',
    'SupplierTaxPin',
    'SupplierEmail',
    'Amount',
    'Currency',
    'PaymentReference',
    'Status',
  ].join(',')

  const body = linesRes.rows.map((l: any, i: number) => [
    escCsv(i + 1),
    escCsv(l.invoiceNumber),
    escCsv(l.supplierName),
    escCsv(l.supplierTaxPin),
    escCsv(l.supplierEmail),
    escCsv(fmt(l.amount)),
    escCsv(l.currency || run.currency),
    escCsv(l.paymentReference || run.runNumber),
    escCsv(l.status),
  ].join(',')).join('\n')

  const csv = header + '\n' + body + '\n'

  const filename = (run.runNumber || 'payment-run') + '.csv'

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
})