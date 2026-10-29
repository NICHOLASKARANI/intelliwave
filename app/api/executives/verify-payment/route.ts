export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_email, organization_id, amount, status } = body

    // In production, secure this with a secret header so only your M-Pesa callback can call it
    const secret = req.headers.get('x-webhook-secret')
    if (secret !== process.env.SHOP_ADMIN_PASSWORD) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (status !== 'SUCCESS') return NextResponse.json({ ignored: true })

    // Find the customer registered by a leader
    const customerRes = await pool.query(
      'SELECT * FROM "ExecutiveCustomer" WHERE LOWER(customer_email) = LOWER($1) AND is_paying = FALSE',
      [customer_email]
    )

    if (customerRes.rows.length === 0) {
      return NextResponse.json({ message: 'No matching leader referral found or already paid' })
    }

    const customer = customerRes.rows[0]

    // Mark as paying and link the organization
    await pool.query(
      `UPDATE "ExecutiveCustomer" 
       SET is_paying = TRUE, subscription_status = 'ACTIVE', organization_id = $1, verified_at = NOW(), verified_by = 'AUTO-MPESA' 
       WHERE id = $2`,
      [organization_id, customer.id]
    )

    // Recalculate Leader Level
    const leaderId = customer.leader_id
    const countRes = await pool.query(
      'SELECT COUNT(*)::int AS n FROM "ExecutiveCustomer" WHERE leader_id = $1 AND is_paying = TRUE',
      [leaderId]
    )
    
    const activeUsers = countRes.rows[0].n
    let newLevel = 0
    if (activeUsers >= 100) newLevel = 3
    else if (activeUsers >= 60) newLevel = 2
    else if (activeUsers >= 30) newLevel = 1

    await pool.query(
      'UPDATE "ExecutiveLeader" SET total_active_users = $1, level = $2 WHERE id = $3',
      [activeUsers, newLevel, leaderId]
    )

    return NextResponse.json({ 
      success: true, 
      message: `Auto-verified! Leader ${leaderId} is now Level ${newLevel} with ${activeUsers} users.` 
    })

  } catch (error) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}