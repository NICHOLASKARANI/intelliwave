export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// POST: add a listing to a collection
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const listingId = parseInt(body.listingId, 10)
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    // Verify collection belongs to user
    const col = await pool.query(
      `SELECT id FROM "WishlistCollection" WHERE id = $1 AND "userId" = $2`,
      [params.id, session.userId]
    )
    if (col.rows.length === 0) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

    // Verify listing exists and is ACTIVE
    const listing = await pool.query(
      `SELECT id FROM "MarketplaceListing" WHERE id = $1 AND status = 'ACTIVE'`,
      [listingId]
    )
    if (listing.rows.length === 0) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    // Upsert: if already saved, just move to this collection
    const note = (body.note || '').toString().trim().slice(0, 300) || null
    const result = await pool.query(
      `INSERT INTO "MarketplaceSaved" ("userId", "listingId", "collectionId", note, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT ("userId", "listingId") DO UPDATE
         SET "collectionId" = $3, note = COALESCE($4, "MarketplaceSaved".note)
       RETURNING *`,
      [session.userId, listingId, params.id, note]
    )

    await pool.query(
      `UPDATE "WishlistCollection" SET "updatedAt" = NOW() WHERE id = $1`,
      [params.id]
    ).catch(() => {})

    return NextResponse.json({ saved: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Wishlist item POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE: remove a listing from this collection
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const listingId = parseInt(searchParams.get('listingId') || '0', 10)
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    await pool.query(
      `DELETE FROM "MarketplaceSaved"
       WHERE "userId" = $1 AND "listingId" = $2 AND "collectionId" = $3`,
      [session.userId, listingId, params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Wishlist item DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}