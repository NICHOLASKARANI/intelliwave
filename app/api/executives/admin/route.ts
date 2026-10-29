export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { ExecutiveNotifications } from '@/lib/executives/notify'

function isAdmin(req: NextRequest): boolean {
  return req.headers.get('x-ceo-password') === process.env.SHOP_ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const level = searchParams.get('level') || ''

    // 1. Base Queries with Filtering
    let leaderWhere = 'WHERE 1=1'
    const params: any[] = []
    if (search) {
      params.push(`%${search}%`)
      leaderWhere += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`
    }
    if (level) {
      params.push(parseInt(level))
      leaderWhere += ` AND level = $${params.length}`
    }

    const leaders = await pool.query(`SELECT * FROM "ExecutiveLeader" ${leaderWhere} ORDER BY applied_at DESC`, params)
    const ideas = await pool.query('SELECT * FROM "ExecutiveIdea" ORDER BY submitted_at DESC')
    const customers = await pool.query('SELECT * FROM "ExecutiveCustomer" ORDER BY registered_at DESC')
    const payouts = await pool.query('SELECT * FROM "ExecutivePayout" ORDER BY requested_at DESC')

    // 2. Real-Time KPI Calculations
    const activeCustomers = customers.rows.filter(c => c.is_paying).length
    
    // Real MRR from linked active customers
    const mrr = customers.rows.filter(c => c.is_paying).reduce((sum, c) => sum + (Number(c.subscription_amount) || 0), 0)
    
    // Rewards Owed based on current approved leader levels
    const approvedLeaders = leaders.rows.filter(l => l.status === 'APPROVED')
    const l1 = approvedLeaders.filter(l => l.level === 1).length
    const l2 = approvedLeaders.filter(l => l.level === 2).length
    const l3 = approvedLeaders.filter(l => l.level === 3).length
    const rewardsOwed = (l1 * 3000) + (l2 * 8000) + (l3 * 20000)
    
    const paidOut = payouts.rows.filter(p => p.status === 'APPROVED' || p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0)

    return NextResponse.json({
      metrics: {
        totalLeaders: leaders.rows.length,
        activeCustomers,
        mrr,
        rewardsOwed,
        paidOut,
        netRevenue: mrr - rewardsOwed,
        roi: rewardsOwed > 0 ? (mrr / rewardsOwed).toFixed(1) : '0.0',
        levels: { l1, l2, l3 }
      },
      leaders: leaders.rows,
      ideas: ideas.rows,
      customers: customers.rows,
      payouts: payouts.rows
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
      if (status === 'APPROVED') {
        const leaderRes = await pool.query('SELECT full_name, email FROM "ExecutiveLeader" WHERE id = $1', [target_id])
        if (leaderRes.rows[0]) {
          ExecutiveNotifications.applicationApproved(leaderRes.rows[0].full_name, leaderRes.rows[0].email).catch(e => console.error('[notify approve]', e))
        }
      }
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
      if (status === 'APPROVED') {
        const payoutRes = await pool.query(
          'SELECT p.amount, l.full_name, l.email FROM "ExecutivePayout" p JOIN "ExecutiveLeader" l ON l.id = p.leader_id WHERE p.id = $1',
          [target_id]
        )
        if (payoutRes.rows[0]) {
          const p = payoutRes.rows[0]
          ExecutiveNotifications.payoutApproved(p.full_name, p.email, p.amount).catch(e => console.error('[notify payout]', e))
        }
      }
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