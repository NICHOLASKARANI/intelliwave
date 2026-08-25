export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    const result = await pool.query(
      `SELECT ci.id, ci.number, ci."dueDate", ci.total,
              c.name as customer_name,
              ci.status,
              ci."createdAt",
              (ci.total - COALESCE((SELECT SUM(cp.amount) FROM "CustomerPayment" cp WHERE cp."invoiceId" = ci.id), 0)) as balance_due
       FROM "CustomerInvoice" ci
       JOIN "Customer" c ON c.id = ci."customerId"
       WHERE ci."organizationId" = $1
         AND ci.status IN ('SENT', 'OVERDUE', 'PARTIALLY_PAID')
       ORDER BY ci."dueDate" ASC
       LIMIT 50`,
      [orgId]
    )

    return NextResponse.json({ receivables: result.rows })
  } catch (error) {
    console.error('AccountsReceivable error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}