'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Search, Brain, LineChart, PieChart, ShoppingCart, Zap, DollarSign, AlertTriangle,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  TrendingDown, CheckCircle2, XCircle, ShieldAlert
} from 'lucide-react'

export default function AnomaliesPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/anomalies')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError('Failed to load anomalies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const summary = data.summary || {}
  const movementAnomalies = data.movementAnomalies || []
  const negativeStock = data.negativeStock || []
  const adjustmentAnomalies = data.adjustmentAnomalies || []
  const shrinkage = data.shrinkage || []

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
          <Link href="/wavecore-erp/inventory/forecasting" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <LineChart className="w-5 h-5" /> Forecasting
          </Link>
          <Link href="/wavecore-erp/inventory/abc-xyz" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <PieChart className="w-5 h-5" /> ABC/XYZ
          </Link>
          <Link href="/wavecore-erp/inventory/reorder" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ShoppingCart className="w-5 h-5" /> Reorder
          </Link>
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Zap className="w-5 h-5" /> ATP
          </Link>
          <Link href="/wavecore-erp/inventory/valuation" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <DollarSign className="w-5 h-5" /> Valuation
          </Link>
          <Link href="/wavecore-erp/inventory/anomalies" className="flex items-center gap-3 p-3 rounded-xl bg-red-600 text-white font-bold shadow-lg">
            <ShieldAlert, Truck className="w-5 h-5" /> Anomalies
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert, Truck className="w-6 h-6 text-red-500" /> Anomaly Detection
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Detect unusual stock movements, theft, and shrinkage</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi(activeKpi === 'MOVEMENT' ? 'ALL' : 'MOVEMENT')} className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left ' + (activeKpi === 'MOVEMENT' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.movementAnomalies || 0}</p>
            <p className="text-xs opacity-80">Movement Anomalies</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'NEGATIVE' ? 'ALL' : 'NEGATIVE')} className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg text-left ' + (activeKpi === 'NEGATIVE' ? 'ring-4 ring-yellow-300' : '')}>
            <XCircle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.negativeStock || 0}</p>
            <p className="text-xs opacity-80">Negative Stock</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'ADJUST' ? 'ALL' : 'ADJUST')} className={'p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-800 text-white shadow-lg text-left ' + (activeKpi === 'ADJUST' ? 'ring-4 ring-orange-300' : '')}>
            <TrendingDown className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.adjustmentAnomalies || 0}</p>
            <p className="text-xs opacity-80">Adjustment Anomalies</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'SHRINK' ? 'ALL' : 'SHRINK')} className={'p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg text-left ' + (activeKpi === 'SHRINK' ? 'ring-4 ring-purple-300' : '')}>
            <Eye className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.shrinkageItems || 0}</p>
            <p className="text-xs opacity-80">Shrinkage Items</p>
          </button>
        </div>

        {/* MOVEMENT ANOMALIES */}
        {(activeKpi === 'ALL' || activeKpi === 'MOVEMENT') && movementAnomalies.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Movement Anomalies
            </h2>
            <div className="space-y-2">
              {movementAnomalies.map((a: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-red-900/20 flex justify-between">
                  <div>
                    <p className="font-bold text-white">{a.productName}</p>
                    <p className="text-xs text-neutral-400">Qty: {a.quantity} | Avg: {Math.round(a.avg_qty)} | StdDev: {Math.round(a.stddev_qty)}</p>
                  </div>
                  <span className={'px-2 py-1 rounded-full text-xs font-bold ' + (a.anomalyLevel === 'CRITICAL' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300')}>
                    {a.anomalyLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEGATIVE STOCK */}
        {(activeKpi === 'ALL' || activeKpi === 'NEGATIVE') && negativeStock.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <h2 className="font-bold text-white mb-4">Negative Stock</h2>
            <div className="space-y-2">
              {negativeStock.map((n: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-yellow-900/20 flex justify-between">
                  <p className="font-bold text-white">{n.name}</p>
                  <span className="text-red-400 font-bold">{n.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHRINKAGE */}
        {(activeKpi === 'ALL' || activeKpi === 'SHRINK') && shrinkage.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <h2 className="font-bold text-white mb-4">Shrinkage Report</h2>
            <div className="space-y-2">
              {shrinkage.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-purple-900/20 flex justify-between">
                  <p className="font-bold text-white">{s.name}</p>
                  <span className="text-red-400 font-bold">{s.totalShrinkage} units lost</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NO ANOMALIES */}
        {summary.totalAnomalies === 0 && !loading && (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-neutral-400">No anomalies detected. All stock movements are normal.</p>
          </div>
        )}
      </div>
    </div>
  )
}