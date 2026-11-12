export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const col = await pool.query(
      `SELECT id, name, description, slug, "isPublic", "coverImage", "createdAt", "updatedAt"
       FROM "WishlistCollection" WHERE id = $1 AND "userId" = $2`,
      [params.id, session.userId]
    )
    if (col.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const items = await pool.query(
      `SELECT s.id AS "savedId", s.note, s."createdAt" AS "savedAt",
              l.id AS "listingId", l.title, l.price, l.images, l.location, l.condition
       FROM "MarketplaceSaved" s
       JOIN "MarketplaceListing" l ON s."listingId" = l.id
       WHERE s."collectionId" = $1 AND s."userId" = $2
       ORDER BY s."createdAt" DESC`,
      [params.id, session.userId]
    )

    return NextResponse.json({ collection: col.rows[0], items: items.rows })
  } catch (error: any) {
    console.error('Wishlist GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    if (body.name !== undefined) {
      const name = (body.name || '').toString().trim().slice(0, 80)
      if (!name) return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
      sets.push(`name = $${i++}`); values.push(name)
    }
    if (body.description !== undefined) {
      sets.push(`description = $${i++}`); values.push((body.description || '').toString().trim().slice(0, 300) || null)
    }
    if (body.coverImage !== undefined) {
      sets.push(`"coverImage" = $${i++}`); values.push((body.coverImage || '').toString().trim() || null)
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, session.userId)

    const result = await pool.query(
      `UPDATE "WishlistCollection" SET ${sets.join(', ')}
       WHERE id = $${i} AND "userId" = $${i+1}
       RETURNING id, name, description, slug, "isPublic", "coverImage", "createdAt", "updatedAt"`,
      values
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ collection: result.rows[0] })
  } catch (error: any) {
    console.error('Wishlist PATCH error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Move items back to default (collectionId = null) instead of deleting
    await pool.query(
      `UPDATE "MarketplaceSaved" SET "collectionId" = NULL
       WHERE "collectionId" = $1 AND "userId" = $2`,
      [params.id, session.userId]
    )

    const result = await pool.query(
      `DELETE FROM "WishlistCollection" WHERE id = $1 AND "userId" = $2 RETURNING id`,
      [params.id, session.userId]
    )
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Wishlist DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}