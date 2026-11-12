export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

// POST: set/update a price alert for a listing
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const listingId = parseInt(body.listingId, 10)
    const targetPrice = Number(body.targetPrice)

    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })
    if (!targetPrice || targetPrice <= 0 || Number.isNaN(targetPrice)) {
      return NextResponse.json({ error: 'Valid targetPrice required' }, { status: 400 })
    }

    // Verify listing
    const listing = await pool.query(
      `SELECT id, price FROM "MarketplaceListing" WHERE id = $1 AND status = 'ACTIVE'`,
      [listingId]
    )
    if (listing.rows.length === 0) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const currentPrice = Number(listing.rows[0].price)
    if (targetPrice >= currentPrice) {
      return NextResponse.json({ error: `Target price must be below current KES ${currentPrice.toLocaleString()}` }, { status: 400 })
    }

    // Upsert
    const id = crypto.randomUUID()
    const result = await pool.query(
      `INSERT INTO "WishlistPriceAlert" (id, "userId", "listingId", "targetPrice", "originalPrice", "isActive", "createdAt")
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       ON CONFLICT ("userId", "listingId") DO UPDATE
         SET "targetPrice" = $4, "originalPrice" = $5, "isActive" = true, "lastNotifiedAt" = NULL
       RETURNING *`,
      [id, session.userId, listingId, targetPrice, currentPrice]
    )

    return NextResponse.json({ alert: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Price alert POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// GET: list user's active alerts
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT
         a.id, a."listingId", a."targetPrice", a."originalPrice", a."lastNotifiedAt", a."isActive", a."createdAt",
         l.title, l.price AS "currentPrice", l.images, l.status AS "listingStatus"
       FROM "WishlistPriceAlert" a
       JOIN "MarketplaceListing" l ON l.id = a."listingId"
       WHERE a."userId" = $1
       ORDER BY a."createdAt" DESC`,
      [session.userId]
    )

    return NextResponse.json({ alerts: res.rows })
  } catch (error: any) {
    console.error('Price alert GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE: remove an alert
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const alertId = searchParams.get('id')
    if (!alertId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await pool.query(
      `DELETE FROM "WishlistPriceAlert" WHERE id = $1 AND "userId" = $2`,
      [alertId, session.userId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Price alert DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}