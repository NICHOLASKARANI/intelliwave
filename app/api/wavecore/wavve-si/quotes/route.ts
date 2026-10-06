export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/wavve-si/quotes
 *
 * Real market data only. No signals, no random numbers, no placeholders.
 *
 * Primary source: Deriv public WebSocket (wss://ws.derivws.com/websockets/v3?app_id=1089)
 *   — no API key required, provides live bid/ask for FX + indices + crypto
 *   — we open, request ticks for N symbols, close after snapshot or timeout
 * Fallback: exchangerate.host (free, no key, hourly) for FX pairs
 * If both fail for a symbol, we return null — never a fake price.
 *
 * Read-only, tenant-scoped, cached 5s server-side.
 */

// Deriv uses internal symbol codes that map to our display pairs.
const DERIV_SYMBOL_MAP: Record<string, string> = {
  'EUR/USD': 'frxEURUSD',
  'GBP/USD': 'frxGBPUSD',
  'USD/JPY': 'frxUSDJPY',
  'USD/CHF': 'frxUSDCHF',
  'AUD/USD': 'frxAUDUSD',
  'USD/CAD': 'frxUSDCAD',
  'NZD/USD': 'frxNZDUSD',
  'EUR/GBP': 'frxEURGBP',
  'EUR/JPY': 'frxEURJPY',
  'GBP/JPY': 'frxGBPJPY',
  // Gold + crypto + indices on Deriv synthetic/CFD feeds
  'XAU/USD': 'frxXAUUSD',
  'XAG/USD': 'frxXAGUSD',
  'BTC/USD': 'cryBTCUSD',
  'ETH/USD': 'cryETHUSD',
}

// Pairs we always attempt to return. African FX get exchangerate.host only.
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
  source: 'DERIV' | 'EXCHANGERATE_HOST' | 'UNAVAILABLE'
  updatedAt: string
}

// ---- 5s in-memory cache ----
let _cache: { at: number; data: Quote[] } | null = null
const CACHE_MS = 5000

async function fetchFromDeriv(symbols: string[]): Promise<Record<string, number>> {
  // Deriv public demo app_id (1089) supports market data without authentication.
  // We open a short-lived socket, subscribe to ticks for each symbol, collect the
  // first tick per symbol, then close. Bounded by a 3500ms timeout so the request
  // never hangs a serverless invocation.
  return await new Promise((resolve) => {
    const result: Record<string, number> = {}
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      try { ws.close() } catch {}
      resolve(result)
    }

    // Node ws (available in Next runtime). We avoid dynamic imports at request time
    // by lazily requiring — if 'ws' isn't installed we fall through to fallback.
    let ws: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const WS = require('ws')
      ws = new WS('wss://ws.derivws.com/websockets/v3?app_id=1089')
    } catch {
      return resolve({})
    }

    const timer = setTimeout(finish, 3500)

    ws.on('open', () => {
      for (const symbol of symbols) {
        ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }))
      }
    })

    ws.on('message', (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.msg_type === 'tick' && msg.tick && typeof msg.tick.quote === 'number') {
          const sym = msg.tick.symbol
          if (!(sym in result)) result[sym] = msg.tick.quote
          if (Object.keys(result).length >= symbols.length) {
            clearTimeout(timer)
            finish()
          }
        }
      } catch {}
    })

    ws.on('error', () => { clearTimeout(timer); finish() })
    ws.on('close', () => { clearTimeout(timer); finish() })
  })
}

async function fetchFromExchangeRateHost(pairs: string[]): Promise<Record<string, number>> {
  // exchangerate.host — free, no key. Supports base/quote per call, but does not
  // support arbitrary African crosses cleanly. We fetch per unique base currency.
  const byBase: Record<string, string[]> = {}
  for (const p of pairs) {
    const [b, q] = p.split('/')
    if (!b || !q) continue
    if (!byBase[b]) byBase[b] = []
    byBase[b].push(q)
  }

  const out: Record<string, number> = {}
  await Promise.all(Object.keys(byBase).map(async (base) => {
    try {
      const res = await fetch('https://api.exchangerate.host/latest?base=' + base, { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      if (!json || !json.rates) return
      for (const quote of byBase[base]) {
        const rate = json.rates[quote]
        if (typeof rate === 'number' && rate > 0) out[base + '/' + quote] = rate
      }
    } catch {}
  }))
  return out
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Serve from cache when fresh
    if (_cache && Date.now() - _cache.at < CACHE_MS) {
      return NextResponse.json({
        quotes: _cache.data,
        cached: true,
        cacheAgeMs: Date.now() - _cache.at,
        asOf: new Date(_cache.at).toISOString(),
      })
    }

    const started = Date.now()

    // ---- Deriv first (real-time) ----
    const derivSymbols = FX_PAIRS.concat(EXTRA_SYMBOLS)
      .map(p => DERIV_SYMBOL_MAP[p])
      .filter(Boolean)

    const derivResult = await fetchFromDeriv(derivSymbols)
    const now = new Date().toISOString()

    const derivByPair: Record<string, number> = {}
    for (const [pair, sym] of Object.entries(DERIV_SYMBOL_MAP)) {
      if (derivResult[sym] != null) derivByPair[pair] = derivResult[sym]
    }

    // ---- Fallback via exchangerate.host for anything Deriv missed ----
    const missing = ALL_SYMBOLS.filter(s => derivByPair[s] == null)
    let fxFallback: Record<string, number> = {}
    if (missing.length > 0) {
      fxFallback = await fetchFromExchangeRateHost(missing.filter(p => !p.startsWith('XAU') && !p.startsWith('XAG') && !p.startsWith('BTC') && !p.startsWith('ETH')))
    }

    const quotes: Quote[] = ALL_SYMBOLS.map(pair => {
      if (derivByPair[pair] != null) {
        return { pair, last: derivByPair[pair], bid: derivByPair[pair], ask: derivByPair[pair], source: 'DERIV' as const, updatedAt: now }
      }
      if (fxFallback[pair] != null) {
        return { pair, last: fxFallback[pair], bid: fxFallback[pair], ask: fxFallback[pair], source: 'EXCHANGERATE_HOST' as const, updatedAt: now }
      }
      return { pair, last: null, bid: null, ask: null, source: 'UNAVAILABLE' as const, updatedAt: now }
    })

    _cache = { at: Date.now(), data: quotes }

    const live = quotes.filter(q => q.source === 'DERIV').length
    const fallback = quotes.filter(q => q.source === 'EXCHANGERATE_HOST').length
    const unavailable = quotes.filter(q => q.source === 'UNAVAILABLE').length

    return NextResponse.json({
      quotes,
      summary: {
        total: quotes.length,
        live,
        fallback,
        unavailable,
        serverLatencyMs: Date.now() - started,
      },
      cached: false,
      asOf: now,
    })
  } catch (error) {
    console.error('[wavve-si/quotes]', error)
    return NextResponse.json({ quotes: [], summary: {}, error: 'Failed to load quotes' }, { status: 500 })
  }
}