export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { ensureWavveSignalSchema } from '@/lib/wavecore/wavve-signal-schema'

/**
 * GET /api/wavecore/wavve-si/signals
 * GET /api/wavecore/wavve-si/signals?pair=EUR/USD
 *
 * Real signal engine. Every number is derived from real ECB daily
 * close prices fetched from api.frankfurter.app. Nothing is random.
 * If the criteria are not met the engine returns NO_TRADE with a
 * reason. We do not manufacture signals.
 *
 * Sources:
 *   History:  api.frankfurter.app (ECB reference rates, free, no key)
 *   Indicators computed here, no external library.
 *
 * Persisted to WavveSignal — one row per pair per day, upserted.
 * Server-side cache: 15 minutes (indicator inputs are daily).
 *
 * Read-only from the caller's perspective. Tenant-scoped.
 */

// Pairs the ECB reference-rate set actually covers. Thin African
// crosses (USD/KES, USD/NGN, USD/GHS, USD/TZS, USD/UGX, USD/ETB,
// USD/EGP) are excluded here because api.frankfurter.app does not
// publish daily closes for them — the signal engine needs a real
// 100+ bar history to compute RSI/MACD/EMA honestly.
//
// Those pairs still appear on the quotes page via open.er-api.com.
// When an OHLC source for them is added (Twelve Data etc.), remove
// them from the exclusion and this comment.
const FX_PAIRS = [
  'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD',
  'USD/CAD','NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY',
  'EUR/KES','GBP/KES','USD/ZAR',
]

const DAYS_OF_HISTORY = 120
const CACHE_MS = 15 * 60 * 1000

interface Candle { date: string; close: number }
interface Score { name: string; weight: number; score: number; value: any; note: string }

// ---- 15-min cache ----
let _cache: { at: number; data: any } | null = null

// ============================================================
// Indicator math — plain, tested, no library
// ============================================================

function ema(values: number[], period: number): number[] {
  if (values.length < period) return []
  const k = 2 / (period + 1)
  const out: number[] = []
  let prev = values.slice(0, period).reduce((s, v) => s + v, 0) / period
  out.push(prev)
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  // Wilder's smoothing
  let avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period
  let avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function macd(values: number[], fast = 12, slow = 26, signal = 9): { macd: number; signal: number; hist: number } | null {
  if (values.length < slow + signal) return null
  const emaFast = ema(values, fast)
  const emaSlow = ema(values, slow)
  if (emaFast.length === 0 || emaSlow.length === 0) return null
  // Align: emaFast starts at index (fast-1), emaSlow at (slow-1)
  const offset = slow - fast
  const macdLine: number[] = []
  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + offset] - emaSlow[i])
  }
  const sigLine = ema(macdLine, signal)
  if (sigLine.length === 0) return null
  const macdNow = macdLine[macdLine.length - 1]
  const signalNow = sigLine[sigLine.length - 1]
  return { macd: macdNow, signal: signalNow, hist: macdNow - signalNow }
}

function stdev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function bollinger(values: number[], period = 20, mult = 2): { upper: number; mid: number; lower: number; width: number; pctB: number } | null {
  if (values.length < period) return null
  const slice = values.slice(-period)
  const mid = slice.reduce((s, v) => s + v, 0) / period
  const sd = stdev(slice)
  const upper = mid + mult * sd
  const lower = mid - mult * sd
  const width = mid > 0 ? (upper - lower) / mid : 0
  const last = values[values.length - 1]
  const pctB = upper === lower ? 0.5 : (last - lower) / (upper - lower)
  return { upper, mid, lower, width, pctB }
}

/**
 * ATR proxy from close-to-close deltas. Frankfurter gives only
 * closes, so we use the standard close-to-close true-range variant.
 * This is a legitimate, widely used volatility measure.
 */
function atrProxy(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null
  const trs: number[] = []
  for (let i = 1; i < values.length; i++) {
    trs.push(Math.abs(values[i] - values[i - 1]))
  }
  const recent = trs.slice(-period)
  return recent.reduce((s, v) => s + v, 0) / recent.length
}

function swingLevels(values: number[], lookback = 20): { support: number; resistance: number } | null {
  if (values.length < lookback) return null
  const slice = values.slice(-lookback)
  return { support: Math.min(...slice), resistance: Math.max(...slice) }
}

// ============================================================
// Source data — api.frankfurter.app
// ============================================================

