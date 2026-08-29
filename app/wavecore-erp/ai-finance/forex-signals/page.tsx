'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Loader2, History, Zap, Target, Activity, DollarSign, BarChart3, RefreshCw, Globe, ArrowUpRight, ArrowDownRight, Star, Trash2, Radio } from 'lucide-react'

interface ForexSignal {
  pair: string
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
  source: string
  timestamp: string
}

export default function ForexSignalsPage() {
  const [signals, setSignals] = useState<ForexSignal[]>([])
  const [filteredSignals, setFilteredSignals] = useState<ForexSignal[]>([])
  const [selectedPair, setSelectedPair] = useState('ALL')
  const [selectedSignal, setSelectedSignal] = useState<ForexSignal | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [dataSource, setDataSource] = useState('')
  const [history, setHistory] = useState<ForexSignal[]>([])
  const intervalRef = useRef<any>(null)

  const pairs = ['ALL', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'USD/KES', 'EUR/KES', 'GBP/KES', 'USD/ZAR', 'USD/NGN', 'USD/GHS', 'USD/TZS', 'USD/UGX', 'USD/ETB', 'USD/EGP']

  const fetchSignals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/ai-finance/forex-signals')
      const data = await res.json()
      if (data.success) {
        setSignals(data.signals)
        setFilteredSignals(data.signals)
        setLastUpdated(new Date().toLocaleTimeString())
        setDataSource(data.dataSource || '')
        if (data.signals.length > 0) {
          setSelectedSignal(data.signals[0])
          setHistory(prev => [data.signals[0], ...prev].slice(0, 10))
        }
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSignals()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchSignals, 5000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh])

  useEffect(() => {
    if (selectedPair === 'ALL') {
      setFilteredSignals(signals)
    } else {
      setFilteredSignals(signals.filter(s => s.pair === selectedPair))
    }
  }, [selectedPair, signals])

  const deleteHistory = (index: number) => {
    setHistory(prev => prev.filter((_, i) => i !== index))
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Forex Signals</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" /> Forex Signal Detection
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Radio className={`w-3 h-3 ${autoRefresh ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              {lastUpdated || 'Not updated'}
            </span>
            {dataSource && (
              <span className={`text-xs px-2 py-1 rounded-lg ${dataSource.includes('MIXED') ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                {dataSource}
              </span>
            )}
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ${autoRefresh ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              {autoRefresh ? 'Live ON' : 'Live OFF'}
            </button>
            <button onClick={fetchSignals} disabled={loading}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {pairs.map(pair => (
            <button key={pair} onClick={() => setSelectedPair(pair)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap ${selectedPair === pair ? 'bg-green-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              {pair}
            </button>
          ))}
        </div>

        {selectedSignal && (
          <div className={`rounded-2xl border p-6 mb-6 ${selectedSignal.signal === 'BUY' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Globe className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{selectedSignal.pair}</p>
                  <p className="text-sm text-muted-foreground">{selectedSignal.trend} | RSI: {selectedSignal.rsi} | {selectedSignal.source}</p>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-xl text-white font-bold text-2xl ${selectedSignal.signal === 'BUY' ? 'bg-green-600' : 'bg-red-600'}`}>
                {selectedSignal.signal}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">Entry</p>
                <p className="font-bold text-lg">{selectedSignal.entryPrice}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">Stop Loss</p>
                <p className="font-bold text-red-600">{selectedSignal.stopLoss}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">Take Profit</p>
                <p className="font-bold text-green-600">{selectedSignal.takeProfit}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="font-bold">{(selectedSignal.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">MACD</p>
                <p className="text-sm font-bold">{selectedSignal.macd}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">Support</p>
                <p className="text-sm font-bold">{selectedSignal.support}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">Resistance</p>
                <p className="text-sm font-bold">{selectedSignal.resistance}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-neutral-800">
                <p className="text-xs text-muted-foreground">Risk/Reward</p>
                <p className="text-sm font-bold">{selectedSignal.riskReward}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {filteredSignals.slice(0, 12).map((sig, i) => (
            <button key={i} onClick={() => setSelectedSignal(sig)}
              className={`p-4 rounded-2xl border text-left transition-all ${selectedSignal?.pair === sig.pair ? 'border-green-500 bg-green-50' : 'bg-white dark:bg-neutral-900'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold">{sig.pair}</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${sig.signal === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sig.signal}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                {sig.signal === 'BUY' ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                Entry: {sig.entryPrice} | RSI: {sig.rsi}
              </div>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" /> Signal History ({history.length})
              </h2>
              <button onClick={clearHistory} className="text-sm text-red-600 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${h.signal === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {h.signal}
                    </span>
                    <span className="font-bold">{h.pair}</span>
                    <span className="text-sm text-muted-foreground">{h.entryPrice}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
                    <button onClick={() => deleteHistory(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}