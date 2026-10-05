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
 * GET /api/wavecore/finance/ar/aging
 * Customer invoice aging by days overdue (net of payments).
 * Read-only. Tenant-scoped.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const r = await pool.query(
      `SELECT ci.id, ci.number, ci.total, ci."dueDate", ci.status, ci.date,
              c.name AS "customerName",
              COALESCE((SELECT SUM(cp.amount) FROM "CustomerPayment" cp WHERE cp."invoiceId" = ci.id), 0) AS "paidAmount"
       FROM "CustomerInvoice" ci
       LEFT JOIN "Customer" c ON c.id = ci."customerId"
       WHERE ci."organizationId" = $1
         AND ci.status NOT IN ('CANCELLED','PAID')
       ORDER BY ci."dueDate" ASC NULLS LAST`,
      [orgId]
    )

    const today = new Date(); today.setHours(0,0,0,0)
    const todayMs = today.getTime()

    const invoices = r.rows.map((row: any) => {
      const dueMs = row.dueDate ? new Date(row.dueDate).getTime() : null
      const daysOverdue = dueMs != null ? Math.floor((todayMs - dueMs) / DAY) : null
      const total = Number(row.total || 0)
      const paid = Number(row.paidAmount || 0)
      const due = Math.max(0, total - paid)
      return {
        id: row.id,
        number: row.number,
        customerName: row.customerName || '—',
        total,
        paidAmount: paid,
        balanceDue: due,
        dueDate: row.dueDate,
        invoiceDate: row.date,
        status: row.status,
        daysOverdue,
        bucket: bucketOf(daysOverdue),
      }
    })

    const sum = (arr: any[]) => arr.reduce((s, x) => s + Number(x.balanceDue || 0), 0)
    const byBucket = {
      current: invoices.filter(i => i.bucket === 'current'),
      d0_30:   invoices.filter(i => i.bucket === 'd0_30'),
      d31_60:  invoices.filter(i => i.bucket === 'd31_60'),
      d61_90:  invoices.filter(i => i.bucket === 'd61_90'),
      d90plus: invoices.filter(i => i.bucket === 'd90plus'),
    }

    const byCustomerMap: Record<string, any> = {}
    for (const inv of invoices) {
      const key = inv.customerName || '(no customer)'
      if (!byCustomerMap[key]) {
        byCustomerMap[key] = { customerName: key, current: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0, total: 0, invoices: 0 }
      }
      const s = byCustomerMap[key]
      s[inv.bucket as Bucket] += inv.balanceDue
      s.total += inv.balanceDue
      s.invoices += 1
    }
    const byCustomer = Object.values(byCustomerMap).sort((a: any, b: any) => b.total - a.total)

    return NextResponse.json({
      asOf: new Date().toISOString(),
      invoices,
      byCustomer,
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
    console.error('[ar/aging]', error)
    return NextResponse.json({ invoices: [], byCustomer: [], totals: {}, error: 'Failed to load' }, { status: 500 })
  }
}