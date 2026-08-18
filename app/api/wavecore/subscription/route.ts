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
    const endDate = sub.endDate || sub.trialEndsAt
    const isActive = sub.status === 'ACTIVE' && new Date(endDate) > new Date()

    return NextResponse.json({
      subscribed: isActive,
      amount: sub.amount || SUBSCRIPTION_AMOUNT,
      currency: sub.currency || SUBSCRIPTION_CURRENCY,
      plan: sub.plan,
      status: sub.status,
      startedAt: sub.startDate,
      expiresAt: endDate,
      trialEndsAt: sub.trialEndsAt,
      nextBillingAt: sub.nextBillingAt,
      paymentMethod: 'MPESA',
      lastPayment: sub.updatedAt,
      mpesaReceipt: sub.mpesaReceipt,
      daysRemaining: isActive ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
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
    const { paymentMethod = 'MPESA', phoneNumber, mpesaReceipt } = body

    // Verify payment (in production, this would call M-Pesa API)
    if (!mpesaReceipt) {
      return NextResponse.json({ error: 'M-Pesa receipt required' }, { status: 400 })
    }

    // Calculate dates
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30) // 30 days
    const nextBillingAt = new Date(endDate)

    // Deactivate any existing active subscriptions
    await pool.query(
      `UPDATE "Subscription" SET status = 'EXPIRED' 
       WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
      [session.organizationId]
    )

    // Create new subscription
    const result = await pool.query(
      `INSERT INTO "Subscription" 
       ("organizationId", "userId", plan, status, amount, currency, "startDate", "endDate", "nextBillingAt", "mpesaReceipt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        session.organizationId,
        session.userId,
        'MONTHLY',
        'ACTIVE',
        SUBSCRIPTION_AMOUNT,
        SUBSCRIPTION_CURRENCY,
        endDate,
        nextBillingAt,
        mpesaReceipt,
      ]
    )

    return NextResponse.json({
      success: true,
      subscription: result.rows[0],
      message: 'Subscription activated successfully',
      expiresAt: endDate,
    })
  } catch (error) {
    console.error('Subscription create error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}