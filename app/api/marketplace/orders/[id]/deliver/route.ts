export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'
import { requestReviewsForOrder } from '@/lib/marketplace/reviews-request'

// POST: buyer or seller marks order as delivered
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.id
    const orderRes = await pool.query(
      `SELECT id, "orderNumber", status, "buyerId" FROM "MarketplaceOrder" WHERE id = $1`,
      [orderId]
    )
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderRes.rows[0]

    const isBuyer = order.buyerId === session.userId
    const sellerCheck = await pool.query(
      `SELECT 1 FROM "MarketplaceOrderItem" WHERE "orderId" = $1 AND "sellerId" = $2 LIMIT 1`,
      [orderId, session.userId]
    )
    const isSeller = sellerCheck.rows.length > 0
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (order.status !== 'SHIPPED' && order.status !== 'CONFIRMED') {
      return NextResponse.json({ error: `Cannot mark delivered — status is ${order.status}` }, { status: 400 })
    }

    await pool.query(
      `UPDATE "MarketplaceOrder"
       SET status = 'DELIVERED', "updatedAt" = NOW()
       WHERE id = $1`,
      [orderId]
    )

    await pool.query(
      `UPDATE "MarketplaceOrderItem"
       SET "fulfillmentStatus" = 'DELIVERED'
       WHERE "orderId" = $1`,
      [orderId]
    ).catch(() => {})

    // Notify buyer
    if (!isBuyer) {
      createNotification({
        userId: order.buyerId,
        type: 'order_status',
        title: '✅ Order delivered',
        body: `Order ${order.orderNumber} has been delivered. Leave a review!`,
        link: `/marketplace/orders/${orderId}`,
        actorId: session.userId,
      }).catch(() => {})
    }

    // Fire review requests (fire-and-forget)
    requestReviewsForOrder(orderId).catch(() => {})

    return NextResponse.json({ success: true, status: 'DELIVERED' })
  } catch (error: any) {
    console.error('Deliver error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}