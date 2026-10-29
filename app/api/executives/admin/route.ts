export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

function isAdmin(req: NextRequest): boolean {
  const pw = req.headers.get('x-ceo-password')
  return pw === process.env.SHOP_ADMIN_PASSWORD // reuse existing env var
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const leaders = await pool.query('SELECT * FROM "ExecutiveLeader" ORDER BY applied_at DESC')
    const ideas = await pool.query('SELECT * FROM "ExecutiveIdea" ORDER BY submitted_at DESC')
    const customers = await pool.query('SELECT * FROM "ExecutiveCustomer" ORDER BY registered_at DESC')
    const payouts = await pool.query('SELECT * FROM "ExecutivePayout" ORDER BY requested_at DESC')

    return NextResponse.json({
      leaders: leaders.rows,
      ideas: ideas.rows,
      customers: customers.rows,
      payouts: payouts.rows,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { action, target_id, notes } = body

    // ── Action: Approve/Reject a leader ──
    if (action === 'approve_leader' || action === 'reject_leader') {
      const status = action === 'approve_leader' ? 'APPROVED' : 'REJECTED'
      await pool.query(
        'UPDATE "ExecutiveLeader" SET status = $1, approved_at = NOW(), approved_by = $2 WHERE id = $3',
        [status, 'CEO', target_id]
      )
      return NextResponse.json({ success: true })
    }

    // ── Action: Mark customer as paying (link to their real org) ──
    if (action === 'verify_customer') {
      const customerRes = await pool.query('SELECT * FROM "ExecutiveCustomer" WHERE id = $1', [target_id])
      if (customerRes.rows.length === 0) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

      // Find org by email match
      const orgRes = await pool.query(
        'SELECT id FROM "Organization" WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [customerRes.rows[0].customer_email]
      )

      await pool.query(
        'UPDATE "ExecutiveCustomer" SET is_paying = TRUE, subscription_status = $1, verified_at = NOW(), verified_by = $2, organization_id = $3 WHERE id = $4',
        ['ACTIVE', 'CEO', orgRes.rows[0]?.id || null, target_id]
      )

      // Recalculate leader level
      const leaderRes = await pool.query(
        'SELECT COUNT(*)::int AS n FROM "ExecutiveCustomer" WHERE leader_id = $1 AND is_paying = TRUE',
        [customerRes.rows[0].leader_id]
      )
      const activeUsers = leaderRes.rows[0].n
      let level = 0
      if (activeUsers >= 100) level = 3
      else if (activeUsers >= 60) level = 2
      else if (activeUsers >= 30) level = 1

      await pool.query(
        'UPDATE "ExecutiveLeader" SET total_active_users = $1, level = $2 WHERE id = $3',
        [activeUsers, level, customerRes.rows[0].leader_id]
      )

      return NextResponse.json({ success: true, active_users: activeUsers, level })
    }

    // ── Action: Approve payout ──
    if (action === 'approve_payout' || action === 'reject_payout') {
      const status = action === 'approve_payout' ? 'APPROVED' : 'REJECTED'
      await pool.query(
        'UPDATE "ExecutivePayout" SET status = $1, approved_at = NOW(), admin_notes = $2 WHERE id = $3',
        [status, notes || null, target_id]
      )
      return NextResponse.json({ success: true })
    }

    // ── Action: Send gift ──
    if (action === 'send_gift') {
      await pool.query('UPDATE "ExecutiveLeader" SET gift_sent = TRUE WHERE id = $1', [target_id])
      return NextResponse.json({ success: true, message: 'Gift of KSh 200 sent' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}