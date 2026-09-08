'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity, LineChart, PieChart, ShoppingCart, Zap,
  TrendingUp, TrendingDown, Calendar, DollarSign, ShieldAlert, Truck, ArrowRight, ArrowDown, Database
} from 'lucide-react'

export default function LedgerPage() {
  const [ledger, setLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')

  const fetchLedger = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/ledger')
      const data = await res.json()
      setLedger(data.ledger || [])
    } catch (err) {
      setError('Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLedger() }, [])

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/ledger/' + id + '/pdf', '_blank')
  }

  const filtered = ledger.filter(l => {
    const matchesSearch = (l.productName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.transactionId || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.transactionType || '').toLowerCase().includes(search.toLowerCase())
    const matchesKpi = activeKpi === 'ALL' || 
      (activeKpi === 'IN' && Number(l.quantity) > 0) ||
      (activeKpi === 'OUT' && Number(l.quantity) < 0)
    return matchesSearch && matchesKpi
  })

  const totalEntries = ledger.length
  const totalIn = ledger.filter(l => Number(l.quantity) > 0).reduce((s, l) => s + Number(l.quantity || 0), 0)
  const totalOut = ledger.filter(l => Number(l.quantity) < 0).reduce((s, l) => s + Math.abs(Number(l.quantity || 0)), 0)
  const netChange = totalIn - totalOut

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Dark Sidebar */}
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
          <Link href="/wavecore-erp/inventory/ledger" className="flex items-center gap-3 p-3 rounded-xl bg-yellow-600 text-white font-bold shadow-lg">
            <Layers className="w-5 h-5" /> Ledger
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-yellow-500" /> Stock Ledger
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Immutable transaction history</p>
          </div>
          <button onClick={fetchLedger} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi('ALL')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'ALL' ? 'ring-4 ring-yellow-300' : '')}>
            <Database className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalEntries}</p>
            <p className="text-xs opacity-80">Total Entries</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'IN' ? 'ALL' : 'IN')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'IN' ? 'ring-4 ring-green-300' : '')}>
            <ArrowDown className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalIn}</p>
            <p className="text-xs opacity-80">Total Stock In</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'OUT' ? 'ALL' : 'OUT')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'OUT' ? 'ring-4 ring-red-300' : '')}>
            <ArrowRight className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalOut}</p>
            <p className="text-xs opacity-80">Total Stock Out</p>
          </button>
          <button onClick={() => setActiveKpi('ALL')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg text-left transition-all hover:shadow-xl'}>
            <TrendingUp className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{netChange}</p>
            <p className="text-xs opacity-80">Net Change</p>
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Search ledger by product, transaction ID, or type..." />
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-yellow-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No ledger entries yet</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Transaction</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Qty</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Before</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">After</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Type</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Date</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l: any) => (
                  <tr key={l.id} className="border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-neutral-400">{l.transactionId || 'N/A'}</td>
                    <td className="p-4 font-bold text-white">{l.productName || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <span className={Number(l.quantity) >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                        {l.quantity || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right text-neutral-400">{l.beforeQuantity || 0}</td>
                    <td className="p-4 text-right text-neutral-400">{l.afterQuantity || 0}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-900/50 text-green-300 font-bold">
                        {l.transactionType || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-400 text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => downloadPdf(l.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800 transition-colors" title="Download PDF">
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
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