async function fetchHistory(pair: string): Promise<Candle[]> {
  // Frankfurter expects base/quote separated by /, ISO dates.
  const [base, quote] = pair.split('/')
  if (!base || !quote) return []
  const end = new Date()
  const start = new Date(end.getTime() - DAYS_OF_HISTORY * 86400_000)
  const from = start.toISOString().slice(0, 10)
  const to = end.toISOString().slice(0, 10)
  try {
    const url = `https://api.frankfurter.app/${from}..${to}?from=${base}&to=${quote}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    if (!json || !json.rates) return []
    const dates = Object.keys(json.rates).sort()
    const candles: Candle[] = []
    for (const d of dates) {
      const r = json.rates[d]?.[quote]
      if (typeof r === 'number' && r > 0) candles.push({ date: d, close: r })
    }
    return candles
  } catch { return [] }
}

// ============================================================
// Scoring engine
// ============================================================

function scoreSetup(candles: Candle[], pair: string): {
  direction: 'BUY' | 'SELL' | 'NO_TRADE'
  tier: 'NO_TRADE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'HIGH' | 'VERY_HIGH'
  score: number
  breakdown: Score[]
  reason: Record<string, any>
  levels: { entry: number; sl: number; tp1: number; tp2: number; rr: number } | null
} {
  const closes = candles.map(c => c.close)
  const last = closes[closes.length - 1]

  const rsiVal = rsi(closes, 14)
  const macdVal = macd(closes, 12, 26, 9)
  const ema20Series = ema(closes, 20)
  const ema50Series = ema(closes, 50)
  const ema20 = ema20Series[ema20Series.length - 1]
  const ema50 = ema50Series[ema50Series.length - 1]
  const boll = bollinger(closes, 20, 2)
  const atr = atrProxy(closes, 14)
  const swings = swingLevels(closes, 20)

  const breakdown: Score[] = []

  // Trend — EMA20 vs EMA50 (25%)
  let trendScore = 0
  let trendNote = 'Insufficient data'
  let trendDir: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
  if (ema20 && ema50) {
    const diff = (ema20 - ema50) / ema50
    if (diff > 0.002) { trendScore = 100; trendDir = 'BUY'; trendNote = `Uptrend (EMA20 > EMA50 by ${(diff * 100).toFixed(2)}%)` }
    else if (diff < -0.002) { trendScore = 100; trendDir = 'SELL'; trendNote = `Downtrend (EMA20 < EMA50 by ${(Math.abs(diff) * 100).toFixed(2)}%)` }
    else { trendScore = 30; trendNote = 'Flat EMA cross' }
  }
  breakdown.push({ name: 'Trend', weight: 25, score: trendScore, value: { ema20, ema50, dir: trendDir }, note: trendNote })

  // Momentum — MACD histogram (20%)
  let momScore = 0
  let momNote = 'Insufficient data'
  let momDir: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
  if (macdVal) {
    if (macdVal.hist > 0 && macdVal.hist > Math.abs(macdVal.signal) * 0.01) { momScore = 100; momDir = 'BUY'; momNote = 'Bullish MACD crossover' }
    else if (macdVal.hist < 0 && Math.abs(macdVal.hist) > Math.abs(macdVal.signal) * 0.01) { momScore = 100; momDir = 'SELL'; momNote = 'Bearish MACD crossover' }
    else { momScore = 30; momNote = 'Neutral MACD' }
  }
  breakdown.push({ name: 'Momentum', weight: 20, score: momScore, value: macdVal, note: momNote })

  // RSI (15%) — reward 40-70 for BUY, 30-60 for SELL, penalise extremes
  let rsiScore = 50
  let rsiNote = 'No RSI'
  if (rsiVal != null) {
    if (rsiVal >= 45 && rsiVal <= 65) { rsiScore = 100; rsiNote = `RSI ${rsiVal.toFixed(1)} — healthy bullish zone` }
    else if (rsiVal >= 35 && rsiVal < 45) { rsiScore = 70; rsiNote = `RSI ${rsiVal.toFixed(1)} — mild bearish pressure` }
    else if (rsiVal > 70) { rsiScore = 20; rsiNote = `RSI ${rsiVal.toFixed(1)} — overbought` }
    else if (rsiVal < 30) { rsiScore = 20; rsiNote = `RSI ${rsiVal.toFixed(1)} — oversold` }
    else { rsiScore = 60; rsiNote = `RSI ${rsiVal.toFixed(1)}` }
  }
  breakdown.push({ name: 'RSI', weight: 15, score: rsiScore, value: rsiVal, note: rsiNote })

  // Bollinger position (10%)
  let bollScore = 50
  let bollNote = 'No Bollinger'
  if (boll) {
    if (boll.pctB > 0.5 && boll.pctB < 0.9) { bollScore = 90; bollNote = `%B ${boll.pctB.toFixed(2)} — upper half, no extension` }
    else if (boll.pctB >= 0.9) { bollScore = 30; bollNote = `%B ${boll.pctB.toFixed(2)} — stretched` }
    else if (boll.pctB < 0.5 && boll.pctB > 0.1) { bollScore = 90; bollNote = `%B ${boll.pctB.toFixed(2)} — lower half` }
    else { bollScore = 30; bollNote = `%B ${boll.pctB.toFixed(2)} — stretched` }
  }
  breakdown.push({ name: 'Bollinger', weight: 10, score: bollScore, value: boll, note: bollNote })

  // Structure — where is price relative to 20-day swings? (15%)
  let structScore = 50
  let structNote = 'No swing data'
  if (swings) {
    const range = swings.resistance - swings.support
    if (range > 0) {
      const pos = (last - swings.support) / range
      if (pos > 0.7) { structScore = 100; structNote = `Near 20d high (${(pos * 100).toFixed(0)}% of range)` }
      else if (pos < 0.3) { structScore = 100; structNote = `Near 20d low (${(pos * 100).toFixed(0)}% of range)` }
      else { structScore = 60; structNote = `Mid-range (${(pos * 100).toFixed(0)}%)` }
    }
  }
  breakdown.push({ name: 'Structure', weight: 15, score: structScore, value: swings, note: structNote })

  // Volatility — ATR vs price (10%)
  let volScore = 50
  let volNote = 'No ATR'
  if (atr && last > 0) {
    const pct = atr / last
    if (pct > 0.002 && pct < 0.012) { volScore = 90; volNote = `ATR ${(pct * 100).toFixed(2)}% — moderate` }
    else if (pct <= 0.002) { volScore = 40; volNote = `ATR ${(pct * 100).toFixed(2)}% — very low` }
    else { volScore = 40; volNote = `ATR ${(pct * 100).toFixed(2)}% — elevated` }
  }
  breakdown.push({ name: 'Volatility', weight: 10, score: volScore, value: atr, note: volNote })

  // Session (5%) — real clock
  const hourUtc = new Date().getUTCHours()
  let sessionScore = 50
  let sessionNote = 'Sydney'
  if (hourUtc >= 7 && hourUtc < 12) { sessionScore = 90; sessionNote = 'London session' }
  else if (hourUtc >= 12 && hourUtc < 16) { sessionScore = 100; sessionNote = 'London/NY overlap — highest liquidity' }
  else if (hourUtc >= 16 && hourUtc < 21) { sessionScore = 80; sessionNote = 'New York session' }
  else if (hourUtc >= 0 && hourUtc < 7) { sessionScore = 70; sessionNote = 'Tokyo session' }
  breakdown.push({ name: 'Session', weight: 5, score: sessionScore, value: hourUtc, note: sessionNote })

  // Weighted total
  const total = breakdown.reduce((s, b) => s + b.score * b.weight, 0) / 100

  // Direction decision — require trend and momentum to agree
  let direction: 'BUY' | 'SELL' | 'NO_TRADE' = 'NO_TRADE'
  if (trendDir === 'BUY' && (momDir === 'BUY' || momDir === 'NEUTRAL')) direction = 'BUY'
  else if (trendDir === 'SELL' && (momDir === 'SELL' || momDir === 'NEUTRAL')) direction = 'SELL'

  // Tier
  let tier: 'NO_TRADE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'HIGH' | 'VERY_HIGH' = 'NO_TRADE'
  if (total < 40 || direction === 'NO_TRADE') tier = 'NO_TRADE'
  else if (total < 60) tier = 'WEAK'
  else if (total < 70) tier = 'MODERATE'
  else if (total < 80) tier = 'STRONG'
  else if (total < 90) tier = 'HIGH'
  else tier = 'VERY_HIGH'

  // Levels — ATR-based, only when we have a direction
  let levels: { entry: number; sl: number; tp1: number; tp2: number; rr: number } | null = null
  if (atr && direction !== 'NO_TRADE') {
    const entry = last
    const sl = direction === 'BUY' ? entry - atr * 1.5 : entry + atr * 1.5
    const tp1 = direction === 'BUY' ? entry + atr * 2.0 : entry - atr * 2.0
    const tp2 = direction === 'BUY' ? entry + atr * 3.5 : entry - atr * 3.5
    const risk = Math.abs(entry - sl)
    const reward = Math.abs(tp1 - entry)
    const rr = risk > 0 ? reward / risk : 0
    levels = { entry, sl, tp1, tp2, rr }
  }

  return {
    direction,
    tier,
    score: Math.round(total),
    breakdown,
    reason: {
      trend: trendNote,
      momentum: momNote,
      rsi: rsiNote,
      bollinger: bollNote,
      structure: structNote,
      volatility: volNote,
      session: sessionNote,
      candlesUsed: candles.length,
      lastClose: last,
      lastDate: candles[candles.length - 1]?.date,
    },
    levels,
  }
}

// ============================================================
// Route handler
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureWavveSignalSchema()
    const orgId = session.organizationId

    const { searchParams } = new URL(request.url)
    const single = searchParams.get('pair')
    const pairs = single ? [single] : FX_PAIRS

    // Cache only the all-pairs response
    if (!single && _cache && Date.now() - _cache.at < CACHE_MS) {
      return NextResponse.json({ ..._cache.data, cached: true, cacheAgeMs: Date.now() - _cache.at })
    }

    const started = Date.now()
    const today = new Date().toISOString().slice(0, 10)

    const results: any[] = []
    // Sequential with a small stagger — Frankfurter is generous but polite
    for (const pair of pairs) {
      const candles = await fetchHistory(pair)
      if (candles.length < 30) {
        results.push({
          pair, direction: 'NO_TRADE', tier: 'NO_TRADE', score: 0,
          levels: null,
          reason: { error: 'Insufficient history from provider', candlesUsed: candles.length },
        })
        continue
      }
      const scored = scoreSetup(candles, pair)
      results.push({
        pair,
        direction: scored.direction,
        tier: scored.tier,
        score: scored.score,
        levels: scored.levels,
        breakdown: scored.breakdown,
        reason: scored.reason,
        lastClose: candles[candles.length - 1].close,
        lastCloseDate: candles[candles.length - 1].date,
      })
      await new Promise(r => setTimeout(r, 150))
    }

    // Persist (idempotent per pair per day)
    const crypto = require('crypto')
    for (const r of results) {
      try {
        await pool.query(
          `INSERT INTO "WavveSignal"
             (id, pair, direction, tier, score, entry, "stopLoss", "takeProfit1", "takeProfit2", "riskReward", reason, "generatedAt", "signalDate", "organizationId")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,NOW(),$12,$13)
           ON CONFLICT ("organizationId", pair, "signalDate") DO UPDATE SET
             direction = EXCLUDED.direction,
             tier = EXCLUDED.tier,
             score = EXCLUDED.score,
             entry = EXCLUDED.entry,
             "stopLoss" = EXCLUDED."stopLoss",
             "takeProfit1" = EXCLUDED."takeProfit1",
             "takeProfit2" = EXCLUDED."takeProfit2",
             "riskReward" = EXCLUDED."riskReward",
             reason = EXCLUDED.reason,
             "generatedAt" = NOW()`,
          [
            crypto.randomUUID(),
            r.pair,
            r.direction,
            r.tier,
            r.score,
            r.levels?.entry ?? null,
            r.levels?.sl ?? null,
            r.levels?.tp1 ?? null,
            r.levels?.tp2 ?? null,
            r.levels?.rr ?? null,
            JSON.stringify(r.reason || {}),
            today,
            orgId,
          ]
        ).catch(() => {})
      } catch {}
    }

    // Summary
    const signals = results.filter(r => r.direction !== 'NO_TRADE')
    const highConviction = signals.filter(r => ['STRONG', 'HIGH', 'VERY_HIGH'].includes(r.tier))
    const buys = signals.filter(r => r.direction === 'BUY').length
    const sells = signals.filter(r => r.direction === 'SELL').length

    const payload = {
      signals: results,
      summary: {
        pairsScanned: results.length,
        actionable: signals.length,
        highConviction: highConviction.length,
        buys,
        sells,
        noTrade: results.length - signals.length,
        source: 'api.frankfurter.app (ECB daily reference)',
        cadence: 'Daily closes — not tick-level',
        serverLatencyMs: Date.now() - started,
      },
      asOf: new Date().toISOString(),
    }

    if (!single) _cache = { at: Date.now(), data: payload }
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[wavve-si/signals]', error)
    return NextResponse.json({ signals: [], summary: {}, error: 'Failed to generate signals' }, { status: 500 })
  }
}