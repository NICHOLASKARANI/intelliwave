export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, procurementHandler } from '@/lib/wavecore/procurement-guard'
import { computeSpendAnalytics, SpendDimension, RawInvoiceRow } from '@/lib/wavecore/procurement-spend'

const ALLOWED_DIMS: SpendDimension[] = ['supplier','category','month','status','currency']

/**
 * GET /api/wavecore/procurement/spend/analytics
 * Query params:
 *   dimension  = supplier | category | month | status | currency   (default: supplier)
 *   fromDate   = ISO date (default: 12 months ago)
 *   toDate     = ISO date (default: now)
 *   currency   = filter to single currency (optional)
 *   limit      = top N (default 20; 0 = all)
 */
export const GET = procurementHandler(async (request: NextRequest) => {
  const g = await assertProcurement(request, 'READ')
  const { searchParams } = new URL(request.url)

  const dimensionRaw = (searchParams.get('dimension') || 'supplier').toLowerCase() as SpendDimension
  const dimension = ALLOWED_DIMS.includes(dimensionRaw) ? dimensionRaw : 'supplier'

  const now = new Date()
  const defaultFrom = new Date(now); defaultFrom.setMonth(now.getMonth() - 12)
  const fromDate = searchParams.get('fromDate') || defaultFrom.toISOString().slice(0, 10)
  const toDate = searchParams.get('toDate') || now.toISOString().slice(0, 10)
  const currency = searchParams.get('currency')
  const limit = Math.max(0, parseInt(searchParams.get('limit') || '20', 10) || 20)

  const where: string[] = [
    'si."organizationId" = $1',
    'si."invoiceDate" >= $2::timestamp',
    'si."invoiceDate" <= ($3::timestamp + interval \'1 day\')',
  ]
  const params: any[] = [g.organizationId, fromDate, toDate]

  // Exclude drafts and cancelled
  where.push(`si.status NOT IN ('DRAFT','CANCELLED')`)

  if (currency) {
    params.push(currency)
    where.push('si.currency = $' + params.length)
  }

  const whereSQL = where.join(' AND ')

  // The category dimension needs to reach into the PO to get a category/type.
  // PO table has `type` (STANDARD / INVENTORY / etc.) — we surface that as category.
  const r = await pool.query(
    `SELECT
       si.id, si."supplierId", si."supplierName",
       si.currency, si.total, si.status, si."invoiceDate", si."createdAt",
       po.type AS "poCategory"
     FROM "SupplierInvoice" si
     LEFT JOIN "PurchaseOrder" po ON po.id = si."purchaseOrderId"
     WHERE ${whereSQL}`,
    params
  )

  const rows: RawInvoiceRow[] = r.rows.map((x: any) => ({
    id: x.id,
    supplierId: x.supplierId,
    supplierName: x.supplierName,
    currency: x.currency,
    total: Number(x.total || 0),
    status: x.status,
    invoiceDate: x.invoiceDate ? new Date(x.invoiceDate).toISOString() : null,
    createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
    poCategory: x.poCategory || null,
  }))

  const result = computeSpendAnalytics(rows, dimension, fromDate, toDate, limit)

  return NextResponse.json(result)
})