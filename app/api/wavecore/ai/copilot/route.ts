export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const [
      customers,
      leads,
      opportunities,
      products,
      invoices,
      employees,
      projects,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "Customer" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Lead" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Opportunity" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Product" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "CustomerInvoice" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Employee" WHERE "organizationId" = $1', [orgId]),
      pool.query('SELECT COUNT(*) FROM "Project" WHERE "organizationId" = $1', [orgId]),
    ])

    const insights: string[] = []

    if (parseInt(customers.rows[0].count) === 0) insights.push('No customers yet. Add your first customer in CRM.')
    if (parseInt(products.rows[0].count) === 0) insights.push('No products in inventory. Add products to track stock.')
    if (parseInt(invoices.rows[0].count) === 0) insights.push('No invoices created. Start billing customers.')
    if (parseInt(employees.rows[0].count) === 0) insights.push('No employees registered. Set up HR module.')
    if (insights.length === 0) insights.push('All modules have data. Your ERP is well set up!')

    return NextResponse.json({
      success: true,
      data: {
        crm: {
          customers: parseInt(customers.rows[0].count),
          leads: parseInt(leads.rows[0].count),
          opportunities: parseInt(opportunities.rows[0].count),
        },
        inventory: { products: parseInt(products.rows[0].count) },
        finance: { invoices: parseInt(invoices.rows[0].count) },
        hr: { employees: parseInt(employees.rows[0].count) },
        projects: { total: parseInt(projects.rows[0].count) },
      },
      insights,
    })
  } catch (error) {
    console.error('AI copilot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}