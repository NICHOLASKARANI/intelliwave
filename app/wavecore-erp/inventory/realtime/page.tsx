'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap, DollarSign, ShieldAlert, Clock, Activity,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers,
  CheckCircle2, AlertTriangle, Boxes, Radio, TrendingUp, Trash2
} from 'lucide-react'

export default function RealtimeDashboardPage() {
  const [kpis, setKpis] = useState<any>({})
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [deleting, setDeleting] = useState('')

  const fetchData = async () => {
    try {
      const res = await fetch('/api/wavecore/inventory/realtime')
      const result = await res.json()
      setKpis(result.kpis || {})
      setRecentMovements(result.recentMovements || [])
      setLastUpdated(new Date().toLocaleTimeString())
      setError('')
    } catch (err) {
      setError('Failed to load real-time data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/products/' + id + '/pdf', '_blank')
  }

  const deleteMovement = async (id: string) => {
    if (!confirm('Delete this movement?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/movements?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Movement deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchData()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const filteredMovements = recentMovements.filter(m => {
    if (activeKpi === 'ALL') return true
    if (activeKpi === 'PRODUCTS') return true
    if (activeKpi === 'UNITS') return true
    if (activeKpi === 'VALUE') return true
    if (activeKpi === 'WAREHOUSES') return true
    if (activeKpi === 'LOW') return true
    if (activeKpi === 'MOVEMENTS') return true
    return true
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
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ArrowLeft className="w-5 h-5" /> Dashboard</Link>
          <Link href="/wavecore-erp/inventory/realtime" className="flex items-center gap-3 p-3 rounded-xl bg-green-600 text-white font-bold shadow-lg"><Radio className="w-5 h-5" /> Real-time</Link>
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
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {lastUpdated && (
          <div className="mb-4 text-sm text-green-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Last updated: {lastUpdated}</div>
        )}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-green-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <button onClick={() => setActiveKpi(activeKpi === 'PRODUCTS' ? 'ALL' : 'PRODUCTS')} className={'p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg text-left ' + (activeKpi === 'PRODUCTS' ? 'ring-4 ring-indigo-300' : '')}><Package className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalProducts}</p><p className="text-xs opacity-80">Products</p></button>
              <button onClick={() => setActiveKpi(activeKpi === 'UNITS' ? 'ALL' : 'UNITS')} className={'p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left ' + (activeKpi === 'UNITS' ? 'ring-4 ring-green-300' : '')}><Boxes className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{(kpis.totalUnits || 0).toLocaleString()}</p><p className="text-xs opacity-80">Units</p></button>
              <button onClick={() => setActiveKpi(activeKpi === 'VALUE' ? 'ALL' : 'VALUE')} className={'p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg text-left ' + (activeKpi === 'VALUE' ? 'ring-4 ring-blue-300' : '')}><DollarSign className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">KSh {(kpis.stockValue || 0).toLocaleString()}</p><p className="text-xs opacity-80">Stock Value</p></button>
              <button onClick={() => setActiveKpi(activeKpi === 'WAREHOUSES' ? 'ALL' : 'WAREHOUSES')} className={'p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg text-left ' + (activeKpi === 'WAREHOUSES' ? 'ring-4 ring-purple-300' : '')}><Warehouse className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalWarehouses}</p><p className="text-xs opacity-80">Warehouses</p></button>
              <button onClick={() => setActiveKpi(activeKpi === 'LOW' ? 'ALL' : 'LOW')} className={'p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left ' + (activeKpi === 'LOW' ? 'ring-4 ring-red-300' : '')}><AlertTriangle className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.lowStockCount}</p><p className="text-xs opacity-80">Low Stock</p></button>
              <button onClick={() => setActiveKpi(activeKpi === 'MOVEMENTS' ? 'ALL' : 'MOVEMENTS')} className={'p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg text-left ' + (activeKpi === 'MOVEMENTS' ? 'ring-4 ring-cyan-300' : '')}><Activity className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.movements24h}</p><p className="text-xs opacity-80">Movements (24h)</p></button>
            </div>

            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Live Movements</h2>
              {filteredMovements.length === 0 ? (
                <p className="text-neutral-400">No recent movements</p>
              ) : (
                <div className="space-y-2">
                  {filteredMovements.map((m: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-neutral-800 flex justify-between items-center">
                      <div><p className="font-bold text-white">{m.productName}</p><p className="text-xs text-neutral-400">{m.type}</p></div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{m.quantity} units</span>
                        <button onClick={() => downloadPdf(m.productId)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => deleteMovement(m.id)} disabled={deleting === m.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-50" title="Delete">{deleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}