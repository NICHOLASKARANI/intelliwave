export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: Commission + earnings statement (defaults to current month)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_READ')
    if (guard.deny) return guard.response!

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const now = new Date()
    const monthStart = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // All order items for this seller in the period
    const itemsRes = await pool.query(
      `SELECT oi.*, o."orderNumber", o."createdAt" AS "orderDate", o.status AS "orderStatus"
       FROM "MarketplaceOrderItem" oi
       JOIN "MarketplaceOrder" o ON oi."orderId" = o.id
       WHERE oi."sellerId" = $1 AND o."createdAt" >= $2 AND o."createdAt" <= $3
       ORDER BY o."createdAt" DESC`,
      [session.userId, monthStart.toISOString(), monthEnd.toISOString()]
    )

    const items = itemsRes.rows

    const grossSales = items.reduce((s, i) => s + Number(i.lineTotal || 0), 0)
    const totalCommission = items.reduce((s, i) => s + Number(i.commissionAmount || 0), 0)
    const netPayout = items.reduce((s, i) => s + Number(i.sellerPayout || 0), 0)
    const settledCount = items.filter(i => i.fulfillmentStatus === 'SETTLED').length
    const pendingCount = items.filter(i => i.fulfillmentStatus === 'PENDING' || i.fulfillmentStatus === 'SHIPPED').length
    const cancelledCount = items.filter(i => i.fulfillmentStatus === 'CANCELLED').length

    // Wallet snapshot
    const walletRes = await pool.query(
      `SELECT * FROM "SellerWallet" WHERE "sellerId" = $1`,
      [session.userId]
    )
    const wallet = walletRes.rows[0] || {}

    // Daily breakdown
    const dailyMap: Record<string, { gross: number; commission: number; net: number; count: number }> = {}
    for (const item of items) {
      const day = new Date(item.orderDate).toISOString().slice(0, 10)
      if (!dailyMap[day]) dailyMap[day] = { gross: 0, commission: 0, net: 0, count: 0 }
      dailyMap[day].gross += Number(item.lineTotal || 0)
      dailyMap[day].commission += Number(item.commissionAmount || 0)
      dailyMap[day].net += Number(item.sellerPayout || 0)
      dailyMap[day].count += 1
    }
    const daily = Object.entries(dailyMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      period: { from: monthStart.toISOString(), to: monthEnd.toISOString() },
      summary: {
        grossSales: Math.round(grossSales * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        netPayout: Math.round(netPayout * 100) / 100,
        effectiveCommissionRate: grossSales > 0 ? Math.round((totalCommission / grossSales) * 10000) / 100 : 0,
        itemCount: items.length,
        settledCount,
        pendingCount,
        cancelledCount,
      },
      wallet: {
        availableBalance: Number(wallet.availableBalance || 0),
        pendingBalance: Number(wallet.pendingBalance || 0),
        reserveBalance: Number(wallet.reserveBalance || 0),
        lifetimeEarnings: Number(wallet.lifetimeEarnings || 0),
        lifetimeCommission: Number(wallet.lifetimeCommission || 0),
      },
      daily,
      items: items.slice(0, 200),
    })
  } catch (error) {
    console.error('Commission GET error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}