export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

// GET: full search with filters + sort + history tracking
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req).catch(() => null)
    const { searchParams } = new URL(req.url)

    const q = (searchParams.get('q') || '').trim()
    const category = searchParams.get('category') || ''
    const sellerId = searchParams.get('sellerId') || ''
    const condition = searchParams.get('condition') || ''
    const location = searchParams.get('location') || ''
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null
    const inStock = searchParams.get('inStock') === 'true'
    const sort = searchParams.get('sort') || 'newest'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

    let query = `SELECT l.*, u.name as "sellerName", u.image as "sellerImage",
                 sp."storeName", sp."averageRating", sp."totalReviews", sp."trustScore",
                 (SELECT COUNT(*)::int FROM "MarketplaceFollow" f WHERE f."sellerId" = l."sellerId") AS "sellerFollowerCount"
                 FROM "MarketplaceListing" l
                 JOIN "User" u ON l."sellerId" = u.id
                 LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
                 WHERE l.status = 'ACTIVE'`
    const params: any[] = []

    if (q) {
      params.push(`%${q}%`)
      const p = `$${params.length}`
      query += ` AND (l.title ILIKE ${p} OR l.description ILIKE ${p} OR l.sku ILIKE ${p} OR l.category ILIKE ${p})`
    }
    if (category) { query += ` AND l.category = $${params.length + 1}`; params.push(category) }
    if (sellerId) { query += ` AND l."sellerId" = $${params.length + 1}`; params.push(sellerId) }
    if (condition) { query += ` AND l.condition = $${params.length + 1}`; params.push(condition) }
    if (location) { query += ` AND l.location ILIKE $${params.length + 1}`; params.push(`%${location}%`) }
    if (minPrice !== null && !Number.isNaN(minPrice)) { query += ` AND l.price >= $${params.length + 1}`; params.push(minPrice) }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) { query += ` AND l.price <= $${params.length + 1}`; params.push(maxPrice) }
    if (minRating !== null && !Number.isNaN(minRating)) { query += ` AND sp."averageRating" >= $${params.length + 1}`; params.push(minRating) }
    if (inStock) query += ` AND l.stock > 0`

    const sortMap: Record<string, string> = {
      newest: 'l."createdAt" DESC',
      oldest: 'l."createdAt" ASC',
      price_asc: 'l.price ASC',
      price_desc: 'l.price DESC',
      popular: 'l.views DESC, l."createdAt" DESC',
      rating: 'sp."averageRating" DESC NULLS LAST, l."createdAt" DESC',
    }
    query += ` ORDER BY ${sortMap[sort] || sortMap.newest}`
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    // Log search to history if authenticated + has query
    if (session && q.length > 1) {
      const id = crypto.randomUUID()
      await pool.query(
        `INSERT INTO "SearchHistory" (id, "userId", query, "resultCount", "createdAt")
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, session.userId, q.slice(0, 200), result.rows.length]
      ).catch(() => {})
    }

    return NextResponse.json({
      listings: result.rows,
      total: result.rows.length,
      filters: { q, category, condition, location, minPrice, maxPrice, minRating, inStock, sort },
    })
  } catch (error: any) {
    console.error('Search error:', error?.message)
    return NextResponse.json({ listings: [], error: 'Search failed' }, { status: 500 })
  }
}