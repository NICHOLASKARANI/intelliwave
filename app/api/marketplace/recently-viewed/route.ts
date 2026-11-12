export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

// GET: list user's recently viewed (joined with listing data)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ recentlyViewed: [] })

    const res = await pool.query(
      `SELECT rv."viewedAt", l.id AS "listingId", l.title, l.price, l.images, l.location, l.condition
       FROM "RecentlyViewed" rv
       JOIN "MarketplaceListing" l ON l.id = rv."listingId"
       WHERE rv."userId" = $1 AND l.status = 'ACTIVE'
       ORDER BY rv."viewedAt" DESC
       LIMIT 20`,
      [session.userId]
    )

    return NextResponse.json({ recentlyViewed: res.rows })
  } catch (error: any) {
    console.error('Recently viewed GET error:', error?.message)
    return NextResponse.json({ recentlyViewed: [] })
  }
}

// POST: record a view (called on listing page mount)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ success: false })

    const body = await req.json().catch(() => ({}))
    const listingId = parseInt(body.listingId, 10)
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "RecentlyViewed" (id, "userId", "listingId", "viewedAt")
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT ("userId", "listingId") DO UPDATE SET "viewedAt" = NOW()`,
      [id, session.userId, listingId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Recently viewed POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE: clear user's recent views
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await pool.query(`DELETE FROM "RecentlyViewed" WHERE "userId" = $1`, [session.userId])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Recently viewed DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}