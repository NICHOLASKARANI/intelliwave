export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// POST: Settle a delivered order — moves seller's pending → available balance.
// Triggered by: buyer confirms receipt, seller marks delivered + buyer no dispute, OR admin override.
// Also auto-expires after 7 days post-delivery (Amazon DD+7 pattern).
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    const orderRes = await pool.query(
      `SELECT * FROM "MarketplaceOrder" WHERE id = $1`,
      [body.orderId]
    )
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const order = orderRes.rows[0]

    // Authorization: buyer OR admin
    const isBuyer = order.buyerId === session.userId
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'
    if (!isBuyer && !isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    // Only settle DELIVERED orders
    if (order.status !== 'DELIVERED' && !isAdmin) {
      return NextResponse.json({ error: 'Order must be DELIVERED to settle' }, { status: 400 })
    }

    // Find unsettled order items
    const itemsRes = await pool.query(
      `SELECT oi.*, w.id AS wallet_id, w."availableBalance", w."pendingBalance", w."lifetimeEarnings"
       FROM "MarketplaceOrderItem" oi
       LEFT JOIN "SellerWallet" w ON w."sellerId" = oi."sellerId"
       WHERE oi."orderId" = $1 AND oi."fulfillmentStatus" != 'SETTLED'`,
      [body.orderId]
    )

    if (itemsRes.rows.length === 0) {
      return NextResponse.json({ error: 'No unsettled items' }, { status: 400 })
    }

    const crypto = require('crypto')
    const settled: any[] = []

    for (const item of itemsRes.rows) {
      if (!item.wallet_id) continue

      const payout = Number(item.sellerPayout || 0)
      const newAvailable = Number(item.availableBalance || 0) + payout
      const newPending = Math.max(0, Number(item.pendingBalance || 0) - payout)
      const newLifetime = Number(item.lifetimeEarnings || 0) + payout

      // Update wallet
      await pool.query(
        `UPDATE "SellerWallet"
         SET "availableBalance" = $1, "pendingBalance" = $2, "lifetimeEarnings" = $3, "updatedAt" = NOW()
         WHERE id = $4`,
        [Math.round(newAvailable * 100) / 100, Math.round(newPending * 100) / 100, Math.round(newLifetime * 100) / 100, item.wallet_id]
      )

      // Mark item settled
      await pool.query(
        `UPDATE "MarketplaceOrderItem" SET "fulfillmentStatus" = 'SETTLED' WHERE id = $1`,
        [item.id]
      )

      // Log transaction
      const txId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO "WalletTransaction" (id, "sellerId", "walletId", type, amount, balance, description, "orderId", status, "createdAt")
         VALUES ($1,$2,$3,'SALE_SETTLED',$4,$5,$6,$7,'COMPLETED',NOW())`,
        [
          txId, item.sellerId, item.wallet_id,
          Math.round(payout * 100) / 100,
          Math.round(newAvailable * 100) / 100,
          `Settled sale from ${order.orderNumber}`,
          order.id,
        ]
      )

      settled.push({ itemId: item.id, sellerId: item.sellerId, payout })
    }

    // Update order status to COMPLETED
    await pool.query(
      `UPDATE "MarketplaceOrder" SET status = 'COMPLETED', "updatedAt" = NOW() WHERE id = $1`,
      [body.orderId]
    )

    return NextResponse.json({
      success: true,
      orderId: body.orderId,
      orderNumber: order.orderNumber,
      settledCount: settled.length,
      settled,
      message: `${settled.length} seller(s) settled. Funds now available in wallets.`,
    })
  } catch (error) {
    console.error('Settlement error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// GET: Auto-settle eligible orders (older than 7 days post-delivery)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    // Admin only
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'
    if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    // Find DELIVERED orders older than 7 days with unsettled items
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const eligible = await pool.query(
      `SELECT DISTINCT o.id, o."orderNumber"
       FROM "MarketplaceOrder" o
       JOIN "MarketplaceOrderItem" oi ON oi."orderId" = o.id
       WHERE o.status = 'DELIVERED' AND o."updatedAt" < $1 AND oi."fulfillmentStatus" != 'SETTLED'`,
      [sevenDaysAgo]
    )

    const results: any[] = []
    for (const order of eligible.rows) {
      // Call internal logic by simulating a request — but simpler: do the work inline
      const itemsRes = await pool.query(
        `SELECT oi.*, w.id AS wallet_id, w."availableBalance", w."pendingBalance", w."lifetimeEarnings"
         FROM "MarketplaceOrderItem" oi
         LEFT JOIN "SellerWallet" w ON w."sellerId" = oi."sellerId"
         WHERE oi."orderId" = $1 AND oi."fulfillmentStatus" != 'SETTLED'`,
        [order.id]
      )

      const crypto = require('crypto')
      for (const item of itemsRes.rows) {
        if (!item.wallet_id) continue
        const payout = Number(item.sellerPayout || 0)
        const newAvailable = Number(item.availableBalance || 0) + payout
        const newPending = Math.max(0, Number(item.pendingBalance || 0) - payout)
        const newLifetime = Number(item.lifetimeEarnings || 0) + payout

        await pool.query(
          `UPDATE "SellerWallet"
           SET "availableBalance" = $1, "pendingBalance" = $2, "lifetimeEarnings" = $3, "updatedAt" = NOW()
           WHERE id = $4`,
          [Math.round(newAvailable * 100) / 100, Math.round(newPending * 100) / 100, Math.round(newLifetime * 100) / 100, item.wallet_id]
        )

        await pool.query(`UPDATE "MarketplaceOrderItem" SET "fulfillmentStatus" = 'SETTLED' WHERE id = $1`, [item.id])

        const txId = crypto.randomUUID()
        await pool.query(
          `INSERT INTO "WalletTransaction" (id, "sellerId", "walletId", type, amount, balance, description, "orderId", status, "createdAt")
           VALUES ($1,$2,$3,'SALE_SETTLED',$4,$5,$6,$7,'COMPLETED',NOW())`,
          [
            txId, item.sellerId, item.wallet_id,
            Math.round(payout * 100) / 100,
            Math.round(newAvailable * 100) / 100,
            `Auto-settled (DD+7) from ${order.orderNumber}`,
            order.id,
          ]
        )
      }

      await pool.query(`UPDATE "MarketplaceOrder" SET status = 'COMPLETED', "updatedAt" = NOW() WHERE id = $1`, [order.id])
      results.push({ orderId: order.id, orderNumber: order.orderNumber })
    }

    return NextResponse.json({
      success: true,
      autoSettledCount: results.length,
      orders: results,
      message: results.length > 0 ? `${results.length} order(s) auto-settled.` : 'No orders eligible for auto-settlement.',
    })
  } catch (error) {
    console.error('Auto-settlement error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}