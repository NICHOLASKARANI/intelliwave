export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const DAY = 86400000

type Bucket = 'current' | 'd0_30' | 'd31_60' | 'd61_90' | 'd90plus'

const bucketOf = (days: number | null): Bucket => {
  if (days == null || days <= 0) return 'current'
  if (days <= 30) return 'd0_30'
  if (days <= 60) return 'd31_60'
  if (days <= 90) return 'd61_90'
  return 'd90plus'
}

/**
 * GET /api/wavecore/finance/ap/aging
 * Supplier invoice aging by days overdue.
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const r = await pool.query(
      `SELECT si.id, si."invoiceNumber" AS "invoiceNumber",
              si."supplierName" AS "supplierName", si.currency, si.total,
              si."invoiceDate" AS "invoiceDate", si."dueDate" AS "dueDate",
              si.status
       FROM "SupplierInvoice" si
       WHERE si."organizationId" = $1
         AND si.status NOT IN ('CANCELLED','PAID','REJECTED')
       ORDER BY si."dueDate" ASC NULLS LAST`,
      [orgId]
    )

    const today = new Date(); today.setHours(0,0,0,0)
    const todayMs = today.getTime()

    const invoices = r.rows.map((row: any) => {
      const dueMs = row.dueDate ? new Date(row.dueDate).getTime() : null
      const daysOverdue = dueMs != null ? Math.floor((todayMs - dueMs) / DAY) : null
      return {
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        supplierName: row.supplierName,
        currency: row.currency || 'KES',
        total: Number(row.total || 0),
        invoiceDate: row.invoiceDate,
        dueDate: row.dueDate,
        status: row.status,
        daysOverdue,
        bucket: bucketOf(daysOverdue),
      }
    })

    const sum = (arr: any[]) => arr.reduce((s, x) => s + Number(x.total || 0), 0)
    const byBucket = {
      current:   invoices.filter(i => i.bucket === 'current'),
      d0_30:     invoices.filter(i => i.bucket === 'd0_30'),
      d31_60:    invoices.filter(i => i.bucket === 'd31_60'),
      d61_90:    invoices.filter(i => i.bucket === 'd61_90'),
      d90plus:   invoices.filter(i => i.bucket === 'd90plus'),
    }

    // Group by supplier
    const bySupplierMap: Record<string, { supplierName: string; current: number; d0_30: number; d31_60: number; d61_90: number; d90plus: number; total: number; invoices: number }> = {}
    for (const inv of invoices) {
      const key = inv.supplierName || '(no supplier)'
      if (!bySupplierMap[key]) {
        bySupplierMap[key] = { supplierName: key, current: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0, invoices: 0 }
      }
      const s = bySupplierMap[key]
      s[inv.bucket as Bucket] += inv.total
      s.total += inv.total
      s.invoices += 1
    }
    const bySupplier = Object.values(bySupplierMap).sort((a, b) => b.total - a.total)

    return NextResponse.json({
      asOf: new Date().toISOString(),
      invoices,
      bySupplier,
      totals: {
        total: sum(invoices),
        count: invoices.length,
        current: sum(byBucket.current),
        d0_30: sum(byBucket.d0_30),
        d31_60: sum(byBucket.d31_60),
        d61_90: sum(byBucket.d61_90),
        d90plus: sum(byBucket.d90plus),
        currentCount: byBucket.current.length,
        d0_30Count: byBucket.d0_30.length,
        d31_60Count: byBucket.d31_60.length,
        d61_90Count: byBucket.d61_90.length,
        d90plusCount: byBucket.d90plus.length,
      },
    })
  } catch (error) {
    console.error('[ap/aging]', error)
    return NextResponse.json({ invoices: [], bySupplier: [], totals: {}, error: 'Failed to load' }, { status: 500 })
  }
}