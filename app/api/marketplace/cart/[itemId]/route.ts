export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// PATCH: update quantity
export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const quantity = parseInt(body.quantity, 10)

    if (!quantity || quantity < 1) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    if (quantity > 99) return NextResponse.json({ error: 'Max 99 per item' }, { status: 400 })

    // Verify ownership + stock
    const check = await pool.query(
      `SELECT ci.id, l.stock
       FROM "CartItem" ci
       JOIN "Cart" c ON c.id = ci."cartId"
       JOIN "MarketplaceListing" l ON l.id = ci."listingId"
       WHERE ci.id = $1 AND c."userId" = $2`,
      [params.itemId, session.userId]
    )
    if (check.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const stock = check.rows[0].stock
    if (stock !== null && quantity > stock) {
      return NextResponse.json({ error: `Only ${stock} available` }, { status: 400 })
    }

    await pool.query(`UPDATE "CartItem" SET quantity = $1 WHERE id = $2`, [quantity, params.itemId])
    return NextResponse.json({ success: true, quantity })
  } catch (error: any) {
    console.error('Cart item PATCH error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE: remove single item
export async function DELETE(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(
      `DELETE FROM "CartItem"
       WHERE id = $1 AND "cartId" IN (
         SELECT id FROM "Cart" WHERE "userId" = $2 AND status = 'ACTIVE'
       )`,
      [params.itemId, session.userId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Cart item DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}