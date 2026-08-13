export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()
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
        `SELECT COALESCE(SUM(total), 0) as total FROM "CustomerInvoice" 
         WHERE "organizationId" = $1 AND status IN ('PAID','PARTIALLY_PAID') AND date >= date_trunc('month', CURRENT_DATE)`,
        [orgId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total), 0) as total FROM "CustomerInvoice" 
         WHERE "organizationId" = $1 AND status IN ('SENT','OVERDUE','PARTIALLY_PAID')`,
        [orgId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total), 0) as total FROM "CustomerInvoice" 
         WHERE "organizationId" = $1 AND status IN ('DRAFT','SENT','OVERDUE')`,
        [orgId]
      ),
      pool.query('SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "JournalEntry" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Project" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "SupportTicket" WHERE "userId" = $1', [session.userId]),
    ])

    return NextResponse.json({
      kpis: {
        revenueMTD: revenue.rows[0].total,
        outstandingReceivables: receivables.rows[0].total,
        accountsPayable: payables.rows[0].total,
        activeCustomers: parseInt(customers.rows[0].count),
        inventoryItems: parseInt(products.rows[0].count),
        employees: parseInt(employees.rows[0].count),
        invoiceCount: parseInt(invoices.rows[0].count),
        journalEntries: parseInt(journalEntries.rows[0].count),
        projects: parseInt(projects.rows[0].count),
        tickets: parseInt(tickets.rows[0].count),
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}