export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import crypto from 'crypto'

const LEVEL_AMOUNTS = { 1: 3000, 2: 8000, 3: 20000 }

export async function POST(req: NextRequest) {
  try {
    const leaderId = req.cookies.get('executive_session')?.value
    if (!leaderId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const leaderRes = await pool.query('SELECT * FROM "ExecutiveLeader" WHERE id = $1', [leaderId])
    if (leaderRes.rows.length === 0) return NextResponse.json({ error: 'Leader not found' }, { status: 404 })
    const leader = leaderRes.rows[0]

    if (leader.level === 0) {
      return NextResponse.json({ error: 'You must reach Level 1 (30+ paying users) to request payout' }, { status: 400 })
    }

    // Check for existing pending payout
    const existing = await pool.query(
      'SELECT id FROM "ExecutivePayout" WHERE leader_id = $1 AND status = $2',
      [leaderId, 'PENDING']
    )
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'You already have a pending payout request' }, { status: 409 })
    }

    const body = await req.json()
    const { payment_method, payment_details } = body
    if (!payment_method || !payment_details) {
      return NextResponse.json({ error: 'Payment method and details required' }, { status: 400 })
    }

    const amount = LEVEL_AMOUNTS[leader.level as 1 | 2 | 3]
    const id = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "ExecutivePayout" (id, leader_id, amount, level_at_payout, payment_method, payment_details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, leaderId, amount, leader.level, payment_method, payment_details]
    )

    return NextResponse.json({ success: true, id, amount }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Payout request failed' }, { status: 500 })
  }
}