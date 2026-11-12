export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: public view of a shared collection (no auth required)
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const col = await pool.query(
      `SELECT id, name, description, slug, "coverImage", "createdAt", "userId"
       FROM "WishlistCollection" WHERE slug = $1 AND "isPublic" = true`,
      [params.slug]
    )
    if (col.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const items = await pool.query(
      `SELECT s.note, s."createdAt" AS "savedAt",
              l.id AS "listingId", l.title, l.price, l.images, l.location, l.condition, l.status
       FROM "MarketplaceSaved" s
       JOIN "MarketplaceListing" l ON s."listingId" = l.id
       WHERE s."collectionId" = $1 AND l.status = 'ACTIVE'
       ORDER BY s."createdAt" DESC`,
      [col.rows[0].id]
    )

    // Fetch creator name
    const owner = await pool.query(
      `SELECT name FROM "User" WHERE id = $1`,
      [col.rows[0].userId]
    )

    return NextResponse.json({
      collection: {
        ...col.rows[0],
        ownerName: owner.rows[0]?.name || 'Someone',
      },
      items: items.rows,
    })
  } catch (error: any) {
    console.error('Public wishlist GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}