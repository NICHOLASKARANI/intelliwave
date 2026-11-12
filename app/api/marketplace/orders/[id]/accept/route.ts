export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'

// POST: seller accepts or declines an order
// Body: { action: 'accept' | 'decline', reason?, note? }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.id
    const body = await req.json().catch(() => ({}))
    const action = body.action
    const reason = (body.reason || '').toString().trim().slice(0, 500) || null

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Verify current user is the seller of this order
    const sellerCheck = await pool.query(
      `SELECT 1 FROM "MarketplaceOrderItem" WHERE "orderId" = $1 AND "sellerId" = $2 LIMIT 1`,
      [orderId, session.userId]
    )
    if (sellerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    // Verify order is awaiting acceptance
    const orderRes = await pool.query(
      `SELECT id, "orderNumber", status, "buyerId", total FROM "MarketplaceOrder" WHERE id = $1`,
      [orderId]
    )
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderRes.rows[0]

    if (order.status !== 'AWAITING_SELLER_ACCEPT') {
      return NextResponse.json({ error: `Cannot ${action} — order status is ${order.status}` }, { status: 400 })
    }

    if (action === 'accept') {
      await pool.query(
        `UPDATE "MarketplaceOrder"
         SET status = 'SELLER_ACCEPTED',
             "sellerAcceptedAt" = NOW(),
             "paymentDetailsRevealedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $1`,
        [orderId]
      )

      createNotification({
        userId: order.buyerId,
        type: 'order_status',
        title: '✅ Seller accepted your order',
        body: `Order ${order.orderNumber} · KES ${Number(order.total).toLocaleString()} — pay now`,
        link: `/marketplace/orders/${orderId}`,
        actorId: session.userId,
      }).catch(() => {})

      return NextResponse.json({ success: true, status: 'SELLER_ACCEPTED' })
    } else {
      await pool.query(
        `UPDATE "MarketplaceOrder"
         SET status = 'SELLER_DECLINED',
             "sellerDeclinedAt" = NOW(),
             "sellerDeclineReason" = $1,
             "updatedAt" = NOW()
         WHERE id = $2`,
        [reason, orderId]
      )

      createNotification({
        userId: order.buyerId,
        type: 'order_status',
        title: '❌ Seller declined your order',
        body: reason ? `Order ${order.orderNumber} — reason: ${reason}` : `Order ${order.orderNumber} was declined`,
        link: `/marketplace/orders/${orderId}`,
        actorId: session.userId,
      }).catch(() => {})

      return NextResponse.json({ success: true, status: 'SELLER_DECLINED' })
    }
  } catch (error: any) {
    console.error('Order accept error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}