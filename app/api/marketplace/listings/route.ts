export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: Public — anyone can browse active listings
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)

    // Optional guard only if logged in (public reads are fine)
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

    if (id) {
      const result = await pool.query(
        `SELECT l.*, u.name as "sellerName", u.image as "sellerImage"
         FROM "MarketplaceListing" l
         JOIN "User" u ON l."sellerId" = u.id
         WHERE l.id = $1 AND l.status = 'ACTIVE'`,
        [parseInt(id)]
      )

      if (result.rows.length === 0) return NextResponse.json({ listing: null })
      await pool.query(`UPDATE "MarketplaceListing" SET views = views + 1 WHERE id = $1`, [parseInt(id)])
      return NextResponse.json({ listing: result.rows[0] })
    }

    let query = `SELECT l.*, u.name as "sellerName", u.image as "sellerImage"
                 FROM "MarketplaceListing" l
                 JOIN "User" u ON l."sellerId" = u.id
                 WHERE l.status = 'ACTIVE'`
    const params: any[] = []

    if (category) { query += ` AND l.category = $${params.length + 1}`; params.push(category) }
    if (search) {
      query += ` AND (l.title ILIKE $${params.length + 1} OR l.description ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }
    if (sellerId) { query += ` AND l."sellerId" = $${params.length + 1}`; params.push(sellerId) }

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

    const result = await pool.query(
      `INSERT INTO "MarketplaceListing" ("sellerId", title, description, price, category, condition, location, images, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', NOW(), NOW())
       RETURNING *`,
      [session.userId, body.title.trim(), body.description || '', body.price, body.category, body.condition || 'Used', body.location || '', body.images || []]
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

// DELETE: Auth + ownership required
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
    if (check.rows.length === 0 || check.rows[0].sellerId !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await pool.query(`DELETE FROM "MarketplaceListing" WHERE id = $1`, [parseInt(id)])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Listings DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
// PATCH: Auth + ownership required — update listing (e.g. remove images)
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

    // Admin override: allow owner OR admin session
    const isOwner = check.rows[0].sellerId === session.userId
    const isAdmin = session.role === 'OWNER' || session.role === 'TENANT_ADMIN'
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['title', 'description', 'category', 'condition', 'location', 'status']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    if (body.price !== undefined) { sets.push(`price = $${i++}`); values.push(Number(body.price || 0)) }
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