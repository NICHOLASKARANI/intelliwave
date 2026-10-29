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

    // Generate a unique referral code for this specific customer
    const referral_code = `REF-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`

    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "ExecutiveCustomer" (id, leader_id, customer_name, customer_email, customer_phone, product, subscription_amount, referral_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, leaderId, customer_name, customer_email.toLowerCase(), customer_phone || null, product, parseInt(subscription_amount) || 0, referral_code]
    )

    // The customer now gets this code to use during WaveCore signup
    return NextResponse.json({ 
      success: true, 
      id, 
      referral_code, 
      message: 'Customer registered. Give them this code to use when they subscribe.' 
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}