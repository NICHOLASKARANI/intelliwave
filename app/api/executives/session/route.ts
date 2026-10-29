export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  try {
    const leaderId = req.cookies.get('executive_session')?.value
    if (!leaderId) return NextResponse.json({ authenticated: false })

    const res = await pool.query('SELECT * FROM "ExecutiveLeader" WHERE id = $1', [leaderId])
    if (res.rows.length === 0) return NextResponse.json({ authenticated: false })

    const leader = res.rows[0]
    if (leader.status !== 'APPROVED') return NextResponse.json({ authenticated: false })

    // Get earnings + active customers count
    const customerCount = await pool.query(
      'SELECT COUNT(*)::int AS n FROM "ExecutiveCustomer" WHERE leader_id = $1 AND is_paying = TRUE',
      [leader.id]
    )

    const ideas = await pool.query(
      'SELECT * FROM "ExecutiveIdea" WHERE leader_id = $1 ORDER BY submitted_at DESC',
      [leader.id]
    )

    const customers = await pool.query(
      'SELECT * FROM "ExecutiveCustomer" WHERE leader_id = $1 ORDER BY registered_at DESC',
      [leader.id]
    )

    const payouts = await pool.query(
      'SELECT * FROM "ExecutivePayout" WHERE leader_id = $1 ORDER BY requested_at DESC',
      [leader.id]
    )

    return NextResponse.json({
      authenticated: true,
      leader: {
        id: leader.id,
        name: leader.full_name,
        email: leader.email,
        phone: leader.phone,
        referral_code: leader.referral_code,
        level: leader.level,
        total_active_users: customerCount.rows[0].n,
        total_earnings: leader.total_earnings,
        gift_sent: leader.gift_sent,
      },
      ideas: ideas.rows,
      customers: customers.rows,
      payouts: payouts.rows,
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}