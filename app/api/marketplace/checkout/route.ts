export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

const PLATFORM_FEE_RATE = 0.08 // 8% default commission
const DELIVERY_PER_SELLER = 300 // flat KES per seller

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.shippingAddress) return NextResponse.json({ error: 'Shipping address required' }, { status: 400 })

    // Load cart with items + listing details
    const cartRes = await pool.query(
      `SELECT c.id AS cart_id, ci.id AS item_id, ci.quantity, ci."unitPrice",
              l.id AS listing_id, l.title, l.stock, l.status AS listing_status,
              l."sellerId", u.name AS seller_name,
              COALESCE(l."commissionRate", $1) AS commission_rate
       FROM "Cart" c
       JOIN "CartItem" ci ON ci."cartId" = c.id
       JOIN "MarketplaceListing" l ON ci."listingId" = l.id
       LEFT JOIN "User" u ON l."sellerId" = u.id
       WHERE c."userId" = $2 AND c.status = 'ACTIVE'`,
      [PLATFORM_FEE_RATE, session.userId]
    )

    if (cartRes.rows.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    // Validate all items
    for (const item of cartRes.rows) {
      if (item.listing_status !== 'ACTIVE') return NextResponse.json({ error: `${item.title} is no longer available` }, { status: 400 })
      if (Number(item.stock || 0) < Number(item.quantity)) return NextResponse.json({ error: `Insufficient stock for ${item.title}` }, { status: 400 })
    }

    const crypto = require('crypto')
    const orderId = crypto.randomUUID()
    const orderNumber = 'MKT-' + Date.now().toString(36).toUpperCase() + '-' + orderId.slice(0, 4).toUpperCase()

    // Calculate totals per seller
    let subtotal = 0
    const sellerMap: Record<string, { items: any[]; commission: number }> = {}
    for (const item of cartRes.rows) {
      const lineTotal = Number(item.unitPrice) * Number(item.quantity)
      subtotal += lineTotal
      if (!sellerMap[item.sellerId]) sellerMap[item.sellerId] = { items: [], commission: 0 }
      const commission = lineTotal * Number(item.commission_rate || PLATFORM_FEE_RATE)
      sellerMap[item.sellerId].items.push({ ...item, lineTotal, commission, payout: lineTotal - commission })
      sellerMap[item.sellerId].commission += commission
    }

    const sellerCount = Object.keys(sellerMap).length
    const deliveryFee = sellerCount * DELIVERY_PER_SELLER
    const platformFee = Object.values(sellerMap).reduce((s, v) => s + v.commission, 0)
    const total = subtotal + deliveryFee

    // Insert order
    await pool.query(
      `INSERT INTO "MarketplaceOrder"
        (id, "orderNumber", "buyerId", "buyerName", "buyerEmail", "buyerPhone",
         "shippingAddress", "shippingLatitude", "shippingLongitude",
         subtotal, "deliveryFee", "platformFee", total, currency,
         status, "paymentMethod", "paymentStatus", notes, "organizationId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'KES',
         'PENDING','MPESA','PENDING',$14,$15,NOW(),NOW())`,
      [
        orderId, orderNumber, session.userId, session.name || 'Buyer', session.email || null, body.buyerPhone || null,
        body.shippingAddress, body.latitude || null, body.longitude || null,
        Math.round(subtotal * 100) / 100,
        deliveryFee,
        Math.round(platformFee * 100) / 100,
        Math.round(total * 100) / 100,
        body.notes || null,
        session.organizationId,
      ]
    )

    // Insert order items + wallet pending
    for (const [sellerId, seller] of Object.entries(sellerMap)) {
      for (const item of seller.items) {
        const itemId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO "MarketplaceOrderItem"
            (id, "orderId", "listingId", "sellerId", "sellerName", title, quantity,
             "unitPrice", "lineTotal", "commissionRate", "commissionAmount", "sellerPayout",
             "fulfillmentStatus", "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PENDING',NOW())`,
          [
            itemId, orderId, item.listing_id, item.sellerId, item.seller_name,
            item.title, item.quantity,
            Number(item.unitPrice), Math.round(item.lineTotal * 100) / 100,
            Number(item.commission_rate || PLATFORM_FEE_RATE),
            Math.round(item.commission * 100) / 100,
            Math.round(item.payout * 100) / 100,
          ]
        )

        // Reserve inventory
        await pool.query(
          `UPDATE "MarketplaceListing" SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
          [item.quantity, item.listing_id]
        )
      }

      // Update seller wallet pending balance
      const walletRes = await pool.query(
        `SELECT id, "pendingBalance", "lifetimeCommission" FROM "SellerWallet" WHERE "sellerId" = $1`,
        [sellerId]
      )
      if (walletRes.rows.length > 0) {
        const wallet = walletRes.rows[0]
        const newPending = Number(wallet.pendingBalance || 0) + seller.items.reduce((s, i) => s + i.payout, 0)
        const newCommission = Number(wallet.lifetimeCommission || 0) + seller.commission
        await pool.query(
          `UPDATE "SellerWallet" SET "pendingBalance" = $1, "lifetimeCommission" = $2, "updatedAt" = NOW() WHERE id = $3`,
          [Math.round(newPending * 100) / 100, Math.round(newCommission * 100) / 100, wallet.id]
        )

        // Log wallet transaction
        const txId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO "WalletTransaction" (id, "sellerId", "walletId", type, amount, balance, description, "orderId", status, "createdAt")
           VALUES ($1,$2,$3,'SALE_PENDING',$4,$5,$6,$7,'PENDING',NOW())`,
          [
            txId, sellerId, wallet.id,
            Math.round(seller.items.reduce((s, i) => s + i.payout, 0) * 100) / 100,
            Math.round(newPending * 100) / 100,
            `Pending sale from order ${orderNumber}`,
            orderId,
          ]
        )
      }
    }

    // Clear cart
    await pool.query(`DELETE FROM "CartItem" WHERE "cartId" = $1`, [cartRes.rows[0].cart_id])

    return NextResponse.json({
      orderId,
      orderNumber,
      total: Math.round(total * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      platformFee: Math.round(platformFee * 100) / 100,
      sellerCount,
      itemCount: cartRes.rows.length,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      message: 'Order created. Proceed to payment.',
    }, { status: 201 })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}