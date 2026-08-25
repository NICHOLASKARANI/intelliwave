export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { logger } from '@/lib/wavecore/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = `%${query}%`
    const results: any[] = []

    // Search Customers
    if (type === 'all' || type === 'customers') {
      const customers = await pool.query(
        `SELECT id, name, email, phone, 'customer' as type, name as title, email as subtitle
         FROM "Customer"
         WHERE "organizationId" = $1 AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)
         LIMIT $3`,
        [orgId, searchTerm, limit]
      )
      results.push(...customers.rows)
    }

    // Search Products
    if (type === 'all' || type === 'products') {
      const products = await pool.query(
        `SELECT id, name, sku, category, 'product' as type, name as title, sku as subtitle
         FROM "Product"
         WHERE "organizationId" = $1 AND (name ILIKE $2 OR sku ILIKE $2 OR category ILIKE $2)
         LIMIT $3`,
        [orgId, searchTerm, limit]
      )
      results.push(...products.rows)
    }

    // Search Invoices
    if (type === 'all' || type === 'invoices') {
      const invoices = await pool.query(
        `SELECT ci.id, ci.number, ci.status, ci.total, 'invoice' as type, ci.number as title, 
                c.name as subtitle
         FROM "CustomerInvoice" ci
         JOIN "Customer" c ON c.id = ci."customerId"
         WHERE ci."organizationId" = $1 AND ci.number ILIKE $2
         LIMIT $3`,
        [orgId, searchTerm, limit]
      )
      results.push(...invoices.rows)
    }

    // Search Employees
    if (type === 'all' || type === 'employees') {
      const employees = await pool.query(
        `SELECT id, "firstName", "lastName", email, department, 'employee' as type,
                CONCAT("firstName", ' ', "lastName") as title, department as subtitle
         FROM "Employee"
         WHERE "organizationId" = $1 AND ("firstName" ILIKE $2 OR "lastName" ILIKE $2 OR email ILIKE $2)
         LIMIT $3`,
        [orgId, searchTerm, limit]
      )
      results.push(...employees.rows)
    }

    // Search Projects
    if (type === 'all' || type === 'projects') {
      const projects = await pool.query(
        `SELECT id, title, status, 'project' as type, title, status as subtitle
         FROM "Project"
         WHERE "organizationId" = $1 AND title ILIKE $2
         LIMIT $3`,
        [orgId, searchTerm, limit]
      )
      results.push(...projects.rows)
    }

    // Search Leads
    if (type === 'all' || type === 'leads') {
      const leads = await pool.query(
        `SELECT id, name, email, company, status, 'lead' as type, name as title, company as subtitle
         FROM "Lead"
         WHERE "organizationId" = $1 AND (name ILIKE $2 OR email ILIKE $2 OR company ILIKE $2)
         LIMIT $3`,
        [orgId, searchTerm, limit]
      )
      results.push(...leads.rows)
    }

    // Sort by relevance (exact match first)
    results.sort((a, b) => {
      const aExact = a.title?.toLowerCase() === query.toLowerCase() ? 0 : 1
      const bExact = b.title?.toLowerCase() === query.toLowerCase() ? 0 : 1
      return aExact - bExact
    })

    logger.info('Search executed', {
      userId: session.userId,
      organizationId: orgId,
      metadata: { query, type, resultCount: results.length },
    })

    return NextResponse.json({ results: results.slice(0, limit) })
  } catch (error: any) {
    logger.error('Search error', { error: (error as Error).message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}