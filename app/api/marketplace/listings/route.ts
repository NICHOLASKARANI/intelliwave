export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

// GET: List or single listing
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const sellerId = searchParams.get('sellerId')

    // Get single listing by ID
    if (id) {
      const result = await pool.query(
        `SELECT l.*, u.name as "sellerName", u.image as "sellerImage"
         FROM "MarketplaceListing" l
         JOIN "User" u ON l."sellerId" = u.id
         WHERE l.id = $1 AND l.status = 'ACTIVE'`,
        [parseInt(id!)]
      )
      
      if (result.rows.length > 0) {
        // Increment views
        await pool.query(
          `UPDATE "MarketplaceListing" SET views = views + 1 WHERE id = $1`,
          [parseInt(id!)]
        )
      }
      
      return NextResponse.json({ listing: result.rows[0] || null })
    }

    // Build query
    let query = `SELECT l.*, u.name as "sellerName", u.image as "sellerImage"
                 FROM "MarketplaceListing" l
                 JOIN "User" u ON l."sellerId" = u.id
                 WHERE l.status = 'ACTIVE'`
    const params: any[] = []

    if (category) {
      query += ` AND l.category = $${params.length + 1}`
      params.push(category)
    }

    if (search) {
      query += ` AND (l.title ILIKE $${params.length + 1} OR l.description ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    if (sellerId) {
      query += ` AND l."sellerId" = $${params.length + 1}`
      params.push(sellerId)
    }

    query += ` ORDER BY l."createdAt" DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await pool.query(query, params)
    return NextResponse.json({ listings: result.rows })
  } catch (error) {
    console.error('Listings GET error:', error)
    return NextResponse.json({ listings: [], error: 'Failed to fetch listings' })
  }
}

// POST: Create listing
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const result = await pool.query(
      `INSERT INTO "MarketplaceListing" ("sellerId", title, description, price, category, condition, location, images, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', NOW(), NOW())
       RETURNING *`,
      [session.userId, body.title, body.description || '', body.price, body.category, body.condition || 'Used', body.location || '', body.images || []]
    )

    // Update category count
    await pool.query(
      `UPDATE "MarketplaceCategory" SET "listingCount" = "listingCount" + 1 WHERE name = $1`,
      [body.category]
    )

    return NextResponse.json({ listing: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Listings POST error:', error)
    return NextResponse.json({ error: 'Failed to create listing: ' + (error as Error).message }, { status: 500 })
  }
}

// DELETE: Delete listing
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    // Verify ownership
    const check = await pool.query(
      `SELECT "sellerId" FROM "MarketplaceListing" WHERE id = $1`,
      [parseInt(id!)]
    )

    if (check.rows.length === 0 || check.rows[0].sellerId !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await pool.query(`DELETE FROM "MarketplaceListing" WHERE id = $1`, [parseInt(id!)])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed: ' + (error as Error).message }, { status: 500 })
  }
}