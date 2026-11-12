export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'

// POST: buyer submits M-Pesa receipt after paying seller directly
// Body: { receiptCode, amount?, notes? }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.id
    const body = await req.json().catch(() => ({}))
    const receiptCode = (body.receiptCode || '').toString().trim().toUpperCase().slice(0, 30)
    const buyerNotes = (body.notes || '').toString().trim().slice(0, 500) || null

    if (!receiptCode) {
      return NextResponse.json({ error: 'M-Pesa receipt code required' }, { status: 400 })
    }
    // M-Pesa receipts are typically 10 chars (e.g., QK123ABC45)
    if (!/^[A-Z0-9]{6,20}$/.test(receiptCode)) {
      return NextResponse.json({ error: 'Invalid receipt code format' }, { status: 400 })
    }

    // Verify order belongs to this buyer and status allows payment submission
    const orderRes = await pool.query(
      `SELECT id, "orderNumber", "buyerId", status, total FROM "MarketplaceOrder" WHERE id = $1`,
      [orderId]
    )
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderRes.rows[0]

    if (order.buyerId !== session.userId) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    if (order.status !== 'SELLER_ACCEPTED') {
      return NextResponse.json({ error: `Cannot submit payment — order status is ${order.status}` }, { status: 400 })
    }

    // Update order — payment reference stored, status moves to awaiting seller verification
    await pool.query(
      `UPDATE "MarketplaceOrder"
       SET status = 'AWAITING_SELLER_VERIFICATION',
           "paymentStatus" = 'BUYER_SUBMITTED',
           "paymentReference" = $1,
           notes = COALESCE($2, notes),
           "updatedAt" = NOW()
       WHERE id = $3`,
      [receiptCode, buyerNotes, orderId]
    )

    // Notify each seller involved in this order
    const sellers = await pool.query(
      `SELECT DISTINCT "sellerId" FROM "MarketplaceOrderItem" WHERE "orderId" = $1`,
      [orderId]
    )
    for (const s of sellers.rows) {
      createNotification({
        userId: s.sellerId,
        type: 'order_status',
        title: '💰 Buyer submitted payment',
        body: `Order ${order.orderNumber} · Receipt ${receiptCode} · Verify & confirm`,
        link: `/marketplace/seller/orders`,
        actorId: session.userId,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, status: 'AWAITING_SELLER_VERIFICATION' })
  } catch (error: any) {
    console.error('Submit payment error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}