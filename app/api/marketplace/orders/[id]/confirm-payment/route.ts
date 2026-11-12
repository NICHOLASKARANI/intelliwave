export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'

// POST: seller confirms buyer's payment (verifies against their M-Pesa)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.id
    const body = await req.json().catch(() => ({}))
    const action = body.action || 'confirm'  // 'confirm' | 'reject'
    const rejectionReason = (body.reason || '').toString().trim().slice(0, 500) || null

    // Verify seller is part of this order
    const sellerCheck = await pool.query(
      `SELECT 1 FROM "MarketplaceOrderItem" WHERE "orderId" = $1 AND "sellerId" = $2 LIMIT 1`,
      [orderId, session.userId]
    )
    if (sellerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    const orderRes = await pool.query(
      `SELECT id, "orderNumber", "buyerId", status, total, "paymentReference" FROM "MarketplaceOrder" WHERE id = $1`,
      [orderId]
    )
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderRes.rows[0]

    if (order.status !== 'AWAITING_SELLER_VERIFICATION') {
      return NextResponse.json({ error: `Cannot confirm — status is ${order.status}` }, { status: 400 })
    }

    if (action === 'confirm') {
      // Confirm payment — move to PAID + CONFIRMED
      await pool.query(
        `UPDATE "MarketplaceOrder"
         SET status = 'CONFIRMED',
             "paymentStatus" = 'PAID',
             "updatedAt" = NOW()
         WHERE id = $1`,
        [orderId]
      )

      // Decrement stock + notify
      const items = await pool.query(
        `SELECT "listingId", quantity, title FROM "MarketplaceOrderItem" WHERE "orderId" = $1`,
        [orderId]
      )
      for (const item of items.rows) {
        await pool.query(
          `UPDATE "MarketplaceListing" SET stock = GREATEST(COALESCE(stock, 0) - $1, 0) WHERE id = $2`,
          [item.quantity, item.listingId]
        ).catch(() => {})
      }

      // Update seller metrics
      await pool.query(
        `UPDATE "SellerProfile"
         SET "totalOrders" = COALESCE("totalOrders", 0) + 1,
             "totalSales" = COALESCE("totalSales", 0) + $1,
             "updatedAt" = NOW()
         WHERE "userId" = $2`,
        [Number(order.total), session.userId]
      ).catch(() => {})

      // Notify buyer
      createNotification({
        userId: order.buyerId,
        type: 'order_status',
        title: '✅ Payment confirmed',
        body: `Order ${order.orderNumber} · KES ${Number(order.total).toLocaleString()} confirmed by seller`,
        link: `/marketplace/orders/${orderId}`,
        actorId: session.userId,
      }).catch(() => {})

      return NextResponse.json({ success: true, status: 'CONFIRMED' })
    } else if (action === 'reject') {
      // Reject — bounce back to SELLER_ACCEPTED so buyer can retry
      await pool.query(
        `UPDATE "MarketplaceOrder"
         SET status = 'SELLER_ACCEPTED',
             "paymentStatus" = 'PENDING',
             "paymentReference" = NULL,
             notes = COALESCE($1, notes),
             "updatedAt" = NOW()
         WHERE id = $2`,
        [rejectionReason ? `[Seller: ${rejectionReason}]` : null, orderId]
      )

      createNotification({
        userId: order.buyerId,
        type: 'order_status',
        title: '⚠️ Payment not found',
        body: rejectionReason ? `Order ${order.orderNumber} — ${rejectionReason}` : `Order ${order.orderNumber} — seller couldn't find your payment, please retry`,
        link: `/marketplace/orders/${orderId}`,
        actorId: session.userId,
      }).catch(() => {})

      return NextResponse.json({ success: true, status: 'SELLER_ACCEPTED' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Confirm payment error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}