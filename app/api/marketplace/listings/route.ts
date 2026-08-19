import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = `SELECT * FROM "MarketplaceListing" WHERE status = 'ACTIVE'`
    const params: any[] = []

    if (category) {
      query += ` AND category = $${params.length + 1}`
      params.push(category)
    }

    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await pool.query(query, params)
    return NextResponse.json({ listings: result.rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    
    const result = await pool.query(
      `INSERT INTO "MarketplaceListing" ("sellerId", title, description, price, category, condition, location, images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
       RETURNING *`,
      [
        session.userId,
        body.title,
        body.description || '',
        body.price,
        body.category,
        body.condition || 'Used',
        body.location || '',
        body.images || [],
      ]
    )

    // Update category count
    await pool.query(
      `UPDATE "MarketplaceCategory" SET "listingCount" = "listingCount" + 1 WHERE name = $1`,
      [body.category]
    )

    return NextResponse.json({ listing: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Listing create error:', error)
    return NextResponse.json({ error: 'Failed to create listing: ' + error.message }, { status: 500 })
  }
}