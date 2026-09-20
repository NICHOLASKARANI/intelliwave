export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// Get or create active cart for user
async function getOrCreateCart(userId: string, organizationId: string): Promise<string> {
  const existing = await pool.query(
    `SELECT id FROM "Cart" WHERE "userId" = $1 AND status = 'ACTIVE' LIMIT 1`,
    [userId]
  )
  if (existing.rows.length > 0) return existing.rows[0].id

  const crypto = require('crypto')
  const id = crypto.randomUUID()
  await pool.query(
    `INSERT INTO "Cart" (id, "userId", "organizationId", status, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,'ACTIVE',NOW(),NOW())`,
    [id, userId, organizationId]
  )
  return id
}

// GET: Return cart with items
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_READ')
    if (guard.deny) return guard.response!

    const cartId = await getOrCreateCart(session.userId, session.organizationId)

    const res = await pool.query(
      `SELECT ci.id, ci."listingId", ci.quantity, ci."unitPrice",
              l.title, l.images, l.category, l.condition, l.location, l.status AS "listingStatus",
              l.stock, l."fulfillmentType", l."slaHours",
              l."sellerId", u.name AS "sellerName"
       FROM "CartItem" ci
       JOIN "MarketplaceListing" l ON ci."listingId" = l.id
       LEFT JOIN "User" u ON l."sellerId" = u.id
       WHERE ci."cartId" = $1
       ORDER BY ci."createdAt" DESC`,
      [cartId]
    )

    const items = res.rows.map(r => ({
      ...r,
      lineTotal: Math.round(Number(r.unitPrice) * Number(r.quantity) * 100) / 100,
      unavailable: r.listingStatus !== 'ACTIVE' || Number(r.stock || 0) <= 0,
    }))

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0)
    const availableItems = items.filter(i => !i.unavailable)
    const itemCount = items.reduce((s, i) => s + Number(i.quantity), 0)

    // Estimate delivery: flat KES 300 per unique seller
    const uniqueSellers = new Set(availableItems.map(i => i.sellerId))
    const deliveryFee = uniqueSellers.size * 300

    return NextResponse.json({
      cartId,
      items,
      summary: {
        itemCount,
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee,
        total: Math.round((subtotal + deliveryFee) * 100) / 100,
        sellerCount: uniqueSellers.size,
        unavailableCount: items.filter(i => i.unavailable).length,
      },
    })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ items: [], summary: {}, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Add item to cart
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    const qty = Math.max(1, Number(body.quantity || 1))

    const listingRes = await pool.query(
      `SELECT id, price, stock, status FROM "MarketplaceListing" WHERE id = $1`,
      [parseInt(body.listingId)]
    )
    if (listingRes.rows.length === 0) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    const listing = listingRes.rows[0]
    if (listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing not available' }, { status: 400 })
    if (Number(listing.stock || 0) < qty) return NextResponse.json({ error: 'Not enough stock' }, { status: 400 })

    const cartId = await getOrCreateCart(session.userId, session.organizationId)
    const crypto = require('crypto')

    // Upsert: if exists, bump quantity
    const existing = await pool.query(
      `SELECT id, quantity FROM "CartItem" WHERE "cartId" = $1 AND "listingId" = $2`,
      [cartId, parseInt(body.listingId)]
    )

    if (existing.rows.length > 0) {
      const newQty = existing.rows[0].quantity + qty
      await pool.query(
        `UPDATE "CartItem" SET quantity = $1 WHERE id = $2`,
        [newQty, existing.rows[0].id]
      )
      return NextResponse.json({ itemId: existing.rows[0].id, quantity: newQty, updated: true })
    }

    const itemId = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "CartItem" (id, "cartId", "listingId", quantity, "unitPrice", "createdAt")
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [itemId, cartId, parseInt(body.listingId), qty, Number(listing.price)]
    )

    return NextResponse.json({ itemId, quantity: qty, created: true }, { status: 201 })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// PATCH: Update item quantity
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.itemId || body.quantity === undefined) return NextResponse.json({ error: 'itemId and quantity required' }, { status: 400 })

    const qty = Number(body.quantity)
    if (qty <= 0) {
      // Delete
      await pool.query(`DELETE FROM "CartItem" WHERE id = $1 AND "cartId" IN (SELECT id FROM "Cart" WHERE "userId" = $2)`, [body.itemId, session.userId])
      return NextResponse.json({ deleted: true })
    }

    const itemRes = await pool.query(
      `SELECT ci.id, l.stock FROM "CartItem" ci
       JOIN "MarketplaceListing" l ON ci."listingId" = l.id
       JOIN "Cart" c ON ci."cartId" = c.id
       WHERE ci.id = $1 AND c."userId" = $2`,
      [body.itemId, session.userId]
    )
    if (itemRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (qty > Number(itemRes.rows[0].stock || 0)) return NextResponse.json({ error: 'Not enough stock' }, { status: 400 })

    await pool.query(`UPDATE "CartItem" SET quantity = $1 WHERE id = $2`, [qty, body.itemId])
    return NextResponse.json({ itemId: body.itemId, quantity: qty, updated: true })
  } catch (error) {
    console.error('Cart PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Remove item
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    const clear = searchParams.get('clear') === 'true'

    if (clear) {
      await pool.query(
        `DELETE FROM "CartItem" WHERE "cartId" IN (SELECT id FROM "Cart" WHERE "userId" = $1)`,
        [session.userId]
      )
      return NextResponse.json({ success: true, cleared: true })
    }

    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    await pool.query(
      `DELETE FROM "CartItem" WHERE id = $1 AND "cartId" IN (SELECT id FROM "Cart" WHERE "userId" = $2)`,
      [itemId, session.userId]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}