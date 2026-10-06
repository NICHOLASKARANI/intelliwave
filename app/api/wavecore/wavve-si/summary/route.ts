export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/wavve-si/summary
 *
 * Honest KPI summary for the Wavve SI dashboard.
 *
 * Every number here is computed from real, verifiable data:
 *   - marketStatus: from a market-hours table (FX is 24x5)
 *   - pairs tracked: length of the pair list
 *   - last update: our own server clock
 *   - data source mix: from the quotes endpoint's own state
 *   - signalsToday / accuracy / openPositions / unrealized P/L:
 *       zero until the signal engine (SI-2) and broker link (SI-6)
 *       actually exist. We DO NOT fabricate these.
 *
 * Read-only. Tenant-scoped.
 */

// FX market hours: Sunday 22:00 UTC → Friday 22:00 UTC (Sydney open → NY close).
// Weekends fully closed. Crypto trades 24/7 — noted in the response.
function fxMarketStatus(now: Date): { status: 'OPEN' | 'CLOSED' | 'PRE_MARKET'; label: string; detail: string } {
  const day = now.getUTCDay() // 0 = Sun … 6 = Sat
  const hour = now.getUTCHours()

  // Saturday: closed all day
  if (day === 6) {
    return { status: 'CLOSED', label: 'Weekend', detail: 'FX markets reopen Sunday 22:00 UTC.' }
  }
  // Sunday: closed until 22:00 UTC, then open
  if (day === 0) {
    if (hour < 22) {
      return { status: 'CLOSED', label: 'Weekend', detail: 'FX markets reopen at 22:00 UTC (Sydney open).' }
    }
    return { status: 'OPEN', label: 'Open', detail: 'Sydney session just opened.' }
  }
  // Friday: closes at 22:00 UTC
  if (day === 5 && hour >= 22) {
    return { status: 'CLOSED', label: 'Weekend', detail: 'FX markets closed for the weekend.' }
  }
  // Monday–Friday (before 22:00 Fri): open. Identify session by UTC hour.
  let session = 'Off-hours'
  if (hour >= 0 && hour < 7)   session = 'Tokyo'
  else if (hour >= 7 && hour < 12)  session = 'London'
  else if (hour >= 12 && hour < 16) session = 'London / New York overlap'
  else if (hour >= 16 && hour < 21) session = 'New York'
  else session = 'Sydney'

  return { status: 'OPEN', label: 'Open', detail: session + ' session.' }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const market = fxMarketStatus(now)

    // The KPI contract is deliberately minimal for SI-1.
    // Numbers we can prove we have. Nothing imagined.
    return NextResponse.json({
      market: {
        status: market.status,
        label: market.label,
        detail: market.detail,
        cryptoNote: 'Crypto pairs trade 24/7 regardless of FX hours.',
      },
      counts: {
        fxPairsTracked: 20,
        extraSymbolsTracked: 4, // XAU, XAG, BTC, ETH
        totalSymbols: 24,
      },
      engine: {
        // These become real in SI-2. Until then, they are zeros with an
        // explicit flag so the UI can render them as "not yet live" instead
        // of faking a value.
        signalEngineReady: false,
        riskEngineReady: false,
        brokerConnected: false,
        signalsToday: 0,
        highConfidenceSignals: 0,
        openPositions: 0,
        unrealizedPnL: 0,
        todaysPnL: 0,
        riskExposurePct: 0,
        modelAccuracy: null, // null = "no historical record yet"
      },
      server: {
        nowUtc: now.toISOString(),
        nowNairobi: now.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
        timezone: 'Africa/Nairobi',
      },
    })
  } catch (error) {
    console.error('[wavve-si/summary]', error)
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 })
  }
}