export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

// GET /api/wavve-si/restaurant/orders/[id]
// Returns the order + its line items + customer info
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const orderId = params.id

    // Get the order (must belong to this org)
    const orderResult = await pool.query(
      `SELECT so.id, so.number, so.date, so.status,
              so.subtotal, so."taxAmount", so.total,
              so.notes, so."deliveryDate",
              so."createdAt", so."updatedAt",
              c.id AS customer_id, c.name AS customer_name,
              c.email AS customer_email, c.phone AS customer_phone,
              c.company AS customer_company
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       WHERE so.id = $1 AND so."organizationId" = $2`,
      [orderId, orgId]
    )

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.rows[0]

    // Get the line items
    const itemsResult = await pool.query(
      `SELECT id, description, quantity, "unitPrice", total, "productId"
       FROM "SalesOrderItem"
       WHERE "salesOrderId" = $1
       ORDER BY id ASC`,
      [orderId]
    )

    return NextResponse.json({
      order: {
        id: order.id,
        number: order.number,
        date: order.date,
        status: order.status,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        total: Number(order.total),
        notes: order.notes,
        deliveryDate: order.deliveryDate,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: {
          id: order.customer_id,
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
          company: order.customer_company,
        },
      },
      items: itemsResult.rows.map(r => ({
        id: r.id,
        description: r.description,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice),
        total: Number(r.total),
        productId: r.productId,
      })),
    })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/orders/[id]] GET error:', err?.message)
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }
}

// PATCH /api/wavve-si/restaurant/orders/[id]
// Body: { status: 'CONFIRMED' | 'DELIVERED' | 'CANCELLED' | ... }
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId
    const orderId = params.id

    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }

    // Verify order belongs to this org
    const check = await pool.query(
      'SELECT id FROM "SalesOrder" WHERE id = $1 AND "organizationId" = $2',
      [orderId, orgId]
    )
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update
    await pool.query(
      `UPDATE "SalesOrder" SET status = $1, "updatedAt" = NOW() WHERE id = $2 AND "organizationId" = $3`,
      [status, orderId, orgId]
    )

    return NextResponse.json({ success: true, status })
  } catch (err: any) {
    console.error('[wavve-si/restaurant/orders/[id]] PATCH error:', err?.message)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}