export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/orders/[id]
 * Returns header + line items + customer snapshot + linked quotation.
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

    const oRes = await pool.query(
      `SELECT so.*, c.name AS "customerName", c.email AS "customerEmail",
              c.phone AS "customerPhone", c.company AS "customerCompany",
              c.address AS "customerAddress", c.city AS "customerCity",
              q.number AS "quotationNumber", q.id AS "quotationIdLink"
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       LEFT JOIN "Quotation" q ON q.id = so."quotationId"
       WHERE so.id = $1 AND so."organizationId" = $2`,
      [params.id, orgId]
    )
    if (oRes.rowCount === 0) {
      return NextResponse.json({ error: 'Sales order not found' }, { status: 404 })
    }
    const order = oRes.rows[0]

    const itemsRes = await pool.query(
      `SELECT id, description, quantity, "unitPrice", total, "createdAt"
       FROM "SalesOrderItem"
       WHERE "salesOrderId" = $1
       ORDER BY "createdAt" ASC`,
      [params.id]
    ).catch(() => ({ rows: [] }))

    return NextResponse.json({
      order,
      items: itemsRes.rows,
    })
  } catch (error: any) {
    console.error('Order GET-by-id error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}