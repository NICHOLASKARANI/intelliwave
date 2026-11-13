export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET: list all my listings with stock info
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'ALL'
    const search = (searchParams.get('search') || '').trim()

    let where = `l."sellerId" = $1`
    const params: any[] = [session.userId]

    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      const p = `$${params.length}`
      where += ` AND (LOWER(l.title) LIKE ${p} OR LOWER(COALESCE(l.sku, '')) LIKE ${p})`
    }
    if (filter === 'ACTIVE') where += ` AND l.status = 'ACTIVE'`
    else if (filter === 'DRAFT') where += ` AND l.status = 'DRAFT'`
    else if (filter === 'OUT_OF_STOCK') where += ` AND COALESCE(l.stock, 0) = 0`
    else if (filter === 'LOW_STOCK') where += ` AND COALESCE(l.stock, 0) > 0 AND COALESCE(l.stock, 0) <= 3`

    const res = await pool.query(
      `SELECT
         l.id, l.title, l.price, l.stock, l.sku, l.category, l.status, l.views, l.images,
         l."createdAt", l."updatedAt"
       FROM "MarketplaceListing" l
       WHERE ${where}
       ORDER BY l."updatedAt" DESC NULLS LAST, l."createdAt" DESC
       LIMIT 500`,
      params
    )

    // Counts for filter chips
    const countsRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM "MarketplaceListing" WHERE "sellerId" = $1)::int AS "all",
         (SELECT COUNT(*) FROM "MarketplaceListing" WHERE "sellerId" = $1 AND status = 'ACTIVE')::int AS "active",
         (SELECT COUNT(*) FROM "MarketplaceListing" WHERE "sellerId" = $1 AND status = 'DRAFT')::int AS "draft",
         (SELECT COUNT(*) FROM "MarketplaceListing" WHERE "sellerId" = $1 AND COALESCE(stock, 0) = 0)::int AS "outOfStock",
         (SELECT COUNT(*) FROM "MarketplaceListing" WHERE "sellerId" = $1 AND COALESCE(stock, 0) > 0 AND COALESCE(stock, 0) <= 3)::int AS "lowStock"`,
      [session.userId]
    )

    return NextResponse.json({
      listings: res.rows,
      counts: countsRes.rows[0],
    })
  } catch (error: any) {
    console.error('Inventory GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH: update stock or price for a listing, or bulk update
// Body: { updates: [{ id, stock?, price?, status? }] } OR { listingId, stock?, price?, status? }
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const updates: any[] = Array.isArray(body.updates)
      ? body.updates
      : (body.listingId ? [body] : [])

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    let updated = 0
    let failed = 0

    for (const u of updates) {
      const listingId = parseInt(u.listingId ?? u.id, 10)
      if (!listingId) { failed++; continue }

      const sets: string[] = []
      const params: any[] = []
      let i = 1

      if (u.stock !== undefined) {
        const stock = Math.max(0, parseInt(u.stock, 10) || 0)
        sets.push(`stock = $${i++}`)
        params.push(stock)
      }
      if (u.price !== undefined) {
        const price = Math.max(0, Number(u.price) || 0)
        if (price > 0) {
          sets.push(`price = $${i++}`)
          params.push(price)
        }
      }
      if (u.status !== undefined) {
        const validStatuses = ['ACTIVE', 'DRAFT', 'SUSPENDED']
        if (validStatuses.includes(u.status)) {
          sets.push(`status = $${i++}`)
          params.push(u.status)
        }
      }

      if (sets.length === 0) { failed++; continue }
      sets.push(`"updatedAt" = NOW()`)
      params.push(listingId, session.userId)

      const result = await pool.query(
        `UPDATE "MarketplaceListing" SET ${sets.join(', ')}
         WHERE id = $${i} AND "sellerId" = $${i + 1}`,
        params
      )
      if (result.rowCount && result.rowCount > 0) updated++
      else failed++
    }

    return NextResponse.json({ success: true, updated, failed })
  } catch (error: any) {
    console.error('Inventory PATCH error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}