export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)

    const [
      userCount,
      customerCount,
      productCount,
      employeeCount,
      invoiceCount,
      subscription,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM "_OrganizationMembers" om WHERE om."A" = $1`,
        [session.organizationId]
      ),
      pool.query('SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query('SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query('SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [session.organizationId]),
      pool.query(
        'SELECT plan, status, "trialEndsAt", amount FROM "Subscription" WHERE "organizationId" = $1',
        [session.organizationId]
      ),
    ])

    return NextResponse.json({
      summary: {
        users: parseInt(userCount.rows[0].count),
        customers: parseInt(customerCount.rows[0].count),
        products: parseInt(productCount.rows[0].count),
        employees: parseInt(employeeCount.rows[0].count),
        invoices: parseInt(invoiceCount.rows[0].count),
        subscription: subscription.rows[0] || null,
      },
    })
  } catch (error) {
    console.error('Admin summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}