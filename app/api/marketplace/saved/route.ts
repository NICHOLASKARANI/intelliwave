export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

// GET: Get saved listings
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT s.*, l.title, l.price, l.images, l.location, l."createdAt" as "listingCreatedAt"
       FROM "MarketplaceSaved" s
       JOIN "MarketplaceListing" l ON s."listingId" = l.id
       WHERE s."userId" = $1
       ORDER BY s."createdAt" DESC`,
      [session!.userId]
    )

    return NextResponse.json({ saved: result.rows })
  } catch (error) {
    console.error('Saved GET error:', error)
    return NextResponse.json({ saved: [] })
  }
}

// POST: Save listing
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const result = await pool.query(
      `INSERT INTO "MarketplaceSaved" ("userId", "listingId", "createdAt")
       VALUES ($1, $2, NOW())
       ON CONFLICT ("userId", "listingId") DO NOTHING
       RETURNING *`,
      [session!.userId, body.listingId]
    )

    return NextResponse.json({ saved: result.rows[0], success: true }, { status: 201 })
  } catch (error) {
    console.error('Saved POST error:', error)
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 })
  }
}

// DELETE: Remove saved listing
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')

    await pool.query(
      `DELETE FROM "MarketplaceSaved" WHERE "userId" = $1 AND "listingId" = $2`,
      [session!.userId, listingId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove saved' }, { status: 500 })
  }
}