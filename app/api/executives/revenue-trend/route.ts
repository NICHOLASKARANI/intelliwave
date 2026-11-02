export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  const leaderId = req.cookies.get('executive_session')?.value
  if (!leaderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get last 12 months of registered paying customers
  const res = await pool.query(`
    SELECT 
      TO_CHAR(registered_at, 'Mon') AS month,
      COUNT(*)::int AS customers,
      COALESCE(SUM(subscription_amount), 0)::int AS revenue
    FROM "ExecutiveCustomer"
    WHERE leader_id = $1 AND is_paying = TRUE
      AND registered_at >= NOW() - INTERVAL '12 months'
    GROUP BY month, DATE_TRUNC('month', registered_at)
    ORDER BY DATE_TRUNC('month', registered_at) ASC
  `, [leaderId])

  return NextResponse.json({ trend: res.rows })
}