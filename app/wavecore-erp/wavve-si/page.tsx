'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, RefreshCw, Radio, Activity, Globe, TrendingUp,
  TrendingDown, Shield, AlertTriangle, Info,
} from 'lucide-react'

interface Quote {
  pair: string
  last: number | null
  bid: number | null
  ask: number | null
  source: 'DERIV' | 'REST_DAILY' | 'UNAVAILABLE'
  updatedAt: string
}

interface Summary {
  market: { status: 'OPEN' | 'CLOSED' | 'PRE_MARKET'; label: string; detail: string; cryptoNote: string }
  counts: { fxPairsTracked: number; extraSymbolsTracked: number; totalSymbols: number }
  engine: {
    signalEngineReady: boolean
    riskEngineReady: boolean
    brokerConnected: boolean
    signalsToday: number
    highConfidenceSignals: number
    openPositions: number
    unrealizedPnL: number
    todaysPnL: number
    riskExposurePct: number
    modelAccuracy: number | null
  }
  server: { nowUtc: string; nowNairobi: string; timezone: string }
}

const GROUP_FX      = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY']
const GROUP_AFRICAN = ['USD/KES','EUR/KES','GBP/KES','USD/ZAR','USD/NGN','USD/GHS','USD/TZS','USD/UGX','USD/ETB','USD/EGP']
const GROUP_OTHER   = ['XAU/USD','XAG/USD','BTC/USD','ETH/USD']

const TABS: { key: 'all' | 'fx' | 'african' | 'other'; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'fx',      label: 'Majors' },
  { key: 'african', label: 'African FX' },
  { key: 'other',   label: 'Metals & Crypto' },
]

