export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/quotations/[id]
 * Returns header + line items + linked customer + linked sales orders.
 * Read-only. Tenant-scoped.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    const qRes = await pool.query(
      `SELECT q.*, c.name AS "customerName", c.email AS "customerEmail",
              c.phone AS "customerPhone", c.company AS "customerCompany",
              c.address AS "customerAddress", c.city AS "customerCity"
       FROM "Quotation" q
       LEFT JOIN "Customer" c ON c.id = q."customerId"
       WHERE q.id = $1 AND q."organizationId" = $2`,
      [params.id, orgId]
    )
    if (qRes.rowCount === 0) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }
    const quotation = qRes.rows[0]

    const [itemsRes, ordersRes] = await Promise.all([
      pool.query(
        `SELECT id, description, quantity, "unitPrice", total, "createdAt"
         FROM "QuotationItem"
         WHERE "quotationId" = $1
         ORDER BY "createdAt" ASC`,
        [params.id]
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, number, status, total, "createdAt"
         FROM "SalesOrder"
         WHERE "quotationId" = $1 AND "organizationId" = $2
         ORDER BY "createdAt" DESC`,
        [params.id, orgId]
      ).catch(() => ({ rows: [] })),
    ])

    return NextResponse.json({
      quotation,
      items: itemsRes.rows,
      linkedOrders: ordersRes.rows,
    })
  } catch (error: any) {
    console.error('Quotation GET-by-id error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}