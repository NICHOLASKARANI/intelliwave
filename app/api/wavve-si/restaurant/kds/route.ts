export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = session.organizationId

    // Active orders: PENDING, CONFIRMED, PROCESSING — the kitchen needs these
    const ordersResult = await pool.query(
      `SELECT so.id, so.number, so.status, so.date, so.total,
              so.notes,
              c.name AS customer_name
       FROM "SalesOrder" so
       LEFT JOIN "Customer" c ON c.id = so."customerId"
       WHERE so."organizationId" = $1
         AND so.status IN ('PENDING', 'CONFIRMED', 'PROCESSING')
       ORDER BY so.date ASC`,
      [orgId]
    )

    // Fetch all line items for those orders in one query
    const orderIds = ordersResult.rows.map(r => r.id)
    let itemsByOrder: Record<string, any[]> = {}

    if (orderIds.length > 0) {
      const itemsResult = await pool.query(
        `SELECT id, "salesOrderId", description, quantity, "unitPrice", total
         FROM "SalesOrderItem"
         WHERE "salesOrderId" = ANY($1)
         ORDER BY id ASC`,
        [orderIds]
      )
      for (const item of itemsResult.rows) {
        if (!itemsByOrder[item.salesOrderId]) itemsByOrder[item.salesOrderId] = []
        itemsByOrder[item.salesOrderId].push({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })
      }
    }

    return NextResponse.json({
      orders: ordersResult.rows.map(o => ({
        id: o.id,
        number: o.number,
        status: o.status,
        date: o.date,
        total: Number(o.total),
        notes: o.notes,
        customer_name: o.customer_name,
        items: itemsByOrder[o.id] || [],
        elapsed_minutes: Math.floor((Date.now() - new Date(o.date).getTime()) / 60000),
      })),
    })
  } catch (err: any) {
    console.error('[kds] error:', err?.message)
    return NextResponse.json({ error: 'Failed to load KDS' }, { status: 500 })
  }
}