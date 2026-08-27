export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP']
const TRENDS = ['UPTREND', 'DOWNTREND', 'SIDEWAYS']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)]
    const signal = Math.random() > 0.5 ? 'BUY' : 'SELL'
    const basePrice = 0.6 + Math.random() * 1.5
    
    const forexSignal = {
      pair,
      signal,
      entryPrice: basePrice,
      stopLoss: signal === 'BUY' ? basePrice * 0.995 : basePrice * 1.005,
      takeProfit: signal === 'BUY' ? basePrice * 1.015 : basePrice * 0.985,
      confidence: 0.75 + Math.random() * 0.23,
      trend: TRENDS[Math.floor(Math.random() * TRENDS.length)],
      rsi: 20 + Math.random() * 60,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, signal: forexSignal })
  } catch (error) {
    return NextResponse.json({ error: 'Signal generation failed' }, { status: 500 })
  }
}