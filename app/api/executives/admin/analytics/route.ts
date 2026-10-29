export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-ceo-password')
  if (pw !== process.env.SHOP_ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. Total Active Paying Customers brought by leaders
    const activeCustomersRes = await pool.query(
      'SELECT COUNT(*)::int AS n FROM "ExecutiveCustomer" WHERE is_paying = TRUE'
    )
    const activeCustomers = activeCustomersRes.rows[0].n

    // 2. Estimated MRR from these customers (using the subscription_amount stored)
    const mrrRes = await pool.query(
      'SELECT COALESCE(SUM(subscription_amount), 0)::float AS mrr FROM "ExecutiveCustomer" WHERE is_paying = TRUE'
    )
    const mrr = mrrRes.rows[0].mrr

    // 3. Total Rewards Owed (Based on current leader levels)
    const rewardsRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE level = 1)::int AS l1_count,
        COUNT(*) FILTER (WHERE level = 2)::int AS l2_count,
        COUNT(*) FILTER (WHERE level = 3)::int AS l3_count
      FROM "ExecutiveLeader" WHERE status = 'APPROVED'
    `)
    const { l1_count, l2_count, l3_count } = rewardsRes.rows[0]
    const totalRewards = (l1_count * 3000) + (l2_count * 8000) + (l3_count * 20000)

    // 4. Total Paid Out (Approved Payouts)
    const paidRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0)::float AS paid FROM \"ExecutivePayout\" WHERE status = 'APPROVED'"
    )
    const paidOut = paidRes.rows[0].paid

    return NextResponse.json({
      metrics: {
        activeCustomers,
        mrr,
        totalRewards,
        paidOut,
        netRevenue: mrr - totalRewards,
        roi: totalRewards > 0 ? (mrr / totalRewards).toFixed(2) : '0'
      },
      levels: { l1_count, l2_count, l3_count }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}