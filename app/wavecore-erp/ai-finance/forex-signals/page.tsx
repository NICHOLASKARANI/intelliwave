'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, History, Zap, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface ForexSignal {
  id: string
  pair: string
  signal: string
  entryPrice: number
  stopLoss: number
  takeProfit: number
  confidence: number
  trend: string
  rsi: number
  timestamp: string
}

export default function ForexSignalsPage() {
  const [monitoring, setMonitoring] = useState(false)
  const [signals, setSignals] = useState<ForexSignal[]>([])
  const [latest, setLatest] = useState<ForexSignal | null>(null)

  useEffect(() => {
    let interval: any
    if (monitoring) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/wavecore/ai-finance/forex-signals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ market: 'forex' })
          })
          const d = await res.json()
          if (d.success) {
            setLatest(d.signal)
            setSignals(prev => [d.signal, ...prev].slice(0, 30))
          }
        } catch {}
      }, 3000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [monitoring])

  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP']

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Forex Signal Detection</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-500" /> Forex Signal Detection
        </h1>

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
          {!monitoring ? (
            <button onClick={() => setMonitoring(true)}
              className="px-8 py-4 rounded-xl bg-green-600 text-white font-bold text-lg flex items-center gap-2 mx-auto">
              <Zap className="w-5 h-5" /> Start Signal Monitoring
            </button>
          ) : (
            <button onClick={() => setMonitoring(false)}
              className="px-8 py-4 rounded-xl bg-neutral-600 text-white font-bold text-lg">
              Stop Monitoring
            </button>
          )}
        </div>

        {/* Latest Signal */}
        {latest && (
          <div className={`rounded-2xl border p-6 mb-6 ${latest.signal === 'BUY' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latest Signal</p>
                <p className="text-3xl font-bold">{latest.pair}</p>
              </div>
              <div className={`px-6 py-3 rounded-xl text-white font-bold text-2xl ${latest.signal === 'BUY' ? 'bg-green-600' : 'bg-red-600'}`}>
                {latest.signal}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Entry</p>
                <p className="font-bold">{latest.entryPrice.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stop Loss</p>
                <p className="font-bold text-red-600">{latest.stopLoss.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Take Profit</p>
                <p className="font-bold text-green-600">{latest.takeProfit.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-bold">{(latest.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 justify-center">
              <span className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" /> Trend: {latest.trend}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Activity className="w-4 h-4 text-blue-500" /> RSI: {latest.rsi.toFixed(0)}
              </span>
            </div>
          </div>
        )}

        {/* Signal History */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" /> Signal History
          </h2>
          {signals.length === 0 ? (
            <p className="text-muted-foreground">No signals generated yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {signals.map((sig, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${sig.signal === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {sig.signal}
                    </span>
                    <span className="font-bold">{sig.pair}</span>
                    <span className="text-sm text-muted-foreground">{sig.entryPrice.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{sig.trend}</span>
                    <span className="text-sm text-muted-foreground">{new Date(sig.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}