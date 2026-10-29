export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const leaderId = req.cookies.get('executive_session')?.value
    if (!leaderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { customer_name, customer_email, customer_phone, product, subscription_amount } = body

    if (!customer_name || !customer_email || !product) {
      return NextResponse.json({ error: 'Name, email, and product required' }, { status: 400 })
    }

    // Check for duplicate customer email for this leader
    const dup = await pool.query(
      'SELECT id FROM "ExecutiveCustomer" WHERE leader_id = $1 AND customer_email = $2',
      [leaderId, customer_email.toLowerCase()]
    )
    if (dup.rows.length > 0) {
      return NextResponse.json({ error: 'This customer is already registered under you' }, { status: 409 })
    }

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "ExecutiveCustomer" (id, leader_id, customer_name, customer_email, customer_phone, product, subscription_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, leaderId, customer_name, customer_email.toLowerCase(), customer_phone || null, product, parseInt(subscription_amount) || 0]
    )

    // Recalculate leader's active paying users
    const count = await pool.query(
      'SELECT COUNT(*)::int AS n FROM "ExecutiveCustomer" WHERE leader_id = $1 AND is_paying = TRUE',
      [leaderId]
    )
    const activeUsers = count.rows[0].n

    // Update leader's total_active_users
    await pool.query('UPDATE "ExecutiveLeader" SET total_active_users = $1 WHERE id = $2', [activeUsers, leaderId])

    // Auto-compute level based on paying users
    let level = 0
    if (activeUsers >= 100) level = 3
    else if (activeUsers >= 60) level = 2
    else if (activeUsers >= 30) level = 1
    await pool.query('UPDATE "ExecutiveLeader" SET level = $1 WHERE id = $2', [level, leaderId])

    return NextResponse.json({ success: true, id, active_users: activeUsers, level }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}