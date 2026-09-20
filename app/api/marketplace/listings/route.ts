export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// Auto-create a SellerProfile on first listing creation
async function ensureSellerProfile(userId: string, organizationId: string, userName: string) {
  const existing = await pool.query(`SELECT id FROM "SellerProfile" WHERE "userId" = $1`, [userId])
  if (existing.rows.length > 0) return existing.rows[0].id

  const crypto = require('crypto')
  const id = crypto.randomUUID()
  const slug = (userName || 'seller').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 6)

  await pool.query(
    `INSERT INTO "SellerProfile" (id, "userId", "organizationId", "storeName", "storeSlug", status, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,'ACTIVE',NOW(),NOW())
     ON CONFLICT ("userId") DO NOTHING`,
    [id, userId, organizationId, userName || 'My Store', slug]
  )

  // Initialize wallet
  const walletId = crypto.randomUUID()
  await pool.query(
    `INSERT INTO "SellerWallet" (id, "sellerId", "organizationId", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,NOW(),NOW())
     ON CONFLICT ("sellerId") DO NOTHING`,
    [walletId, userId, organizationId]
  )

  return id
}

// GET: Public browse
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (session) {
      const guard = await guardHR(req, 'HR_READ')
      if (guard.deny) return guard.response!
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const sellerId = searchParams.get('sellerId')
    const inStock = searchParams.get('inStock') === 'true'

    if (id) {
      const result = await pool.query(
        `SELECT l.*, u.name as "sellerName", u.image as "sellerImage",
                sp."storeName", sp."storeLogo", sp."averageRating", sp."totalReviews", sp."trustScore", sp.verification
         FROM "MarketplaceListing" l
         JOIN "User" u ON l."sellerId" = u.id
         LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
         WHERE l.id = $1 AND l.status = 'ACTIVE'`,
        [parseInt(id)]
      )
      if (result.rows.length === 0) return NextResponse.json({ listing: null })
      await pool.query(`UPDATE "MarketplaceListing" SET views = views + 1 WHERE id = $1`, [parseInt(id)])
      return NextResponse.json({ listing: result.rows[0] })
    }

    let query = `SELECT l.*, u.name as "sellerName", u.image as "sellerImage",
                 sp."storeName", sp."averageRating", sp."totalReviews", sp."trustScore"
                 FROM "MarketplaceListing" l
                 JOIN "User" u ON l."sellerId" = u.id
                 LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
                 WHERE l.status = 'ACTIVE'`
    const params: any[] = []

    if (category) { query += ` AND l.category = $${params.length + 1}`; params.push(category) }
    if (search) {
      query += ` AND (l.title ILIKE $${params.length + 1} OR l.description ILIKE $${params.length + 1} OR l.sku ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }
    if (sellerId) { query += ` AND l."sellerId" = $${params.length + 1}`; params.push(sellerId) }
    if (inStock) { query += ` AND l.stock > 0` }

    query += ` ORDER BY l."createdAt" DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await pool.query(query, params)
    return NextResponse.json({ listings: result.rows })
  } catch (error) {
    console.error('Listings GET error:', error)
    return NextResponse.json({ listings: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Auth required — create listing
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.title || !body.title.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    if (!body.price) return NextResponse.json({ error: 'Price required' }, { status: 400 })

    await ensureSellerProfile(session.userId, session.organizationId, session.name || 'Seller')

    const result = await pool.query(
      `INSERT INTO "MarketplaceListing"
        ("sellerId", title, description, price, category, condition, location, images, status,
         "organizationId", sku, stock, "warehouseId", "fulfillmentType", "slaHours",
         "latitude", "longitude", "publishedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE',$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW(),NOW())
       RETURNING *`,
      [
        session.userId,
        body.title.trim(),
        body.description || '',
        Number(body.price),
        body.category || 'GENERAL',
        body.condition || 'New',
        body.location || '',
        body.images || [],
        session.organizationId,
        body.sku || null,
        Number(body.stock || 1),
        body.warehouseId || null,
        body.fulfillmentType || 'SELLER_SHIP',
        Number(body.slaHours || 48),
        body.latitude || null,
        body.longitude || null,
      ]
    )

    await pool.query(
      `UPDATE "MarketplaceCategory" SET "listingCount" = "listingCount" + 1 WHERE name = $1`,
      [body.category]
    ).catch(() => {})

    return NextResponse.json({ listing: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Listings POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// PATCH: Auth + ownership OR admin override
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const check = await pool.query(`SELECT "sellerId" FROM "MarketplaceListing" WHERE id = $1`, [parseInt(body.id)])
    if (check.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = check.rows[0].sellerId === session.userId
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['title', 'description', 'category', 'condition', 'location', 'status', 'sku', 'warehouseId', 'fulfillmentType']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    for (const k of ['price', 'stock', 'slaHours', 'latitude', 'longitude']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(Number(body[k] || 0)) }
    }
    if (body.images !== undefined) { sets.push(`images = $${i++}`); values.push(body.images) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(parseInt(body.id))

    const result = await pool.query(
      `UPDATE "MarketplaceListing" SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )
    return NextResponse.json({ listing: result.rows[0] })
  } catch (error) {
    console.error('Listings PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Auth + ownership
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const check = await pool.query(`SELECT "sellerId" FROM "MarketplaceListing" WHERE id = $1`, [parseInt(id)])
    if (check.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = check.rows[0].sellerId === session.userId
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    await pool.query(`DELETE FROM "MarketplaceListing" WHERE id = $1`, [parseInt(id)])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Listings DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}