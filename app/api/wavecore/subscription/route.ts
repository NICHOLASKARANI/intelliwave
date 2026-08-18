import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSession } from '@/lib/wavecore/auth'

const SUBSCRIPTION_AMOUNT = 500 // KSH
const SUBSCRIPTION_CURRENCY = 'KES'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT s.*, o.name as org_name
       FROM "Subscription" s
       JOIN "Organization" o ON o.id = s."organizationId"
       WHERE s."organizationId" = $1
       ORDER BY s."createdAt" DESC
       LIMIT 1`,
      [session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        subscribed: false,
        amount: SUBSCRIPTION_AMOUNT,
        currency: SUBSCRIPTION_CURRENCY,
      })
    }

    const sub = result.rows[0]
    const isActive = sub.status === 'ACTIVE' && new Date(sub.expiresAt) > new Date()

    return NextResponse.json({
      subscribed: isActive,
      amount: SUBSCRIPTION_AMOUNT,
      currency: SUBSCRIPTION_CURRENCY,
      plan: sub.plan,
      status: sub.status,
      startedAt: sub.createdAt,
      expiresAt: sub.expiresAt,
      paymentMethod: sub.paymentMethod,
      lastPayment: sub.lastPayment,
      daysRemaining: isActive ? Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
    })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { paymentMethod = 'MPESA', phoneNumber, transactionId } = body

    // Verify payment (in production, this would call M-Pesa API)
    if (!transactionId) {
      return NextResponse.json({ error: 'Payment verification required' }, { status: 400 })
    }

    // Calculate expiry: 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Deactivate any existing active subscriptions
    await pool.query(
      `UPDATE "Subscription" SET status = 'EXPIRED' 
       WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
      [session.organizationId]
    )

    // Create new subscription
    const result = await pool.query(
      `INSERT INTO "Subscription" 
       ("organizationId", plan, status, amount, currency, paymentMethod, "transactionId", "phoneNumber", "startsAt", "expiresAt", "lastPayment", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW(), NOW())
       RETURNING *`,
      [
        session.organizationId,
        'MONTHLY',
        'ACTIVE',
        SUBSCRIPTION_AMOUNT,
        SUBSCRIPTION_CURRENCY,
        paymentMethod,
        transactionId,
        phoneNumber || null,
        expiresAt,
      ]
    )

    return NextResponse.json({
      success: true,
      subscription: result.rows[0],
      message: 'Subscription activated successfully',
      expiresAt,
    })
  } catch (error) {
    console.error('Subscription create error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}