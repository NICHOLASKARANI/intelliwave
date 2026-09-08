'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap, DollarSign,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  TrendingUp, CheckCircle2, BarChart3, Trash2
} from 'lucide-react'

export default function ValuationPage() {
  const [products, setProducts] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('WEIGHTED_AVERAGE')
  const [activeKpi, setActiveKpi] = useState('ALL')

  const fetchData = async (m?: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/valuation?method=' + (m || method))
      const data = await res.json()
      setProducts(data.products || [])
      setSummary(data.summary || {})
    } catch (err) {
      setError('Failed to load valuation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/valuation/' + id + '/pdf', '_blank')
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm('Delete product ' + name + '?')) return
    try {
      const res = await fetch('/api/wavecore/inventory/products?id=' + id, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) {
      setError('Delete failed')
    }
  }

  const filtered = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchesKpi = activeKpi === 'ALL' ||
      (activeKpi === 'UNITS' && Number(p.currentStock || 0) > 0) ||
      (activeKpi === 'VALUE' && Number(p.totalCost || 0) > 0) ||
      (activeKpi === 'PROFIT' && (Number(p.totalSellingValue || 0) - Number(p.totalCost || 0)) > 0)
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
          <Link href="/wavecore-erp/inventory/abc-xyz" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <PieChart className="w-5 h-5" /> ABC/XYZ
          </Link>
          <Link href="/wavecore-erp/inventory/reorder" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ShoppingCart className="w-5 h-5" /> Reorder
          </Link>
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Zap className="w-5 h-5" /> ATP
          </Link>
          <Link href="/wavecore-erp/inventory/valuation" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg">
            <DollarSign className="w-5 h-5" /> Valuation
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" /> Inventory Valuation
            </h1>
            <p className="text-sm text-neutral-400 mt-1">FIFO, Weighted Average, Standard Cost methods</p>
          </div>
          <div className="flex gap-2">
            <select value={method} onChange={(e) => { setMethod(e.target.value); fetchData(e.target.value) }} className="px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
              <option value="WEIGHTED_AVERAGE">Weighted Average</option>
              <option value="FIFO">FIFO</option>
              <option value="STANDARD_COST">Standard Cost</option>
            </select>
            
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi(activeKpi === "ALL" ? "ALL" : "ALL")} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 text-white shadow-lg text-left">
            <BarChart3 className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.totalProducts || 0}</p>
            <p className="text-xs opacity-80">Products</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === "UNITS" ? "ALL" : "UNITS")} className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg text-left">
            <Package className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.totalUnits || 0}</p>
            <p className="text-xs opacity-80">Total Units</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === "VALUE" ? "ALL" : "VALUE")} className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-teal-800 text-white shadow-lg text-left">
            <DollarSign className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">KSh {(summary.totalValue || 0).toLocaleString()}</p>
            <p className="text-xs opacity-80">Cost Value</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === "PROFIT" ? "ALL" : "PROFIT")} className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-700 text-white shadow-lg text-left">
            <TrendingUp className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">KSh {(summary.potentialProfit || 0).toLocaleString()}</p>
            <p className="text-xs opacity-80">Potential Profit</p>
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-emerald-500" /></div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Stock</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Cost Price</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Selling Price</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Total Cost</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Selling Value</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Profit</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4"><p className="font-bold text-white">{p.name}</p><p className="text-xs text-neutral-400">{p.sku}</p></td>
                    <td className="p-4 text-right text-white">{p.currentStock}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(p.costPrice || 0).toLocaleString()}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(p.sellingPrice || 0).toLocaleString()}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(p.totalCost || 0).toLocaleString()}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(p.totalSellingValue || 0).toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-emerald-400">KSh {(Number(p.totalSellingValue || 0) - Number(p.totalCost || 0)).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(p.id, p.name)} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
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