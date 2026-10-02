export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'

/**
 * GET /api/wavecore/procurement/aging
 *
 * Read-only supplier-invoice aging report.
 * Buckets: 0-30 / 31-60 / 61-90 / 90+ days overdue.
 * Excludes CANCELLED and PAID. Tenant-scoped. Never writes.
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const orgId = g.organizationId
  const LIMIT = 500

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
     ORDER BY si."dueDate" ASC NULLS LAST, si."createdAt" ASC
     LIMIT ${LIMIT}`,
    [orgId]
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  const DAY = 86400000

  type Bucket = '0_30' | '31_60' | '61_90' | '90plus' | 'notYetDue' | 'noDueDate'

  const rows = r.rows.map((row: any) => {
    let daysOverdue: number | null = null
    let bucket: Bucket = 'noDueDate'

    if (row.dueDate) {
      const dueMs = new Date(row.dueDate).getTime()
      const diffDays = Math.floor((todayMs - dueMs) / DAY)
      daysOverdue = diffDays
      if (diffDays < 0)         bucket = 'notYetDue'
      else if (diffDays <= 30)  bucket = '0_30'
      else if (diffDays <= 60)  bucket = '31_60'
      else if (diffDays <= 90)  bucket = '61_90'
      else                      bucket = '90plus'
    }

    return {
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      supplierName: row.supplierName,
      currency: row.currency || 'KES',
      total: Number(row.total || 0),
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,
      status: row.status,
      matchStatus: row.matchStatus,
      poNumber: row.poNumber,
      daysOverdue,
      bucket,
    }
  })

  const sum = (arr: any[]) => arr.reduce((s, x) => s + Number(x.total || 0), 0)

  const overdueRows    = rows.filter((x: any) => x.daysOverdue != null && x.daysOverdue > 0)
  const due7Rows       = rows.filter((x: any) => x.daysOverdue != null && x.daysOverdue < 0 && x.daysOverdue >= -7)
  const due30Rows      = rows.filter((x: any) => x.daysOverdue != null && x.daysOverdue < 0 && x.daysOverdue >= -30)
  const bucket0_30     = overdueRows.filter((x: any) => x.bucket === '0_30')
  const bucket31_60    = overdueRows.filter((x: any) => x.bucket === '31_60')
  const bucket61_90    = overdueRows.filter((x: any) => x.bucket === '61_90')
  const bucket90plus   = overdueRows.filter((x: any) => x.bucket === '90plus')
  const noDueDateRows  = rows.filter((x: any) => x.bucket === 'noDueDate')

  const kpis = {
    totalOutstanding: sum(rows),
    totalCount: rows.length,

    overdueAmount: sum(overdueRows),
    overdueCount: overdueRows.length,

    due7Amount: sum(due7Rows),
    due7Count: due7Rows.length,

    due30Amount: sum(due30Rows),
    due30Count: due30Rows.length,

    noDueDateAmount: sum(noDueDateRows),
    noDueDateCount: noDueDateRows.length,

    bucket0_30Amount: sum(bucket0_30),
    bucket0_30Count: bucket0_30.length,

    bucket31_60Amount: sum(bucket31_60),
    bucket31_60Count: bucket31_60.length,

    bucket61_90Amount: sum(bucket61_90),
    bucket61_90Count: bucket61_90.length,

    bucket90plusAmount: sum(bucket90plus),
    bucket90plusCount: bucket90plus.length,
  }

  return NextResponse.json({
    kpis,
    invoices: rows,
    generatedAt: new Date().toISOString(),
  })
})