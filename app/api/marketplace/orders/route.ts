export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: List orders (as buyer or as seller)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_READ')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const view = searchParams.get('view') || 'buyer'
    const id = searchParams.get('id')
    const status = searchParams.get('status')

    // Detail view
    if (id) {
      const orderRes = await pool.query(
        `SELECT * FROM "MarketplaceOrder" WHERE id = $1`,
        [id]
      )
      if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const order = orderRes.rows[0]

      // Authorization: buyer OR one of the sellers
      const isBuyer = order.buyerId === session.userId
      const sellerCheck = await pool.query(
        `SELECT 1 FROM "MarketplaceOrderItem" WHERE "orderId" = $1 AND "sellerId" = $2 LIMIT 1`,
        [id, session.userId]
      )
      const isSeller = sellerCheck.rows.length > 0
      const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'

      if (!isBuyer && !isSeller && !isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

      const items = await pool.query(
        `SELECT oi.*, l.images FROM "MarketplaceOrderItem" oi
         LEFT JOIN "MarketplaceListing" l ON oi."listingId" = l.id
         WHERE oi."orderId" = $1
         ORDER BY oi."createdAt" ASC`,
        [id]
      )

      return NextResponse.json({ order, items: items.rows, role: isBuyer ? 'buyer' : (isSeller ? 'seller' : 'admin') })
    }

    // List view
    let query: string
    const params: any[] = []

    if (view === 'seller') {
      query = `SELECT DISTINCT o.* FROM "MarketplaceOrder" o
               JOIN "MarketplaceOrderItem" oi ON oi."orderId" = o.id
               WHERE oi."sellerId" = $1`
      params.push(session.userId)
    } else {
      query = `SELECT * FROM "MarketplaceOrder" WHERE "buyerId" = $1`
      params.push(session.userId)
    }

    if (status && status !== 'ALL') {
      query += ` AND o.status = $${params.length + 1}`.replace('o.', view === 'seller' ? 'o.' : '')
      params.push(status)
    }

    query += ` ORDER BY "createdAt" DESC LIMIT 200`

    const res = await pool.query(query, params)
    const orders = res.rows

    const summary = {
      total: orders.length,
      pending: orders.filter(o => o.paymentStatus === 'PENDING').length,
      paid: orders.filter(o => o.paymentStatus === 'PAID').length,
      shipped: orders.filter(o => o.status === 'SHIPPED').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      totalValue: Math.round(orders.reduce((s, o) => s + Number(o.total || 0), 0) * 100) / 100,
    }

    return NextResponse.json({ orders, summary })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ orders: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// PATCH: Update order status (buyer can cancel, seller can ship, admin can override)
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'Order id required' }, { status: 400 })

    const orderRes = await pool.query(`SELECT * FROM "MarketplaceOrder" WHERE id = $1`, [body.id])
    if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const order = orderRes.rows[0]

    const isBuyer = order.buyerId === session.userId
    const sellerCheck = await pool.query(
      `SELECT 1 FROM "MarketplaceOrderItem" WHERE "orderId" = $1 AND "sellerId" = $2 LIMIT 1`,
      [body.id, session.userId]
    )
    const isSeller = sellerCheck.rows.length > 0
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'

    if (!isBuyer && !isSeller && !isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const sets: string[] = []
    const values: any[] = []
    let i = 1

    // Buyer can only cancel; seller/admin can change fulfillment status
    if (body.status !== undefined) {
      if (isBuyer && !isAdmin && body.status !== 'CANCELLED') {
        return NextResponse.json({ error: 'Buyers can only cancel orders' }, { status: 403 })
      }
      sets.push(`status = $${i++}`)
      values.push(body.status)
    }
    if (body.paymentStatus !== undefined && (isAdmin || isSeller)) {
      sets.push(`"paymentStatus" = $${i++}`)
      values.push(body.paymentStatus)
    }
    if (body.paymentReference !== undefined) {
      sets.push(`"paymentReference" = $${i++}`)
      values.push(body.paymentReference)
    }
    if (body.notes !== undefined) {
      sets.push(`notes = $${i++}`)
      values.push(body.notes)
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(body.id)

    const result = await pool.query(
      `UPDATE "MarketplaceOrder" SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )
    return NextResponse.json({ order: result.rows[0] })
  } catch (error) {
    console.error('Orders PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}