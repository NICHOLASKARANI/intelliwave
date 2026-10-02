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
const fmtDate = (d: any) => d ? new Date(d).toISOString().slice(0, 10) : ''

/**
 * GET /api/wavecore/procurement/aging/export
 * CSV download of the aging report. Read-only. Tenant-scoped.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const orgId = g.organizationId

  const r = await pool.query(
    `SELECT si.id,
            si."invoiceNumber" AS "invoiceNumber",
            si."supplierName"  AS "supplierName",
            si.currency,
            si.total,
            si."invoiceDate"   AS "invoiceDate",
            si."dueDate"       AS "dueDate",
            si.status,
            si."matchStatus"   AS "matchStatus",
            po.number          AS "poNumber"
     FROM "SupplierInvoice" si
     LEFT JOIN "PurchaseOrder" po ON po.id = si."purchaseOrderId"
     WHERE si."organizationId" = $1
       AND si.status NOT IN ('CANCELLED','PAID')
     ORDER BY si."dueDate" ASC NULLS LAST, si."createdAt" ASC`,
    [orgId]
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const DAY = 86400000

  const bucketOf = (daysOverdue: number | null): string => {
    if (daysOverdue == null) return 'No due date'
    if (daysOverdue < 0) return 'Not yet due'
    if (daysOverdue <= 30) return '0-30'
    if (daysOverdue <= 60) return '31-60'
    if (daysOverdue <= 90) return '61-90'
    return '90+'
  }

  const header = [
    'InvoiceNumber',
    'Supplier',
    'InvoiceDate',
    'DueDate',
    'Currency',
    'Amount',
    'Status',
    'MatchStatus',
    'PONumber',
    'DaysOverdue',
    'Bucket',
  ].join(',')

  const body = r.rows.map((row: any) => {
    let daysOverdue: number | null = null
    if (row.dueDate) {
      daysOverdue = Math.floor((todayMs - new Date(row.dueDate).getTime()) / DAY)
    }
    return [
      escCsv(row.invoiceNumber),
      escCsv(row.supplierName),
      escCsv(fmtDate(row.invoiceDate)),
      escCsv(fmtDate(row.dueDate)),
      escCsv(row.currency || 'KES'),
      escCsv(fmt(row.total)),
      escCsv(row.status),
      escCsv(row.matchStatus),
      escCsv(row.poNumber),
      escCsv(daysOverdue == null ? '' : daysOverdue),
      escCsv(bucketOf(daysOverdue)),
    ].join(',')
  }).join('\n')

  const csv = header + '\n' + body + '\n'
  const stamp = new Date().toISOString().slice(0, 10)
  const filename = 'aging-' + stamp + '.csv'

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
})