export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'ALL'
    const search = (searchParams.get('search') || '').trim()

    let havingClause = ''
    if (filter === 'REPEAT') havingClause = ' HAVING COUNT(DISTINCT o.id) >= 2'

    const params: any[] = [session.userId]
    let searchFilter = ''
    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      searchFilter = ` AND (LOWER(COALESCE(u.name, '')) LIKE $${params.length} OR LOWER(COALESCE(u.email, '')) LIKE $${params.length})`
    }

    const res = await pool.query(
      `SELECT
         u.id AS "buyerId",
         u.name AS "buyerName",
         u.email AS "buyerEmail",
         u.image AS "buyerImage",
         COUNT(DISTINCT o.id)::int AS "totalOrders",
         COALESCE(SUM(oi."sellerPayout"), 0)::float AS "totalSpent",
         MIN(o."createdAt") AS "firstOrderAt",
         MAX(o."createdAt") AS "lastOrderAt"
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON o.id = oi."orderId"
       JOIN "User" u ON u.id = o."buyerId"
       WHERE oi."sellerId" = $1
         AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')
         ${searchFilter}
       GROUP BY u.id, u.name, u.email, u.image
       ${havingClause}
       ORDER BY "totalSpent" DESC, "lastOrderAt" DESC
       LIMIT 200`,
      params
    )

    // Summary counts
    const summaryRes = await pool.query(
      `SELECT
         COUNT(DISTINCT o."buyerId")::int AS "uniqueCustomers",
         COUNT(DISTINCT CASE WHEN buyers.orders >= 2 THEN o."buyerId" END)::int AS "repeatCustomers",
         COUNT(DISTINCT o."buyerId")::int AS "totalBuyers"
       FROM "MarketplaceOrder" o
       JOIN "MarketplaceOrderItem" oi ON oi."orderId" = o.id
       LEFT JOIN (
         SELECT "buyerId", COUNT(*) AS orders
         FROM "MarketplaceOrder"
         WHERE "paymentStatus" = 'PAID' AND status IN ('CONFIRMED','SHIPPED','DELIVERED')
         GROUP BY "buyerId"
       ) buyers ON buyers."buyerId" = o."buyerId"
       WHERE oi."sellerId" = $1
         AND o."paymentStatus" = 'PAID'
         AND o.status IN ('CONFIRMED','SHIPPED','DELIVERED')`,
      [session.userId]
    )

    return NextResponse.json({
      customers: res.rows,
      summary: summaryRes.rows[0],
    })
  } catch (error: any) {
    console.error('Customers error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}