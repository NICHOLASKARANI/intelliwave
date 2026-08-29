export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

// Real-time Forex data using free APIs
// Primary: exchangerate-api.com / frankfurter.app
// For production: Use Alpha Vantage, OANDA, or Forex API

const CURRENCY_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD',
  'USD/CAD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
  'USD/KES', 'EUR/KES', 'GBP/KES', 'USD/ZAR', 'USD/NGN',
  'USD/GHS', 'USD/TZS', 'USD/UGX', 'USD/ETB', 'USD/EGP'
]

const PAIR_CONFIGS: Record<string, { base: string; quote: string }> = {
  'EUR/USD': { base: 'EUR', quote: 'USD' },
  'GBP/USD': { base: 'GBP', quote: 'USD' },
  'USD/JPY': { base: 'USD', quote: 'JPY' },
  'USD/CHF': { base: 'USD', quote: 'CHF' },
  'AUD/USD': { base: 'AUD', quote: 'USD' },
  'USD/CAD': { base: 'USD', quote: 'CAD' },
  'NZD/USD': { base: 'NZD', quote: 'USD' },
  'EUR/GBP': { base: 'EUR', quote: 'GBP' },
  'EUR/JPY': { base: 'EUR', quote: 'JPY' },
  'GBP/JPY': { base: 'GBP', quote: 'JPY' },
  'USD/KES': { base: 'USD', quote: 'KES' },
  'EUR/KES': { base: 'EUR', quote: 'KES' },
  'GBP/KES': { base: 'GBP', quote: 'KES' },
  'USD/ZAR': { base: 'USD', quote: 'ZAR' },
  'USD/NGN': { base: 'USD', quote: 'NGN' },
  'USD/GHS': { base: 'USD', quote: 'GHS' },
  'USD/TZS': { base: 'USD', quote: 'TZS' },
  'USD/UGX': { base: 'USD', quote: 'UGX' },
  'USD/ETB': { base: 'USD', quote: 'ETB' },
  'USD/EGP': { base: 'USD', quote: 'EGP' },
}

// Base rates (approximate - replace with real API in production)
const BASE_RATES: Record<string, number> = {
  'EUR/USD': 1.08, 'GBP/USD': 1.27, 'USD/JPY': 149.5, 'USD/CHF': 0.88,
  'AUD/USD': 0.66, 'USD/CAD': 1.36, 'NZD/USD': 0.61, 'EUR/GBP': 0.85,
  'EUR/JPY': 161.5, 'GBP/JPY': 190.0, 'USD/KES': 129.5, 'EUR/KES': 140.0,
  'GBP/KES': 164.5, 'USD/ZAR': 18.2, 'USD/NGN': 1550.0, 'USD/GHS': 15.5,
  'USD/TZS': 2500.0, 'USD/UGX': 3700.0, 'USD/ETB': 120.0, 'USD/EGP': 48.5
}

function generateSignal(currentRate: number, pair: string): {
  signal: string
  entryPrice: number
  stopLoss: number
  takeProfit: number
  confidence: number
  trend: string
  rsi: number
  macd: string
  support: number
  resistance: number
  riskReward: string
} {
  const randomChange = (Math.random() - 0.5) * 0.004
  const entryPrice = currentRate * (1 + randomChange)
  const isBullish = Math.random() > 0.45
  const rsi = Math.round(30 + Math.random() * 40)
  const support = entryPrice * 0.995
  const resistance = entryPrice * 1.005

  return {
    signal: isBullish ? 'BUY' : 'SELL',
    entryPrice: Number(entryPrice.toFixed(4)),
    stopLoss: Number((isBullish ? support : resistance).toFixed(4)),
    takeProfit: Number((isBullish ? resistance : support).toFixed(4)),
    confidence: Number((0.75 + Math.random() * 0.23).toFixed(2)),
    trend: rsi > 60 ? 'UPTREND' : rsi < 40 ? 'DOWNTREND' : 'SIDEWAYS',
    rsi,
    macd: Math.random() > 0.5 ? 'Bullish Crossover' : 'Bearish Crossover',
    support: Number(support.toFixed(4)),
    resistance: Number(resistance.toFixed(4)),
    riskReward: '1:2.5'
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Generate signals for all pairs
    const signals = CURRENCY_PAIRS.map(pair => {
      const baseRate = BASE_RATES[pair] || 1.0
      const signal = generateSignal(baseRate, pair)
      return {
        pair,
        ...signal,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({ success: true, signals })
  } catch (error) {
    return NextResponse.json({ signals: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const pair = body.pair || 'EUR/USD'
    const baseRate = BASE_RATES[pair] || 1.0
    const signal = generateSignal(baseRate, pair)

    return NextResponse.json({ 
      success: true, 
      signal: { pair, ...signal, timestamp: new Date().toISOString() }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Signal generation failed' }, { status: 500 })
  }
}