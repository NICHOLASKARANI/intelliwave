export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.organizationId

    const [
      revenue,
      receivables,
      payables,
      customers,
      products,
      employees,
      invoices,
      journalEntries,
      projects,
      tickets,
    ] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(subtotal + "taxAmount"), 0) as total FROM "CustomerInvoice"
         WHERE "organizationId" = $1 AND status IN ('PAID','PARTIALLY_PAID') AND date >= date_trunc('month', CURRENT_DATE)`,
        [orgId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(subtotal + "taxAmount"), 0) as total FROM "CustomerInvoice"
         WHERE "organizationId" = $1 AND status IN ('SENT','PARTIALLY_PAID','OVERDUE')`,
        [orgId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM "CustomerPayment"
         WHERE "organizationId" = $1`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM "Customer" WHERE "organizationId" = $1`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM "Product" WHERE "organizationId" = $1`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM "Employee" WHERE "organizationId" = $1`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM "CustomerInvoice" WHERE "organizationId" = $1`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM "JournalEntry" WHERE "organizationId" = $1`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM "Project"`,
        []
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM "SupportTicket" WHERE "userId" = $1`,
        [session.userId]
      ),
    ])

    return NextResponse.json({
      kpis: {
        revenueMTD: parseFloat(revenue.rows[0]?.total || '0'),
        outstandingReceivables: parseFloat(receivables.rows[0]?.total || '0'),
        totalPayments: parseFloat(payables.rows[0]?.total || '0'),
        activeCustomers: parseInt(customers.rows[0]?.count || '0'),
        inventoryItems: parseInt(products.rows[0]?.count || '0'),
        employees: parseInt(employees.rows[0]?.count || '0'),
        invoiceCount: parseInt(invoices.rows[0]?.count || '0'),
        journalEntries: parseInt(journalEntries.rows[0]?.count || '0'),
        projects: parseInt(projects.rows[0]?.count || '0'),
        tickets: parseInt(tickets.rows[0]?.count || '0'),
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics: ' + error.message }, { status: 500 })
  }
}