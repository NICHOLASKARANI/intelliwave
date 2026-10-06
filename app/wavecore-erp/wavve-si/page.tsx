'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, RefreshCw, Radio, Activity, Globe, TrendingUp,
  TrendingDown, Shield, AlertTriangle, Info, Sparkles, Target, ChevronRight,
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
interface SignalRow {
  pair: string
  direction: 'BUY' | 'SELL' | 'NO_TRADE'
  tier: 'NO_TRADE' | 'WEAK' | 'MODERATE' | 'STRONG' | 'HIGH' | 'VERY_HIGH'
  score: number
  levels: { entry: number; sl: number; tp1: number; tp2: number; rr: number } | null
  breakdown?: { name: string; weight: number; score: number; value: any; note: string }[]
  reason: Record<string, any>
  lastClose?: number
  lastCloseDate?: string
}

interface SignalsResponse {
  signals: SignalRow[]
  summary: {
    pairsScanned: number
    actionable: number
    highConviction: number
    buys: number
    sells: number
    noTrade: number
    source: string
    cadence: string
    serverLatencyMs: number
  }
  asOf: string
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
  // SI-2 — signal engine state
  const [signals, setSignals] = useState<SignalRow[]>([])
  const [signalSummary, setSignalSummary] = useState<SignalsResponse['summary'] | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<SignalRow | null>(null)
  const [signalTab, setSignalTab] = useState<'actionable' | 'all' | 'high'>('actionable')
  const [signalsLoading, setSignalsLoading] = useState(true)

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
  // SI-2 — load signals once on mount, refresh every 60s
  const loadSignals = async () => {
    setSignalsLoading(true)
    try {
      const res = await fetch('/api/wavecore/wavve-si/signals', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setSignals(data.signals || [])
        setSignalSummary(data.summary || null)
        if (data.signals?.length && !selectedSignal) {
          const firstActionable = data.signals.find((s: SignalRow) => s.direction !== 'NO_TRADE')
          setSelectedSignal(firstActionable || data.signals[0])
        }
      }
    } catch {}
    finally { setSignalsLoading(false) }
  }

  useEffect(() => { loadSignals() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const t = setInterval(() => { loadSignals() }, 60_000)
    return () => clearInterval(t)
  }, [])

  const filteredSignals = signals.filter(s => {
    if (signalTab === 'actionable') return s.direction !== 'NO_TRADE'
    if (signalTab === 'high') return ['STRONG', 'HIGH', 'VERY_HIGH'].includes(s.tier)
    return true
  })

  const tierColor = (tier: string) => {
    if (tier === 'VERY_HIGH') return 'bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-800'
    if (tier === 'HIGH')      return 'bg-emerald-900/40 text-emerald-300 border-emerald-800'
    if (tier === 'STRONG')    return 'bg-teal-900/40 text-teal-300 border-teal-800'
    if (tier === 'MODERATE')  return 'bg-amber-900/40 text-amber-300 border-amber-800'
    if (tier === 'WEAK')      return 'bg-slate-800 text-slate-400 border-slate-700'
    return 'bg-slate-900 text-slate-500 border-slate-800'
  }

  const dirColor = (dir: string) => {
    if (dir === 'BUY')  return 'text-emerald-400'
    if (dir === 'SELL') return 'text-red-400'
    return 'text-slate-500'
  }

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

