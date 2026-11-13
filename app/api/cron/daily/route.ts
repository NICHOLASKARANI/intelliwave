export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'

/**
 * Daily cron orchestrator — runs once per day at 00:00 UTC.
 *
 * Vercel Hobby limits to 1 cron per project (or 2, depending on plan tier).
 * This endpoint internally calls all daily jobs:
 *   - Price alerts (every day)
 *   - Subscription renewal reminders (every day)
 *   - Monthly payouts (only on 1st of month)
 *
 * All sub-jobs require CRON_SECRET auth (same header).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.intelliwavve.com'
  const results: Record<string, any> = {}
  const errors: Record<string, string> = {}

  // ─── Job 1: Price alerts ───
  try {
    const res = await fetch(`${baseUrl}/api/cron/price-alerts`, {
      method: 'GET',
      headers: { Authorization: expected },
      cache: 'no-store',
    })
    const data = await res.json()
    results.priceAlerts = { ok: res.ok, ...data }
  } catch (e: any) {
    console.error('[cron/daily] price-alerts failed:', e?.message)
    errors.priceAlerts = e?.message || 'unknown'
  }

  // ─── Job 2: Subscription renewal reminders ───
  try {
    const res = await fetch(`${baseUrl}/api/cron/subscription-renewal-reminders`, {
      method: 'GET',
      headers: { Authorization: expected },
      cache: 'no-store',
    })
    const data = await res.json()
    results.renewalReminders = { ok: res.ok, ...data }
  } catch (e: any) {
    console.error('[cron/daily] renewal-reminders failed:', e?.message)
    errors.renewalReminders = e?.message || 'unknown'
  }

  // ─── Job 3: Monthly payouts (only on 1st of month) ───
  const isFirstOfMonth = new Date().getUTCDate() === 1
  if (isFirstOfMonth) {
    try {
      const res = await fetch(`${baseUrl}/api/cron/monthly-payouts`, {
        method: 'GET',
        headers: { Authorization: expected },
        cache: 'no-store',
      })
      const data = await res.json()
      results.monthlyPayouts = { ok: res.ok, ...data }
    } catch (e: any) {
      console.error('[cron/daily] monthly-payouts failed:', e?.message)
      errors.monthlyPayouts = e?.message || 'unknown'
    }
  } else {
    results.monthlyPayouts = { skipped: true, reason: 'Not 1st of month' }
  }

  const duration = Date.now() - startTime
  const hasErrors = Object.keys(errors).length > 0

  return NextResponse.json({
    success: !hasErrors,
    results,
    errors: hasErrors ? errors : undefined,
    durationMs: duration,
    timestamp: new Date().toISOString(),
  }, { status: hasErrors ? 500 : 200 })
}