export default function WavveSIPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [live, setLive] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState('')
  const [tab, setTab] = useState<'all' | 'fx' | 'african' | 'other'>('all')

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    setError('')
    try {
      const [qRes, sRes] = await Promise.all([
        fetch('/api/wavecore/wavve-si/quotes', { cache: 'no-store' }),
        fetch('/api/wavecore/wavve-si/summary', { cache: 'no-store' }),
      ])
      const qData = await qRes.json()
      const sData = await sRes.json()
      if (!qRes.ok) { setError(qData.error || 'Failed to load quotes'); return }
      setQuotes(qData.quotes || [])
      setSummary(sData || null)
      setLastUpdate(new Date().toLocaleTimeString('en-KE'))
    } catch { setError('Network error') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => load({ silent: true }), 5000)
    return () => clearInterval(t)
  }, [live])

  const fmtPrice = (n: number | null, pair: string) => {
    if (n == null) return '—'
    const digits = pair.includes('JPY') ? 3 : pair.startsWith('USD/KES') || pair.startsWith('EUR/KES') || pair.startsWith('GBP/KES') ? 2 : pair.includes('BTC') || pair.includes('ETH') ? 2 : pair.includes('XAU') || pair.includes('XAG') ? 2 : 5
    return n.toFixed(digits)
  }

  const filtered = quotes.filter(q => {
    if (tab === 'all') return true
    if (tab === 'fx') return GROUP_FX.includes(q.pair)
    if (tab === 'african') return GROUP_AFRICAN.includes(q.pair)
    if (tab === 'other') return GROUP_OTHER.includes(q.pair)
    return true
  })

  const marketOpen = summary?.market.status === 'OPEN'
  const marketColor = marketOpen ? 'text-emerald-400' : 'text-amber-400'
  const marketDot = marketOpen ? 'bg-emerald-500' : 'bg-amber-500'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp" className="p-2 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-slate-400">Wavve SI</p>
              <p className="font-bold text-sm">AI Trading Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLive(!live)}
              className={'px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ' + (live ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400')}
              title={live ? 'Live updates ON — refresh every 5s' : 'Live updates OFF'}
            >
              <Radio className={'w-3 h-3 ' + (live ? 'animate-pulse' : '')} />
              {live ? 'LIVE' : 'PAUSED'}
            </button>
            <button onClick={() => load({ silent: true })} disabled={refreshing} className="px-4 py-2 rounded-xl bg-slate-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Wavve AI Trading Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time market data across FX, metals and crypto. Signal engine, risk engine and broker connections ship in later phases.
          </p>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-800">
            <span className={'w-2 h-2 rounded-full ' + (marketOpen ? marketDot + ' animate-pulse' : marketDot)} />
            MARKET {marketOpen ? 'OPEN' : 'CLOSED'}
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-800">
            <Activity className="w-3 h-3 text-amber-400" />
            SIGNAL ENGINE <span className="text-slate-500">— phase SI-2</span>
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-800">
            <Shield className="w-3 h-3 text-blue-400" />
            RISK ENGINE <span className="text-slate-500">— phase SI-5</span>
          </span>
          {lastUpdate && (
            <span className="text-xs text-slate-500">Last update {lastUpdate}</span>
          )}
        </div>

        {/* Honest KPI strip — no fake signals, no fake accuracy */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <Globe className={'w-5 h-5 mb-2 ' + marketColor} />
            <p className="text-lg font-bold">{summary?.market.label || '—'}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Market status</p>
            <p className="text-[10px] text-slate-500 mt-1">{summary?.market.detail || ''}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <Activity className="w-5 h-5 mb-2 text-cyan-400" />
            <p className="text-lg font-bold">{summary?.counts.totalSymbols || 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Symbols tracked</p>
            <p className="text-[10px] text-slate-500 mt-1">{summary?.counts.fxPairsTracked || 0} FX · {summary?.counts.extraSymbolsTracked || 0} metals/crypto</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <TrendingUp className="w-5 h-5 mb-2 text-emerald-400" />
            <p className="text-lg font-bold text-emerald-400">{quotes.filter(q => q.source === 'REST_DAILY' || q.source === 'DERIV').length}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Real prices</p>
            <p className="text-[10px] text-slate-500 mt-1">{quotes.filter(q => q.source === 'UNAVAILABLE').length} unavailable · {summary ? 'daily freshness' : ''}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <Info className="w-5 h-5 mb-2 text-indigo-400" />
            <p className="text-lg font-bold">Coming</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Signal engine</p>
            <p className="text-[10px] text-slate-500 mt-1">Real RSI/MACD/structure engine in phase SI-2 — no fabricated numbers shown before then.</p>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-950/40 text-red-300 border border-red-900 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={'px-4 py-2 rounded-xl text-sm font-bold ' + (tab === t.key ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Quotes grid */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
            <p className="text-slate-400">No quotes in this group.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(q => {
              const srcColor = q.source === 'DERIV' ? 'bg-emerald-900/40 text-emerald-300' : q.source === 'REST_DAILY' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'
              const srcLabel = q.source === 'DERIV' ? 'LIVE (tick)' : q.source === 'REST_DAILY' ? 'REAL (daily)' : 'NO DATA'
              return (
                <div key={q.pair} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-bold">{q.pair}</p>
                    <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + srcColor}>{srcLabel}</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{fmtPrice(q.last, q.pair)}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span>Bid {fmtPrice(q.bid, q.pair)}</span>
                    <span>Ask {fmtPrice(q.ask, q.pair)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Roadmap */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" /> Module roadmap
          </h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li><strong className="text-white">SI-1 (now)</strong> — Real market data + rebrand to Wavve SI. No fabricated signals.</li>
            <li><strong className="text-slate-300">SI-2</strong> — Signal engine from real historical candles (RSI, MACD, EMA crossover, structure).</li>
            <li><strong className="text-slate-300">SI-3</strong> — Wavve Chart (candlestick + Heikin Ashi + indicators).</li>
            <li><strong className="text-slate-300">SI-4</strong> — Signal history + AI reasoning block.</li>
            <li><strong className="text-slate-300">SI-5</strong> — Risk engine (position sizing, portfolio concentration, daily loss limits).</li>
            <li><strong className="text-slate-300">SI-6</strong> — Deriv broker connect (demo first, live second, confirmation modal).</li>
            <li><strong className="text-slate-300">SI-7</strong> — Additional brokers (OANDA and others).</li>
            <li><strong className="text-slate-300">SI-8</strong> — AI Copilot chat + auto trade journal.</li>
          </ul>
          <p className="text-[10px] text-slate-500 mt-3">
            Nothing in this module should be traded on until the signal engine (SI-2) is live. The prices above are real market data.
          </p>
        </div>
      </main>
    </div>
  )
}