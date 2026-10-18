export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the most recent subscription for this org
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
        subscription: null,
        subscribed: false,
        isTrialActive: false,
        daysLeft: null,
      })
    }

    const sub = result.rows[0]
    const trialEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null
    const endDate = sub.endDate ? new Date(sub.endDate) : null
    const now = Date.now()

    const daysLeft = trialEndsAt
      ? Math.ceil((trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000))
      : null

    const isActive = ['ACTIVE', 'TRIAL'].includes(sub.status)
    const isExpired = (endDate && endDate.getTime() < now) || (trialEndsAt && trialEndsAt.getTime() < now && sub.status === 'TRIAL')

    // Consider "subscribed" = has a paid/active plan that's not expired
    const subscribed = isActive && !isExpired && sub.status === 'ACTIVE' && !!sub.mpesaReceipt

    return NextResponse.json({
      // Top-level for easy access by UI
      subscribed,
      isTrialActive: sub.status === 'TRIAL' && daysLeft !== null && daysLeft > 0,
      daysLeft,
      plan: sub.plan,
      status: sub.status,
      amount: sub.amount,
      currency: sub.currency,
      endDate: sub.endDate,
      mpesaReceipt: sub.mpesaReceipt,
      orgName: sub.org_name,

      // Full object preserved
      subscription: {
        ...sub,
        daysLeft,
        isTrialActive: sub.status === 'TRIAL' && daysLeft !== null && daysLeft > 0,
        nextBillingAmount: sub.amount || 500,
      },
    })
  } catch (error) {
    console.error('Subscription GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}