'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar, LineChart
} from 'lucide-react'

export default function ForecastingPage() {
  const [forecasts, setForecasts] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')

  const fetchForecasts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/forecasting')
      const data = await res.json()
      setForecasts(data.forecasts || [])
      setSummary(data.summary || {})
    } catch (err) {
      setError('Failed to load forecasts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchForecasts() }, [])

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/forecasting/' + id + '/pdf', '_blank')
  }

  const filtered = forecasts.filter(f => {
    const matchesSearch = (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchesKpi = activeKpi === 'ALL' || 
      (activeKpi === 'STOCKOUT' && f.willStockout) ||
      (activeKpi === 'UP' && f.trend === 'UP') ||
      (activeKpi === 'DOWN' && f.trend === 'DOWN') ||
      (activeKpi === 'STABLE' && f.trend === 'STABLE')
    return matchesSearch && matchesKpi
  })

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 z-50">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/wavecore-erp/inventory/products" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Package className="w-5 h-5" /> Products
          </Link>
          <Link href="/wavecore-erp/inventory/warehouses" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Warehouse className="w-5 h-5" /> Warehouses
          </Link>
          <Link href="/wavecore-erp/inventory/movements" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeftRight className="w-5 h-5" /> Movements
          </Link>
          <Link href="/wavecore-erp/inventory/adjustments" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Sliders className="w-5 h-5" /> Adjustments
          </Link>
          <Link href="/wavecore-erp/inventory/counts" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ClipboardList className="w-5 h-5" /> Counts
          </Link>
          <Link href="/wavecore-erp/inventory/ledger" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Layers className="w-5 h-5" /> Ledger
          </Link>
          <Link href="/wavecore-erp/inventory/copilot" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Brain className="w-5 h-5" /> AI Copilot
          </Link>
          <Link href="/wavecore-erp/inventory/forecasting" className="flex items-center gap-3 p-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg">
            <LineChart className="w-5 h-5" /> Forecasting
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <LineChart className="w-6 h-6 text-blue-500" /> Demand Forecasting
            </h1>
            <p className="text-sm text-neutral-400 mt-1">AI-powered demand predictions</p>
          </div>
          <button onClick={fetchForecasts} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi('STOCKOUT')} className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left ' + (activeKpi === 'STOCKOUT' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.willStockout || 0}</p>
            <p className="text-xs opacity-80">Will Stockout</p>
          </button>
          <button onClick={() => setActiveKpi('UP')} className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left ' + (activeKpi === 'UP' ? 'ring-4 ring-green-300' : '')}>
            <TrendingUp className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.trendingUp || 0}</p>
            <p className="text-xs opacity-80">Trending Up</p>
          </button>
          <button onClick={() => setActiveKpi('DOWN')} className={'p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-800 text-white shadow-lg text-left ' + (activeKpi === 'DOWN' ? 'ring-4 ring-orange-300' : '')}>
            <TrendingDown className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.trendingDown || 0}</p>
            <p className="text-xs opacity-80">Trending Down</p>
          </button>
          <button onClick={() => setActiveKpi('STABLE')} className={'p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg text-left ' + (activeKpi === 'STABLE' ? 'ring-4 ring-blue-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.stable || 0}</p>
            <p className="text-xs opacity-80">Stable</p>
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search forecasts..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <LineChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No forecast data</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Stock</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">7-Day</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">30-Day</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Days Supply</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Trend</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Status</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f: any) => (
                  <tr key={f.productId} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4"><p className="font-bold text-white">{f.name}</p><p className="text-xs text-neutral-400">{f.sku}</p></td>
                    <td className="p-4 text-right text-white">{f.currentStock}</td>
                    <td className="p-4 text-right text-neutral-300">{f.forecast7}</td>
                    <td className="p-4 text-right text-neutral-300">{f.forecast30}</td>
                    <td className="p-4 text-right"><span className={f.daysOfSupply < 14 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{f.daysOfSupply === 999 ? '∞' : f.daysOfSupply}</span></td>
                    <td className="p-4"><span className={'px-2 py-1 rounded-full text-xs font-bold ' + (f.trend === 'UP' ? 'bg-green-900/50 text-green-300' : f.trend === 'DOWN' ? 'bg-orange-900/50 text-orange-300' : 'bg-blue-900/50 text-blue-300')}>{f.trend}</span></td>
                    <td className="p-4"><span className={'px-2 py-1 rounded-full text-xs font-bold ' + (f.willStockout ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300')}>{f.willStockout ? 'STOCKOUT' : 'OK'}</span></td>
                    <td className="p-4 text-center"><button onClick={() => downloadPdf(f.productId)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800"><Printer className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}