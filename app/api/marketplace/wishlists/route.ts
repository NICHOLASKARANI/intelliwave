export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

// GET: list user's collections (with item counts)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await pool.query(
      `SELECT
         c.id, c.name, c.description, c.slug, c."isPublic", c."coverImage",
         c."createdAt", c."updatedAt",
         COALESCE((SELECT COUNT(*) FROM "MarketplaceSaved" s WHERE s."collectionId" = c.id), 0)::int AS "itemCount"
       FROM "WishlistCollection" c
       WHERE c."userId" = $1
       ORDER BY c."updatedAt" DESC`,
      [session.userId]
    )

    return NextResponse.json({ collections: res.rows })
  } catch (error: any) {
    console.error('Wishlists GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST: create a new collection
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const name = (body.name || '').toString().trim().slice(0, 80)
    const description = (body.description || '').toString().trim().slice(0, 300)
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    // Limit: 50 collections per user
    const count = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "WishlistCollection" WHERE "userId" = $1`,
      [session.userId]
    )
    if (count.rows[0].c >= 50) {
      return NextResponse.json({ error: 'Max 50 collections reached' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    const { generateWishlistSlug } = await import('@/lib/marketplace/wishlist-alerts')
    let slug = generateWishlistSlug(name)

    // Retry once if slug collision
    const existing = await pool.query(`SELECT id FROM "WishlistCollection" WHERE slug = $1`, [slug])
    if (existing.rows.length > 0) slug = generateWishlistSlug(name)

    await pool.query(
      `INSERT INTO "WishlistCollection" (id, "userId", name, description, slug, "isPublic", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
      [id, session.userId, name, description || null, slug]
    )

    const created = await pool.query(
      `SELECT id, name, description, slug, "isPublic", "coverImage", "createdAt", "updatedAt", 0 AS "itemCount"
       FROM "WishlistCollection" WHERE id = $1`,
      [id]
    )

    return NextResponse.json({ collection: created.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Wishlists POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}