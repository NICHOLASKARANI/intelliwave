export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/search?q=acme&limit=5
 *
 * Global search across customers, leads, opportunities, quotations,
 * and sales orders. Matches by name / number / email / phone (case
 * insensitive, LIKE).
 *
 * Read-only. Tenant-scoped. Never writes.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const q = String(searchParams.get('q') || '').trim()
    const limit = Math.max(1, Math.min(20, parseInt(searchParams.get('limit') || '5')))

    if (q.length < 2) {
      return NextResponse.json({
        query: q,
        results: { customers: [], leads: [], opportunities: [], quotations: [], orders: [] },
        totalCount: 0,
      })
    }

    const like = '%' + q.toLowerCase() + '%'

    const [customers, leads, opportunities, quotations, orders] = await Promise.all([
      pool.query(
        `SELECT id, name, email, phone, company, status
         FROM "Customer"
         WHERE "organizationId" = $1
           AND (LOWER(name) LIKE $2 OR LOWER(COALESCE(email,'')) LIKE $2
                OR COALESCE(phone,'') LIKE $2 OR LOWER(COALESCE(company,'')) LIKE $2)
         ORDER BY "createdAt" DESC
         LIMIT $3`,
        [orgId, like, limit]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, name, email, phone, company, status
         FROM "Lead"
         WHERE "organizationId" = $1
           AND (LOWER(name) LIKE $2 OR LOWER(COALESCE(email,'')) LIKE $2
                OR COALESCE(phone,'') LIKE $2 OR LOWER(COALESCE(company,'')) LIKE $2)
         ORDER BY "createdAt" DESC
         LIMIT $3`,
        [orgId, like, limit]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT o.id, o.name, o.amount, o.stage, c.name AS "customerName"
         FROM "Opportunity" o
         LEFT JOIN "Customer" c ON c.id = o."customerId"
         WHERE o."organizationId" = $1
           AND (LOWER(o.name) LIKE $2 OR LOWER(COALESCE(c.name,'')) LIKE $2)
         ORDER BY o."createdAt" DESC
         LIMIT $3`,
        [orgId, like, limit]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT q.id, q.number, q.status, q.total, c.name AS "customerName"
         FROM "Quotation" q
         LEFT JOIN "Customer" c ON c.id = q."customerId"
         WHERE q."organizationId" = $1
           AND (LOWER(q.number) LIKE $2 OR LOWER(COALESCE(c.name,'')) LIKE $2)
         ORDER BY q."createdAt" DESC
         LIMIT $3`,
        [orgId, like, limit]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT so.id, so.number, so.status, so.total, c.name AS "customerName"
         FROM "SalesOrder" so
         LEFT JOIN "Customer" c ON c.id = so."customerId"
         WHERE so."organizationId" = $1
           AND (LOWER(so.number) LIKE $2 OR LOWER(COALESCE(c.name,'')) LIKE $2)
         ORDER BY so."createdAt" DESC
         LIMIT $3`,
        [orgId, like, limit]
      ).catch(() => ({ rows: [] })),
    ])

    const totalCount =
      customers.rows.length +
      leads.rows.length +
      opportunities.rows.length +
      quotations.rows.length +
      orders.rows.length

    return NextResponse.json({
      query: q,
      results: {
        customers: customers.rows,
        leads: leads.rows,
        opportunities: opportunities.rows,
        quotations: quotations.rows,
        orders: orders.rows,
      },
      totalCount,
    })
  } catch (error: any) {
    console.error('CRM search error:', (error as Error).message)
    return NextResponse.json({
      query: '', results: { customers: [], leads: [], opportunities: [], quotations: [], orders: [] }, totalCount: 0,
    }, { status: 500 })
  }
}