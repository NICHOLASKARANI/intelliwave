import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { getSession } from '@/lib/wavecore/auth'

const SUBSCRIPTION_AMOUNT = 500
const SUBSCRIPTION_CURRENCY = 'KES'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Subscription"
       WHERE "organizationId" = $1 AND status = 'ACTIVE' AND "endDate" > NOW()
       ORDER BY "createdAt" DESC LIMIT 1`,
      [session!.organizationId]
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

    return NextResponse.json({
      subscribed: true,
      amount: sub.amount || SUBSCRIPTION_AMOUNT,
      currency: sub.currency || SUBSCRIPTION_CURRENCY,
      plan: sub.plan,
      status: sub.status,
      startedAt: sub.startDate,
      expiresAt: endDate,
      daysRemaining: Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      mpesaReceipt: sub.mpesaReceipt,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { phoneNumber, mpesaReceipt } = body

    if (!mpesaReceipt) {
      return NextResponse.json({ error: 'M-Pesa receipt number required' }, { status: 400 })
    }

    // Check if receipt already used
    const existingReceipt = await pool.query(
      `SELECT id FROM "Subscription" WHERE "mpesaReceipt" = $1`,
      [mpesaReceipt]
    )

    if (existingReceipt.rows.length > 0) {
      return NextResponse.json({ error: 'This receipt number has already been used' }, { status: 400 })
    }

    // Calculate dates
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)
    const nextBillingAt = new Date(endDate)

    // Deactivate existing subscriptions
    await pool.query(
      `UPDATE "Subscription" SET status = 'EXPIRED' WHERE "organizationId" = $1 AND status = 'ACTIVE'`,
      [session!.organizationId]
    )

    // Create subscription
    const result = await pool.query(
      `INSERT INTO "Subscription" 
       ("organizationId", "userId", plan, status, amount, currency, "startDate", "endDate", "nextBillingAt", "mpesaReceipt", "createdAt", "updatedAt")
       VALUES ($1, $2, 'MONTHLY', 'ACTIVE', $3, $4, NOW(), $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [session!.organizationId, session!.userId, SUBSCRIPTION_AMOUNT, SUBSCRIPTION_CURRENCY, endDate, nextBillingAt, mpesaReceipt]
    )

    return NextResponse.json({
      success: true,
      subscription: result.rows[0],
      message: 'Subscription activated successfully for 30 days',
      expiresAt: endDate,
    })
  } catch (error) {
    console.error('Subscription create error:', error)
    return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
  }
}