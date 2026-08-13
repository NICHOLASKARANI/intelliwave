export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const result = await pool.query(
      `SELECT s.*, o.name as org_name
       FROM "Subscription" s
       JOIN "Organization" o ON o.id = s."organizationId"
       WHERE s."organizationId" = $1`,
      [session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ subscription: null })
    }

    const sub = result.rows[0]
    const trialEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null
    const daysLeft = trialEndsAt
      ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null

    return NextResponse.json({
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