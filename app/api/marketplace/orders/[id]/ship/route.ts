export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'

// POST: seller marks order as shipped
// Body: { trackingNumber?, carrier? }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.id
    const body = await req.json().catch(() => ({}))
    const trackingNumber = (body.trackingNumber || '').toString().trim().slice(0, 100) || null
    const carrier = (body.carrier || '').toString().trim().slice(0, 100) || null

    // Verify seller
    const sellerCheck = await pool.query(
      `SELECT 1 FROM "MarketplaceOrderItem" WHERE "orderId" = $1 AND "sellerId" = $2 LIMIT 1`,
      [orderId, session.userId]
    )
    if (sellerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    // Verify status
    const orderRes = await pool.query(
      `SELECT id, "orderNumber", status, "buyerId" FROM "MarketplaceOrder" WHERE id = $1`,
      [orderId]
    )
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderRes.rows[0]

    if (order.status !== 'CONFIRMED') {
      return NextResponse.json({ error: `Cannot ship — order status is ${order.status}` }, { status: 400 })
    }

    await pool.query(
      `UPDATE "MarketplaceOrder"
       SET status = 'SHIPPED',
           notes = COALESCE($1, notes),
           "updatedAt" = NOW()
       WHERE id = $2`,
      [trackingNumber || carrier ? `[Tracking: ${carrier || ''} ${trackingNumber || ''}]`.trim() : null, orderId]
    )

    // Also update MarketplaceOrderItem fulfillmentStatus
    await pool.query(
      `UPDATE "MarketplaceOrderItem"
       SET "fulfillmentStatus" = 'SHIPPED', "trackingNumber" = $1
       WHERE "orderId" = $2 AND "sellerId" = $3`,
      [trackingNumber, orderId, session.userId]
    ).catch(() => {})

    createNotification({
      userId: order.buyerId,
      type: 'order_status',
      title: '📦 Your order has been shipped',
      body: trackingNumber
        ? `Order ${order.orderNumber} · Track: ${trackingNumber}`
        : `Order ${order.orderNumber} is on the way`,
      link: `/marketplace/orders/${orderId}`,
      actorId: session.userId,
    }).catch(() => {})

    return NextResponse.json({ success: true, status: 'SHIPPED' })
  } catch (error: any) {
    console.error('Ship error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}