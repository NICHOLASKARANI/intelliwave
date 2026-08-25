export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.organizationId
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      revenue,
      receivables,
      payables,
      customers,
      products,
      employees,
      invoices,
      journalEntries,
      activities,
    ] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(total), 0) as total FROM "CustomerInvoice" 
         WHERE "organizationId" = $1 AND status IN ('PAID','PARTIALLY_PAID') AND date >= $2`,
        [orgId, monthStart]
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
        `SELECT action, "entityType", "createdAt" FROM "AuditLog" 
         WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10`,
        [session.userId]
      ),
    ])

    return NextResponse.json({
      organization: { id: orgId, name: session.orgName },
      user: { id: session.userId, name: session.name, email: session.email, role: session.role },
      kpis: {
        revenueMTD: revenue.rows[0].total,
        outstandingReceivables: receivables.rows[0].total,
        accountsPayable: payables.rows[0].total,
        activeCustomers: parseInt(customers.rows[0].count),
        inventoryItems: parseInt(products.rows[0].count),
        employees: parseInt(employees.rows[0].count),
        invoiceCount: parseInt(invoices.rows[0].count),
        journalEntries: parseInt(journalEntries.rows[0].count),
      },
      recentActivity: activities.rows,
    })
  } catch (error: any) {
    console.error('Dashboard error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}