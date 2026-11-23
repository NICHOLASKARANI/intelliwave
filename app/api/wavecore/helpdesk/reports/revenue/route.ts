export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    // Total support revenue (all-time) from JEs
    const totalsRes = await pool.query(
      `SELECT COALESCE(SUM(ji.credit), 0) AS total_revenue,
              COUNT(DISTINCT je.id) AS je_count
       FROM "JournalEntry" je
       JOIN "JournalItem" ji ON ji."journalEntryId" = je.id
       JOIN "ChartOfAccount" coa ON coa.id = ji."accountId"
       WHERE je."organizationId" = $1
         AND je.reference LIKE 'HD-%'
         AND coa.code = '4100'`,
      [orgId]
    )
    const totalRevenue = Number(totalsRes.rows[0]?.total_revenue || 0)
    const jeCount = Number(totalsRes.rows[0]?.je_count || 0)

    // Billable tickets summary
    const billableRes = await pool.query(
      `SELECT COUNT(*) AS total_billable,
              COUNT(*) FILTER (WHERE "journalEntryId" IS NOT NULL) AS billed,
              COUNT(*) FILTER (WHERE "journalEntryId" IS NULL AND "billableAmount" > 0) AS pending_billing,
              COALESCE(SUM("billableAmount"), 0) AS total_billable_amount
       FROM "SupportTicket"
       WHERE "organizationId" = $1 AND "billableAmount" > 0`,
      [orgId]
    )

    // Revenue by customer
    const byCustomerRes = await pool.query(
      `SELECT "customerName",
              COALESCE(SUM("billableAmount"), 0) AS billed,
              COUNT(*) AS tickets
       FROM "SupportTicket"
       WHERE "organizationId" = $1 AND "journalEntryId" IS NOT NULL
       GROUP BY "customerName"
       ORDER BY billed DESC
       LIMIT 10`,
      [orgId]
    )

    return NextResponse.json({
      total: { amount: totalRevenue, jeCount },
      billable: {
        totalBillable: Number(billableRes.rows[0]?.total_billable || 0),
        billed: Number(billableRes.rows[0]?.billed || 0),
        pendingBilling: Number(billableRes.rows[0]?.pending_billing || 0),
        totalBillableAmount: Number(billableRes.rows[0]?.total_billable_amount || 0),
      },
      byCustomer: byCustomerRes.rows.map(r => ({
        name: r.customerName || '(unnamed)',
        billed: Number(r.billed),
        tickets: Number(r.tickets),
      })),
    })
  } catch (error) {
    console.error('Helpdesk revenue report error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}