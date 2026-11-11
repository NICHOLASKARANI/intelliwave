export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

const VALID_ACTIONS = ['verify', 'trust', 'unverify', 'suspend', 'reactivate']

export async function GET(req: NextRequest) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const headerPwd = req.headers.get('x-admin-password')
    const queryPwd = searchParams.get('password')
    if ((headerPwd || queryPwd) !== adminPassword) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    const filter = (searchParams.get('filter') || 'ALL').toUpperCase()
    const search = (searchParams.get('search') || '').trim()

    let where = '1=1'
    const params: any[] = []
    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      const p = `$${params.length}`
      where += ` AND (LOWER(s."storeName") LIKE ${p} OR LOWER(COALESCE(u.name, '')) LIKE ${p} OR LOWER(COALESCE(u.email, '')) LIKE ${p})`
    }
    if (filter === 'VERIFIED') where += ` AND s.verification = 'VERIFIED'`
    else if (filter === 'TRUSTED') where += ` AND s.verification = 'TRUSTED_SELLER'`
    else if (filter === 'UNVERIFIED') where += ` AND (s.verification = 'UNVERIFIED' OR s.verification IS NULL)`
    else if (filter === 'SUSPENDED') where += ` AND s.status = 'SUSPENDED'`
    else if (filter === 'READY') where += ` AND (s.verification = 'UNVERIFIED' OR s.verification IS NULL) AND COALESCE((SELECT COUNT(*) FROM "MarketplaceFollow" f WHERE f."sellerId" = s."userId"), 0) >= 1000`

    const listRes = await pool.query(
      `SELECT
         s.id,
         s."userId",
         s."storeName",
         s.verification,
         s.status,
         s."totalSales",
         s."averageRating",
         s."totalReviews",
         u.name AS "ownerName",
         u.email AS "ownerEmail",
         u."isActive" AS "userActive",
         COALESCE((SELECT COUNT(*) FROM "MarketplaceFollow" f WHERE f."sellerId" = s."userId"), 0)::int AS "followerCount",
         COALESCE((SELECT COUNT(*) FROM "MarketplaceListing" l WHERE l."sellerId" = s."userId" AND l.status = 'ACTIVE'), 0)::int AS "activeListings"
       FROM "SellerProfile" s
       LEFT JOIN "User" u ON u.id = s."userId"
       WHERE ${where}
       ORDER BY "followerCount" DESC, s."createdAt" DESC
       LIMIT 200`,
      params
    )

    const kpiRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM "SellerProfile")::int AS total,
         (SELECT COUNT(*) FROM "SellerProfile" WHERE verification = 'VERIFIED')::int AS verified,
         (SELECT COUNT(*) FROM "SellerProfile" WHERE verification = 'TRUSTED_SELLER')::int AS trusted,
         (SELECT COUNT(*) FROM "SellerProfile" s
            WHERE (s.verification = 'UNVERIFIED' OR s.verification IS NULL)
              AND COALESCE((SELECT COUNT(*) FROM "MarketplaceFollow" f WHERE f."sellerId" = s."userId"), 0) >= 1000
         )::int AS ready`
    )

    return NextResponse.json({
      sellers: listRes.rows,
      kpi: kpiRes.rows[0],
    })
  } catch (error: any) {
    console.error('Admin sellers GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load sellers' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })
    }
    const headerPwd = req.headers.get('x-admin-password')
    const body = await req.json().catch(() => ({}))
    if ((headerPwd || body.password) !== adminPassword) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    const { sellerId, action } = body
    if (!sellerId) return NextResponse.json({ error: 'sellerId required' }, { status: 400 })
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use: ' + VALID_ACTIONS.join(', ') }, { status: 400 })
    }

    const exists = await pool.query(`SELECT id FROM "SellerProfile" WHERE id = $1`, [sellerId])
    if (exists.rows.length === 0) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    if (action === 'verify') {
      await pool.query(`UPDATE "SellerProfile" SET verification = 'VERIFIED', "updatedAt" = NOW() WHERE id = $1`, [sellerId])
    } else if (action === 'trust') {
      await pool.query(`UPDATE "SellerProfile" SET verification = 'TRUSTED_SELLER', "updatedAt" = NOW() WHERE id = $1`, [sellerId])
    } else if (action === 'unverify') {
      await pool.query(`UPDATE "SellerProfile" SET verification = 'UNVERIFIED', "updatedAt" = NOW() WHERE id = $1`, [sellerId])
    } else if (action === 'suspend') {
      await pool.query(`UPDATE "SellerProfile" SET status = 'SUSPENDED', "updatedAt" = NOW() WHERE id = $1`, [sellerId])
      await pool.query(
        `UPDATE "MarketplaceListing" SET status = 'SUSPENDED' WHERE "sellerId" = (SELECT "userId" FROM "SellerProfile" WHERE id = $1) AND status = 'ACTIVE'`,
        [sellerId]
      ).catch(() => {})
    } else if (action === 'reactivate') {
      await pool.query(`UPDATE "SellerProfile" SET status = 'ACTIVE', "updatedAt" = NOW() WHERE id = $1`, [sellerId])
      await pool.query(
        `UPDATE "MarketplaceListing" SET status = 'ACTIVE' WHERE "sellerId" = (SELECT "userId" FROM "SellerProfile" WHERE id = $1) AND status = 'SUSPENDED'`,
        [sellerId]
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, action })
  } catch (error: any) {
    console.error('Admin sellers PATCH error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}