export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

const VALID_ACTIONS = ['suspend', 'reactivate', 'delete']

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
      where += ` AND (LOWER(COALESCE(u.name, '')) LIKE ${p} OR LOWER(u.email) LIKE ${p} OR LOWER(COALESCE(u.phone, '')) LIKE ${p})`
    }
    if (filter === 'ACTIVE') where += ` AND u."isActive" = true`
    else if (filter === 'SUSPENDED') where += ` AND u."isActive" = false`
    else if (filter === 'SELLERS') where += ` AND EXISTS (SELECT 1 FROM "SellerProfile" sp WHERE sp."userId" = u.id)`

    const listRes = await pool.query(
      `SELECT
         u.id, u.name, u.email, u.phone, u.role, u."isActive",
         u."createdAt", u."lastLogin",
         EXISTS (SELECT 1 FROM "SellerProfile" sp WHERE sp."userId" = u.id) AS "isSeller",
         (SELECT sp."storeName" FROM "SellerProfile" sp WHERE sp."userId" = u.id LIMIT 1) AS "storeName",
         (SELECT sp.verification FROM "SellerProfile" sp WHERE sp."userId" = u.id LIMIT 1) AS "sellerVerification",
         COALESCE((SELECT COUNT(*) FROM "MarketplaceOrder" o WHERE o."buyerId" = u.id), 0)::int AS "ordersAsBuyer",
         COALESCE((SELECT COUNT(*) FROM "MarketplaceReview" r WHERE r."reviewerId" = u.id), 0)::int AS "reviewsWritten"
       FROM "User" u
       WHERE ${where}
       ORDER BY u."createdAt" DESC
       LIMIT 300`,
      params
    )

    const kpiRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM "User")::int AS total,
         (SELECT COUNT(*) FROM "User" WHERE "isActive" = true)::int AS active,
         (SELECT COUNT(*) FROM "User" WHERE "isActive" = false)::int AS suspended,
         (SELECT COUNT(DISTINCT "userId") FROM "SellerProfile")::int AS sellers`
    )

    return NextResponse.json({
      users: listRes.rows,
      kpi: kpiRes.rows[0],
    })
  } catch (error: any) {
    console.error('Admin users GET error:', error?.message)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const { userId, action } = body
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use: ' + VALID_ACTIONS.join(', ') }, { status: 400 })
    }

    const exists = await pool.query(`SELECT id, email FROM "User" WHERE id = $1`, [userId])
    if (exists.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'suspend') {
      await pool.query(
        `UPDATE "User" SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1`,
        [userId]
      )
    } else if (action === 'reactivate') {
      await pool.query(
        `UPDATE "User" SET "isActive" = true, "updatedAt" = NOW() WHERE id = $1`,
        [userId]
      )
    } else if (action === 'delete') {
      // Soft-delete: deactivate + anonymize so email is freed for re-signup
      // Preserves all referential integrity (orders, reviews, listings)
      await pool.query(
        `UPDATE "User"
         SET "isActive" = false,
             email = 'deleted_' || id || '@deleted.local',
             name = 'Deleted User',
             phone = NULL,
             image = NULL,
             avatar = NULL,
             "updatedAt" = NOW()
         WHERE id = $1`,
        [userId]
      )
      // Also suspend any seller profile
      await pool.query(
        `UPDATE "SellerProfile" SET status = 'SUSPENDED', "updatedAt" = NOW() WHERE "userId" = $1`,
        [userId]
      ).catch(() => {})
      // Suspend their active listings
      await pool.query(
        `UPDATE "MarketplaceListing" SET status = 'SUSPENDED' WHERE "sellerId" = $1 AND status = 'ACTIVE'`,
        [userId]
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, action })
  } catch (error: any) {
    console.error('Admin users POST error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}