        {/* ============================================================ */}
        {/* SI-2 — AI Signal Engine                                     */}
        {/* Every number is derived from real ECB daily closes.         */}
        {/* ============================================================ */}
        <section className="mt-10">
          <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> AI Signal Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Computed from real ECB daily closes via api.frankfurter.app ·
                RSI(14), MACD(12,26,9), EMA20/50, Bollinger(20,2), ATR(14) ·
                {signalSummary ? ` ${signalSummary.pairsScanned} pairs scanned in ${signalSummary.serverLatencyMs}ms` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSignalTab('actionable')} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (signalTab === 'actionable' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400')}>
                Actionable ({signals.filter(s => s.direction !== 'NO_TRADE').length})
              </button>
              <button onClick={() => setSignalTab('high')} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (signalTab === 'high' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400')}>
                High conviction ({signals.filter(s => ['STRONG','HIGH','VERY_HIGH'].includes(s.tier)).length})
              </button>
              <button onClick={() => setSignalTab('all')} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (signalTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400')}>
                All ({signals.length})
              </button>
            </div>
          </div>

          {signalSummary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Buys</p>
                <p className="text-lg font-bold text-emerald-400">{signalSummary.buys}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Sells</p>
                <p className="text-lg font-bold text-red-400">{signalSummary.sells}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">High conviction</p>
                <p className="text-lg font-bold text-teal-400">{signalSummary.highConviction}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">NO TRADE</p>
                <p className="text-lg font-bold text-slate-500">{signalSummary.noTrade}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Cadence</p>
                <p className="text-xs text-slate-400 mt-1">Daily closes</p>
              </div>
            </div>
          )}

          {signalsLoading && signals.length === 0 ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
              <p className="text-slate-400">No signals in this category right now.</p>
              <p className="text-xs text-slate-500 mt-1">The engine returns NO TRADE when criteria are not met — that is a valid outcome.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Signal list */}
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/50 border-b border-slate-800">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 font-bold">
                        <th className="px-3 py-3">Pair</th>
                        <th className="px-3 py-3">Direction</th>
                        <th className="px-3 py-3">Tier</th>
                        <th className="px-3 py-3 text-right">Score</th>
                        <th className="px-3 py-3 text-right">Entry</th>
                        <th className="px-3 py-3 text-right">SL</th>
                        <th className="px-3 py-3 text-right">TP1</th>
                        <th className="px-3 py-3 text-right">R:R</th>
                        <th className="px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSignals.map(s => {
                        const isSel = selectedSignal?.pair === s.pair
                        return (
                          <tr key={s.pair} onClick={() => setSelectedSignal(s)} className={'border-b border-slate-800/60 last:border-0 cursor-pointer transition ' + (isSel ? 'bg-indigo-950/40' : 'hover:bg-slate-800/40')}>
                            <td className="px-3 py-2 font-bold">{s.pair}</td>
                            <td className={'px-3 py-2 font-bold ' + dirColor(s.direction)}>{s.direction === 'NO_TRADE' ? '—' : s.direction}</td>
                            <td className="px-3 py-2">
                              <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold border ' + tierColor(s.tier)}>
                                {s.tier.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono">{s.score}</td>
                            <td className="px-3 py-2 text-right font-mono text-xs">{s.levels ? s.levels.entry.toFixed(5) : '—'}</td>
                            <td className="px-3 py-2 text-right font-mono text-xs text-red-400">{s.levels ? s.levels.sl.toFixed(5) : '—'}</td>
                            <td className="px-3 py-2 text-right font-mono text-xs text-emerald-400">{s.levels ? s.levels.tp1.toFixed(5) : '—'}</td>
                            <td className="px-3 py-2 text-right text-xs">{s.levels ? '1:' + s.levels.rr.toFixed(1) : '—'}</td>
                            <td className="px-3 py-2 text-right"><ChevronRight className={'w-4 h-4 transition ' + (isSel ? 'text-indigo-400' : 'text-slate-600')} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reasoning panel */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                {selectedSignal ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-lg">{selectedSignal.pair}</p>
                        <p className="text-xs text-slate-500">Last close {selectedSignal.lastClose?.toFixed(5) ?? '—'} {selectedSignal.lastCloseDate ? '(' + selectedSignal.lastCloseDate + ')' : ''}</p>
                      </div>
                      <span className={'px-3 py-1 rounded-full text-[10px] font-bold border ' + tierColor(selectedSignal.tier)}>
                        {selectedSignal.tier.replace('_', ' ')}
                      </span>
                    </div>

                    {selectedSignal.direction !== 'NO_TRADE' && selectedSignal.levels && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-slate-950/60">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Entry</p>
                          <p className="font-mono text-sm">{selectedSignal.levels.entry.toFixed(5)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Risk : Reward</p>
                          <p className="font-mono text-sm">1 : {selectedSignal.levels.rr.toFixed(1)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-red-950/30 border border-red-900/50">
                          <p className="text-[10px] uppercase tracking-wide text-red-400 font-bold">Stop loss</p>
                          <p className="font-mono text-sm text-red-300">{selectedSignal.levels.sl.toFixed(5)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/50">
                          <p className="text-[10px] uppercase tracking-wide text-emerald-400 font-bold">TP1</p>
                          <p className="font-mono text-sm text-emerald-300">{selectedSignal.levels.tp1.toFixed(5)}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold mb-2">AI reasoning</p>
                    <ul className="space-y-1.5 text-xs">
                      {Object.entries(selectedSignal.reason).map(([k, v]) => {
                        if (k === 'candlesUsed' || k === 'lastClose' || k === 'lastDate') return null
                        return (
                          <li key={k} className="flex justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                            <span className="text-slate-500 capitalize">{k}</span>
                            <span className="text-right text-slate-300">{String(v)}</span>
                          </li>
                        )
                      })}
                    </ul>

                    {selectedSignal.breakdown && selectedSignal.breakdown.length > 0 && (
                      <>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold mt-4 mb-2">Score breakdown</p>
                        <div className="space-y-1.5">
                          {selectedSignal.breakdown.map(b => (
                            <div key={b.name}>
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-slate-400">{b.name} · {b.weight}%</span>
                                <span className="text-slate-500">{b.score}/100</span>
                              </div>
                              <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: b.score + '%' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <p className="text-[10px] text-slate-500 mt-4">
                      Informational only. Not financial advice. Historical indicator readings do not predict future prices.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a signal to see the reasoning.</p>
                )}
              </div>
            </div>
          )}
        </section>

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