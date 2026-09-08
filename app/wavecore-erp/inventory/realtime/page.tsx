'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap, DollarSign, ShieldAlert, Clock, Activity,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers,
  CheckCircle2, AlertTriangle, Boxes, Radio, TrendingUp
} from 'lucide-react'

export default function RealtimeDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/wavecore/inventory/realtime')
      const result = await res.json()
      setData(result)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError('Failed to load real-time data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const kpis = data?.kpis || {}
  const recentMovements = data?.recentMovements || []

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
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ArrowLeft className="w-5 h-5" /> Dashboard</Link>
          <Link href="/wavecore-erp/inventory/products" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Package className="w-5 h-5" /> Products</Link>
          <Link href="/wavecore-erp/inventory/warehouses" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Warehouse className="w-5 h-5" /> Warehouses</Link>
          <Link href="/wavecore-erp/inventory/movements" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ArrowLeftRight className="w-5 h-5" /> Movements</Link>
          <Link href="/wavecore-erp/inventory/adjustments" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Sliders className="w-5 h-5" /> Adjustments</Link>
          <Link href="/wavecore-erp/inventory/counts" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ClipboardList className="w-5 h-5" /> Counts</Link>
          <Link href="/wavecore-erp/inventory/ledger" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Layers className="w-5 h-5" /> Ledger</Link>
          <Link href="/wavecore-erp/inventory/copilot" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Brain className="w-5 h-5" /> AI Copilot</Link>
          <Link href="/wavecore-erp/inventory/forecasting" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><LineChart className="w-5 h-5" /> Forecasting</Link>
          <Link href="/wavecore-erp/inventory/abc-xyz" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><PieChart className="w-5 h-5" /> ABC/XYZ</Link>
          <Link href="/wavecore-erp/inventory/reorder" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ShoppingCart className="w-5 h-5" /> Reorder</Link>
          <Link href="/wavecore-erp/inventory/stock-aging" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Clock className="w-5 h-5" /> Stock Aging</Link>
          <Link href="/wavecore-erp/inventory/realtime" className="flex items-center gap-3 p-3 rounded-xl bg-green-600 text-white font-bold shadow-lg"><Radio className="w-5 h-5" /> Real-time</Link>
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Zap className="w-5 h-5" /> ATP</Link>
          <Link href="/wavecore-erp/inventory/valuation" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><DollarSign className="w-5 h-5" /> Valuation</Link>
          <Link href="/wavecore-erp/inventory/anomalies" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ShieldAlert className="w-5 h-5" /> Anomalies</Link>
        </nav>
      </div>
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Radio className="w-6 h-6 text-green-500" /> Real-time Dashboard</h1>
            <p className="text-sm text-neutral-400 mt-1">Live updates every 5 seconds</p>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setAutoRefresh(!autoRefresh)} className={'px-4 py-2 rounded-xl font-bold ' + (autoRefresh ? 'bg-green-600 text-white' : 'bg-neutral-800 text-neutral-400')}>
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </button>
            <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {lastUpdated && (
          <div className="mb-4 text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Last updated: {lastUpdated}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg"><Package className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalProducts}</p><p className="text-xs opacity-80">Products</p></div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg"><Boxes className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalUnits.toLocaleString()}</p><p className="text-xs opacity-80">Units</p></div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg"><DollarSign className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">KSh {kpis.stockValue.toLocaleString()}</p><p className="text-xs opacity-80">Stock Value</p></div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg"><Warehouse className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalWarehouses}</p><p className="text-xs opacity-80">Warehouses</p></div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg"><AlertTriangle className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.lowStockCount}</p><p className="text-xs opacity-80">Low Stock</p></div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg"><Activity className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.movements24h}</p><p className="text-xs opacity-80">Movements (24h)</p></div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Live Movements</h2>
          {recentMovements.length === 0 ? (
            <p className="text-neutral-400">No recent movements</p>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((m: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-neutral-800 flex justify-between">
                  <div><p className="font-bold text-white">{m.productName}</p><p className="text-xs text-neutral-400">{m.type}</p></div>
                  <span className="font-bold text-white">{m.quantity} units</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}