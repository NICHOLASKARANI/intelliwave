export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

// Get or create the active cart for the current user
async function getOrCreateCart(userId: string, organizationId: string): Promise<string> {
  const existing = await pool.query(
    `SELECT id FROM "Cart" WHERE "userId" = $1 AND status = 'ACTIVE' LIMIT 1`,
    [userId]
  )
  if (existing.rows.length > 0) return existing.rows[0].id

  const id = crypto.randomUUID()
  await pool.query(
    `INSERT INTO "Cart" (id, "userId", "organizationId", status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())`,
    [id, userId, organizationId]
  )
  return id
}

// GET: list cart with items joined with listing data, grouped by seller
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cartId = await getOrCreateCart(session.userId, session.organizationId)

    const res = await pool.query(
      `SELECT
         ci.id AS "itemId",
         ci."listingId",
         ci.quantity,
         ci."unitPrice",
         ci."createdAt" AS "addedAt",
         l.title, l.images, l."sellerId", l.stock, l.status AS "listingStatus",
         u.name AS "sellerName"
       FROM "CartItem" ci
       JOIN "MarketplaceListing" l ON l.id = ci."listingId"
       LEFT JOIN "User" u ON u.id = l."sellerId"
       WHERE ci."cartId" = $1
       ORDER BY l."sellerId", ci."createdAt" DESC`,
      [cartId]
    )

    // Group by seller
    const bySeller: Record<string, any> = {}
    for (const row of res.rows) {
      const sid = row.sellerId || 'unknown'
      if (!bySeller[sid]) {
        bySeller[sid] = {
          sellerId: sid,
          sellerName: row.sellerName || 'Seller',
          items: [],
          subtotal: 0,
        }
      }
      const lineTotal = Number(row.unitPrice) * row.quantity
      bySeller[sid].items.push({ ...row, lineTotal })
      bySeller[sid].subtotal += lineTotal
    }

    const groups = Object.values(bySeller)
    const itemCount = res.rows.reduce((s: number, r: any) => s + r.quantity, 0)
    const subtotal = groups.reduce((s: number, g: any) => s + g.subtotal, 0)

    return NextResponse.json({
      cartId,
      items: res.rows,
      groups,
      itemCount,
      subtotal,
      currency: 'KES',
    })
  } catch (error: any) {
    console.error('Cart GET error:', error?.message)
    return NextResponse.json({ items: [], groups: [], itemCount: 0, subtotal: 0, error: 'Failed' }, { status: 500 })
  }
}

// POST: add item to cart
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const listingId = parseInt(body.listingId, 10)
    const quantity = Math.max(1, parseInt(body.quantity, 10) || 1)

    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    // Verify listing exists, active, in stock
    const listing = await pool.query(
      `SELECT id, price, stock, "sellerId", status FROM "MarketplaceListing" WHERE id = $1`,
      [listingId]
    )
    if (listing.rows.length === 0) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    const l = listing.rows[0]
    if (l.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing not available' }, { status: 400 })
    if (l.stock !== null && l.stock <= 0) return NextResponse.json({ error: 'Out of stock' }, { status: 400 })
    if (l.sellerId === session.userId) return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 })

    const cartId = await getOrCreateCart(session.userId, session.organizationId)

    // Upsert item
    const itemId = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "CartItem" (id, "cartId", "listingId", quantity, "unitPrice", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [itemId, cartId, listingId, quantity, Number(l.price)]
    )

    // If item already existed (no conflict clause), update quantity instead
    if (result.rows.length === 0) {
      await pool.query(
        `UPDATE "CartItem" SET quantity = quantity + $1 WHERE "cartId" = $2 AND "listingId" = $3`,
        [quantity, cartId, listingId]
      )
    }

    await pool.query(`UPDATE "Cart" SET "updatedAt" = NOW() WHERE id = $1`, [cartId])

    return NextResponse.json({ success: true, cartId }, { status: 201 })
  } catch (error: any) {
    console.error('Cart POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE: clear entire cart
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cart = await pool.query(
      `SELECT id FROM "Cart" WHERE "userId" = $1 AND status = 'ACTIVE' LIMIT 1`,
      [session.userId]
    )
    if (cart.rows.length === 0) return NextResponse.json({ success: true })

    await pool.query(`DELETE FROM "CartItem" WHERE "cartId" = $1`, [cart.rows[0].id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Cart DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}