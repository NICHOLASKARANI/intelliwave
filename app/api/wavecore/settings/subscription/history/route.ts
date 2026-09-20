export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    // All subscriptions for this org (active + expired + trial), newest first
    const result = await pool.query(
      `SELECT id, plan, status, amount, currency, "startDate", "endDate",
              "trialEndsAt", "nextBillingAt", "cancelledAt", "mpesaReceipt", "createdAt"
       FROM "Subscription"
       WHERE "organizationId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 100`,
      [orgId]
    )

    const history = result.rows.map(row => {
      const start = row.startDate ? new Date(row.startDate) : null
      const end = row.endDate ? new Date(row.endDate) : (row.trialEndsAt ? new Date(row.trialEndsAt) : null)
      const daysCovered = start && end
        ? Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        : null
      const now = Date.now()
      const isExpired = end ? end.getTime() < now : true
      const daysRemaining = end ? Math.max(0, Math.ceil((end.getTime() - now) / (1000 * 60 * 60 * 24))) : 0

      return {
        id: row.id,
        plan: row.plan,
        status: row.status,
        amount: Number(row.amount || 0),
        currency: row.currency || 'KES',
        startDate: row.startDate,
        endDate: row.endDate,
        trialEndsAt: row.trialEndsAt,
        nextBillingAt: row.nextBillingAt,
        cancelledAt: row.cancelledAt,
        mpesaReceipt: row.mpesaReceipt,
        createdAt: row.createdAt,
        daysCovered,
        daysRemaining,
        isExpired,
      }
    })

    // Aggregate stats
    const paidHistory = history.filter(h => h.status === 'ACTIVE' || h.status === 'EXPIRED')
    const totalPaid = paidHistory.reduce((s, h) => s + h.amount, 0)
    const paymentCount = paidHistory.filter(h => h.mpesaReceipt).length

    const activeSub = history.find(h => h.status === 'ACTIVE' && !h.isExpired)
    const trialSub = history.find(h => h.status === 'TRIAL' && !h.isExpired)

    const summary = {
      hasActive: !!activeSub,
      hasTrial: !!trialSub,
      currentPlan: activeSub?.plan || trialSub?.plan || null,
      currentStatus: activeSub ? 'ACTIVE' : trialSub ? 'TRIAL' : history[0]?.status || 'NONE',
      currentAmount: activeSub?.amount || trialSub?.amount || 500,
      currentCurrency: activeSub?.currency || trialSub?.currency || 'KES',
      expiresAt: activeSub?.endDate || trialSub?.trialEndsAt || null,
      daysRemaining: activeSub?.daysRemaining || trialSub?.daysRemaining || 0,
      lastMpesaReceipt: activeSub?.mpesaReceipt || null,
      nextBillingAt: activeSub?.nextBillingAt || null,
      totalPaid: Math.round(totalPaid),
      paymentCount,
      historyCount: history.length,
    }

    return NextResponse.json({ history, summary })
  } catch (error) {
    console.error('Subscription history error:', error)
    return NextResponse.json({ history: [], summary: {}, error: 'Failed to load subscription history' }, { status: 500 })
  }
}