export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification } from '@/lib/marketplace/notifications'
import crypto from 'crypto'

// POST: create order(s) from a listing OR from the cart
// Body: { source: 'buynow' | 'cart', listingId?, quantity?, shippingAddress?, notes? }
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const source = body.source || 'buynow'
    const shippingAddress = (body.shippingAddress || '').toString().trim().slice(0, 500) || null
    const notes = (body.notes || '').toString().trim().slice(0, 1000) || null

    // Gather items: array of { listingId, quantity }
    let items: { listingId: number, quantity: number }[] = []

    if (source === 'buynow') {
      const listingId = parseInt(body.listingId, 10)
      const quantity = Math.max(1, parseInt(body.quantity, 10) || 1)
      if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })
      items = [{ listingId, quantity }]
    } else if (source === 'cart') {
      const cart = await pool.query(
        `SELECT ci."listingId", ci.quantity FROM "CartItem" ci
         JOIN "Cart" c ON c.id = ci."cartId"
         WHERE c."userId" = $1 AND c.status = 'ACTIVE'`,
        [session.userId]
      )
      if (cart.rows.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      items = cart.rows.map((r: any) => ({ listingId: r.listingId, quantity: r.quantity }))
    } else {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }

    // Validate listings + group by seller
    const listingIds = items.map(i => i.listingId)
    const listingsRes = await pool.query(
      `SELECT id, title, price, stock, "sellerId", status, images
       FROM "MarketplaceListing" WHERE id = ANY($1)`,
      [listingIds]
    )
    if (listingsRes.rows.length !== listingIds.length) {
      return NextResponse.json({ error: 'Some listings no longer exist' }, { status: 400 })
    }

    const listingMap: Record<number, any> = {}
    for (const l of listingsRes.rows) listingMap[l.id] = l

    // Validate each
    for (const it of items) {
      const l = listingMap[it.listingId]
      if (l.status !== 'ACTIVE') return NextResponse.json({ error: `"${l.title}" is no longer available` }, { status: 400 })
      if (l.stock !== null && l.stock < it.quantity) return NextResponse.json({ error: `Only ${l.stock} of "${l.title}" available` }, { status: 400 })
      if (l.sellerId === session.userId) return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 })
    }

    // Group by seller
    const bySeller: Record<string, { items: any[], subtotal: number }> = {}
    for (const it of items) {
      const l = listingMap[it.listingId]
      if (!bySeller[l.sellerId]) bySeller[l.sellerId] = { items: [], subtotal: 0 }
      const lineTotal = Number(l.price) * it.quantity
      bySeller[l.sellerId].items.push({ ...it, listing: l, lineTotal })
      bySeller[l.sellerId].subtotal += lineTotal
    }

    // Create 1 order per seller
    const createdOrders: any[] = []
    const ts = Date.now().toString().slice(-8)
    let seq = 0

    for (const [sellerId, group] of Object.entries(bySeller)) {
      const orderId = crypto.randomUUID()
      const orderNumber = `WM-${ts}-${String(++seq).padStart(3, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
      const platformFee = Math.round(group.subtotal * 0.08 * 100) / 100  // 8% platform fee
      const total = group.subtotal  // No delivery fee for now

      await pool.query(
        `INSERT INTO "MarketplaceOrder"
         (id, "orderNumber", "buyerId", "buyerName", "buyerEmail", "buyerPhone",
          "shippingAddress", subtotal, "deliveryFee", "platformFee", total, currency,
          status, "paymentMethod", "paymentStatus", notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, 'KES',
                 'AWAITING_SELLER_ACCEPT', 'MPESA', 'PENDING', $11, NOW(), NOW())`,
        [
          orderId,
          orderNumber,
          session.userId,
          session.name || null,
          session.email || null,
          null,
          shippingAddress,
          group.subtotal,
          platformFee,
          total,
          notes,
        ]
      )

      // Insert items
      for (const it of group.items) {
        const oiId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO "MarketplaceOrderItem"
           (id, "orderId", "listingId", "sellerId", "sellerName", title, quantity, "unitPrice",
            "lineTotal", "commissionRate", "commissionAmount", "sellerPayout", "fulfillmentStatus", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0.08, $10, $11, 'PENDING', NOW())`,
          [
            oiId,
            orderId,
            it.listingId,
            it.listing.sellerId,
            null,
            it.listing.title,
            it.quantity,
            Number(it.listing.price),
            it.lineTotal,
            Math.round(it.lineTotal * 0.08 * 100) / 100,
            Math.round(it.lineTotal * 0.92 * 100) / 100,
          ]
        )
      }

      createdOrders.push({ id: orderId, orderNumber, sellerId, subtotal: group.subtotal, total })

      // Notify seller (fire-and-forget)
      createNotification({
        userId: sellerId,
        type: 'new_order',
        title: '🛎 New order request',
        body: `Order ${orderNumber} · KES ${group.subtotal.toLocaleString()} — accept or decline`,
        link: `/marketplace/seller/orders`,
        actorId: session.userId,
      }).catch(() => {})
    }

    // Clear cart if source was cart
    if (source === 'cart') {
      await pool.query(
        `DELETE FROM "CartItem" WHERE "cartId" IN (SELECT id FROM "Cart" WHERE "userId" = $1 AND status = 'ACTIVE')`,
        [session.userId]
      )
    }

    return NextResponse.json({
      success: true,
      orders: createdOrders,
      redirectUrl: createdOrders.length === 1
        ? `/marketplace/orders/${createdOrders[0].id}`
        : `/marketplace/orders`,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Order create error:', error?.message)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}