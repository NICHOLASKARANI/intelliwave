'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart3
} from 'lucide-react'

export default function AbcXyzPage() {
  const [products, setProducts] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/abc-xyz')
      const data = await res.json()
      setProducts(data.products || [])
      setSummary(data.summary || {})
    } catch (err) {
      setError('Failed to load ABC/XYZ analysis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/abc-xyz/' + id + '/pdf', '_blank')
  }

  const filtered = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchesKpi = activeKpi === 'ALL' || p.abcClass === activeKpi || p.xyzClass === activeKpi
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
          <Link href="/wavecore-erp/inventory/forecasting" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <LineChart className="w-5 h-5" /> Forecasting
          </Link>
          <Link href="/wavecore-erp/inventory/abc-xyz" className="flex items-center gap-3 p-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg">
            <PieChart className="w-5 h-5" /> ABC/XYZ
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <PieChart className="w-6 h-6 text-purple-500" /> ABC/XYZ Analysis
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Classify products by value and demand variability</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <button onClick={() => setActiveKpi(activeKpi === 'A' ? 'ALL' : 'A')} className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left ' + (activeKpi === 'A' ? 'ring-4 ring-green-300' : '')}>
            <BarChart3 className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.aClass || 0}</p>
            <p className="text-xs opacity-80">A Class</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'B' ? 'ALL' : 'B')} className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg text-left ' + (activeKpi === 'B' ? 'ring-4 ring-yellow-300' : '')}>
            <BarChart3 className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.bClass || 0}</p>
            <p className="text-xs opacity-80">B Class</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'C' ? 'ALL' : 'C')} className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left ' + (activeKpi === 'C' ? 'ring-4 ring-red-300' : '')}>
            <BarChart3 className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.cClass || 0}</p>
            <p className="text-xs opacity-80">C Class</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'X' ? 'ALL' : 'X')} className={'p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg text-left ' + (activeKpi === 'X' ? 'ring-4 ring-blue-300' : '')}>
            <TrendingUp className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.xClass || 0}</p>
            <p className="text-xs opacity-80">X Class</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'Y' ? 'ALL' : 'Y')} className={'p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-800 text-white shadow-lg text-left ' + (activeKpi === 'Y' ? 'ring-4 ring-orange-300' : '')}>
            <TrendingUp className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.yClass || 0}</p>
            <p className="text-xs opacity-80">Y Class</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'Z' ? 'ALL' : 'Z')} className={'p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg text-left ' + (activeKpi === 'Z' ? 'ring-4 ring-purple-300' : '')}>
            <TrendingDown className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.zClass || 0}</p>
            <p className="text-xs opacity-80">Z Class</p>
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No products classified</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Stock Value</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">ABC</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">XYZ</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">Combined</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Service Level</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">PDF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4"><p className="font-bold text-white">{p.name}</p><p className="text-xs text-neutral-400">{p.sku}</p></td>
                    <td className="p-4 text-right text-white">KSh {Number(p.stockValue || 0).toLocaleString()}</td>
                    <td className="p-4 text-center"><span className={'px-3 py-1 rounded-full text-xs font-bold ' + (p.abcClass === 'A' ? 'bg-green-900/50 text-green-300' : p.abcClass === 'B' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-red-900/50 text-red-300')}>{p.abcClass}</span></td>
                    <td className="p-4 text-center"><span className={'px-3 py-1 rounded-full text-xs font-bold ' + (p.xyzClass === 'X' ? 'bg-blue-900/50 text-blue-300' : p.xyzClass === 'Y' ? 'bg-orange-900/50 text-orange-300' : 'bg-purple-900/50 text-purple-300')}>{p.xyzClass}</span></td>
                    <td className="p-4 text-center"><span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-900/50 text-indigo-300">{p.combinedClass}</span></td>
                    <td className="p-4 text-neutral-300 text-sm">{p.recommendedServiceLevel}</td>
                    <td className="p-4 text-center"><button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800"><Printer className="w-4 h-4" /></button></td>
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