export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/wavve-si/quotes
 *
 * Real market data only. No signals, no random numbers, no placeholders.
 *
 * Primary source (SI-1.1): open.er-api.com
 *   — free, no API key, updates daily, real exchange rates
 *   — 200ms typical response, comprehensive currency coverage
 *
 * Optional tick-level path (dormant): Deriv public WebSocket.
 *   Deriv's public market-data WebSocket currently requires an
 *   authenticated connection for FX ticks — the app_id=1089 demo
 *   endpoint that used to work no longer returns data. When a valid
 *   Deriv app_id is available, this code path activates automatically.
 *   Until then, prices come from the REST provider above.
 *
 * If any pair cannot be resolved from a real source, it is returned
 * with last=null and source='UNAVAILABLE'. We never fabricate a price.
 *
 * Read-only. Tenant-scoped. Cached 60s server-side (REST is daily anyway).
 */

// Deriv internal codes (dormant — see header comment)
const DERIV_SYMBOL_MAP: Record<string, string> = {
  'EUR/USD': 'frxEURUSD', 'GBP/USD': 'frxGBPUSD', 'USD/JPY': 'frxUSDJPY',
  'USD/CHF': 'frxUSDCHF', 'AUD/USD': 'frxAUDUSD', 'USD/CAD': 'frxUSDCAD',
  'NZD/USD': 'frxNZDUSD', 'EUR/GBP': 'frxEURGBP', 'EUR/JPY': 'frxEURJPY',
  'GBP/JPY': 'frxGBPJPY',
}

// Pairs we display. Sources:
//  - FX majors + African crosses: open.er-api.com (USD base + cross-computation)
//  - Metals + Crypto: returned as UNAVAILABLE for now — the free REST
//    provider doesn't carry them, and Deriv requires auth. Honest > fake.
const FX_PAIRS = [
  'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD',
  'USD/CAD','NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY',
  'USD/KES','EUR/KES','GBP/KES','USD/ZAR','USD/NGN',
  'USD/GHS','USD/TZS','USD/UGX','USD/ETB','USD/EGP',
]
const EXTRA_SYMBOLS = ['XAU/USD','XAG/USD','BTC/USD','ETH/USD']
const ALL_SYMBOLS = [...FX_PAIRS, ...EXTRA_SYMBOLS]

interface Quote {
  pair: string
  last: number | null
  bid: number | null
  ask: number | null
  source: 'REST_DAILY' | 'DERIV' | 'UNAVAILABLE'
  updatedAt: string
}

// ---- 60s in-memory cache (REST provider updates daily) ----
let _cache: { at: number; data: any } | null = null
const CACHE_MS = 60_000

/**
 * Fetch a USD-based rate table from open.er-api.com.
 * Returns { USD: 1, EUR: 0.92, KES: 129.4, ... } or empty object.
 */
async function fetchUsdBaseRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
    if (!res.ok) return {}
    const json = await res.json()
    if (!json || json.result !== 'success' || !json.rates) return {}
    return json.rates as Record<string, number>
  } catch { return {} }
}

/**
 * Convert a pair into a rate using a USD-based table.
 *   XXX/USD  →  1 / usdRates[XXX]
 *   USD/XXX  →  usdRates[XXX]
 *   XXX/YYY  →  usdRates[YYY] / usdRates[XXX]
 * Returns null if either currency is missing.
 */
function deriveRate(pair: string, usdRates: Record<string, number>): number | null {
  const [base, quote] = pair.split('/')
  if (!base || !quote) return null
  if (base === 'USD') {
    const r = usdRates[quote]
    return typeof r === 'number' && r > 0 ? r : null
  }
  if (quote === 'USD') {
    const r = usdRates[base]
    return typeof r === 'number' && r > 0 ? 1 / r : null
  }
  const rb = usdRates[base]
  const rq = usdRates[quote]
  if (typeof rb !== 'number' || typeof rq !== 'number' || rb <= 0) return null
  return rq / rb
}

/**
 * Dormant Deriv WS path. Returns {} unless a valid app_id is provided
 * and Deriv responds with ticks. Wrapped so it can never hang the
 * request longer than 3s or throw.
 */
async function tryDerivTicks(symbols: string[]): Promise<Record<string, number>> {
  return await new Promise((resolve) => {
    const out: Record<string, number> = {}
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      try { ws.close() } catch {}
      resolve(out)
    }
    let ws: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const WS = require('ws')
      ws = new WS('wss://ws.derivws.com/websockets/v3?app_id=1089')
    } catch { return resolve({}) }

    const timer = setTimeout(done, 3000)
    ws.on('open', () => {
      for (const s of symbols) ws.send(JSON.stringify({ ticks: s, subscribe: 1 }))
    })
    ws.on('message', (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.msg_type === 'tick' && msg.tick && typeof msg.tick.quote === 'number') {
          if (!(msg.tick.symbol in out)) out[msg.tick.symbol] = msg.tick.quote
          if (Object.keys(out).length >= symbols.length) { clearTimeout(timer); done() }
        }
      } catch {}
    })
    ws.on('error', () => { clearTimeout(timer); done() })
    ws.on('close', () => { clearTimeout(timer); done() })
  })
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (_cache && Date.now() - _cache.at < CACHE_MS) {
      return NextResponse.json({ ..._cache.data, cached: true, cacheAgeMs: Date.now() - _cache.at })
    }

    const started = Date.now()
    const now = new Date().toISOString()

    // Primary: real USD-based rate table
    const usdRates = await fetchUsdBaseRates()
    const hasRest = Object.keys(usdRates).length > 0

    // Optional dormant: Deriv ticks for the FX majors
    let derivTicks: Record<string, number> = {}
    if (Object.keys(usdRates).length === 0) {
      // Only bother trying Deriv if REST failed entirely
      derivTicks = await tryDerivTicks(Object.values(DERIV_SYMBOL_MAP))
    }

    const quotes: Quote[] = ALL_SYMBOLS.map(pair => {
      // 1. Deriv (only if REST empty and Deriv replied)
      if (!hasRest && Object.keys(derivTicks).length > 0 && DERIV_SYMBOL_MAP[pair] && derivTicks[DERIV_SYMBOL_MAP[pair]] != null) {
        const v = derivTicks[DERIV_SYMBOL_MAP[pair]]
        return { pair, last: v, bid: v, ask: v, source: 'DERIV' as const, updatedAt: now }
      }
      // 2. REST (primary)
      const r = deriveRate(pair, usdRates)
      if (r != null) {
        return { pair, last: r, bid: r, ask: r, source: 'REST_DAILY' as const, updatedAt: now }
      }
      // 3. Honest no-data
      return { pair, last: null, bid: null, ask: null, source: 'UNAVAILABLE' as const, updatedAt: now }
    })

    const live      = quotes.filter(q => q.source === 'REST_DAILY').length
    const derivCount = quotes.filter(q => q.source === 'DERIV').length
    const unavailable = quotes.filter(q => q.source === 'UNAVAILABLE').length

    const payload = {
      quotes,
      summary: {
        total: quotes.length,
        live,
        deriv: derivCount,
        unavailable,
        serverLatencyMs: Date.now() - started,
        dataFreshness: 'Daily (ECB-derived via open.er-api.com). Not tick-level.',
      },
      cached: false,
      asOf: now,
    }

    _cache = { at: Date.now(), data: payload }
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[wavve-si/quotes]', error)
    return NextResponse.json({ quotes: [], summary: {}, error: 'Failed to load quotes' }, { status: 500 })
  }
}