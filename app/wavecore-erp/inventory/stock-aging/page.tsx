'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap, DollarSign, ShieldAlert, Clock,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  CheckCircle2, AlertTriangle, Trash2
} from 'lucide-react'

export default function StockAgingPage() {
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
      const res = await fetch('/api/wavecore/inventory/stock-aging')
      const data = await res.json()
      setProducts(data.products || [])
      setSummary(data.summary || {})
    } catch (err) {
      setError('Failed to load aging report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/stock-aging/' + id + '/pdf', '_blank')
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
      (activeKpi === 'HEALTHY' && p.daysInInventory <= 30) ||
      (activeKpi === 'SLOW' && p.daysInInventory > 90 && p.daysInInventory <= 180) ||
      (activeKpi === 'DEAD' && p.daysInInventory > 180)
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
          <Link href="/wavecore-erp/inventory/stock-aging" className="flex items-center gap-3 p-3 rounded-xl bg-amber-600 text-white font-bold shadow-lg"><Clock className="w-5 h-5" /> Stock Aging</Link>
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><Zap className="w-5 h-5" /> ATP</Link>
          <Link href="/wavecore-erp/inventory/valuation" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><DollarSign className="w-5 h-5" /> Valuation</Link>
          <Link href="/wavecore-erp/inventory/anomalies" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white"><ShieldAlert className="w-5 h-5" /> Anomalies</Link>
        </nav>
      </div>
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Clock className="w-6 h-6 text-amber-500" /> Stock Aging Report</h1>
            <p className="text-sm text-neutral-400 mt-1">Track how long inventory has been sitting</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi(activeKpi === 'HEALTHY' ? 'ALL' : 'HEALTHY')} className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left ' + (activeKpi === 'HEALTHY' ? 'ring-4 ring-green-300' : '')}><CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.bucket0to30 || 0}</p><p className="text-xs">0-30 days</p></button>
          <button onClick={() => setActiveKpi(activeKpi === 'SLOW' ? 'ALL' : 'SLOW')} className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg text-left ' + (activeKpi === 'SLOW' ? 'ring-4 ring-yellow-300' : '')}><Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.slowMoving || 0}</p><p className="text-xs">Slow Moving</p></button>
          <button onClick={() => setActiveKpi(activeKpi === 'DEAD' ? 'ALL' : 'DEAD')} className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left ' + (activeKpi === 'DEAD' ? 'ring-4 ring-red-300' : '')}><AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.deadStock || 0}</p><p className="text-xs">Dead Stock</p></button>
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg text-left'}><DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">KSh {(summary.totalValue || 0).toLocaleString()}</p><p className="text-xs">Total Value</p></button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Search products..." /></div>
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500" /></div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800"><tr><th className="text-left p-4">Product</th><th className="text-right p-4">Stock</th><th className="text-right p-4">Days</th><th className="text-right p-4">Cost</th><th className="text-right p-4">Value</th><th className="text-left p-4">Status</th><th className="text-center p-4">Actions</th></tr></thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4"><p className="font-bold text-white">{p.name}</p><p className="text-xs text-neutral-400">{p.sku}</p></td>
                    <td className="p-4 text-right text-white">{p.currentStock}</td>
                    <td className="p-4 text-right"><span className={p.daysInInventory > 180 ? 'text-red-400 font-bold' : p.daysInInventory > 90 ? 'text-yellow-400 font-bold' : 'text-green-400 font-bold'}>{p.daysInInventory}</span></td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(p.costPrice || 0).toLocaleString()}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(p.totalCost || 0).toLocaleString()}</td>
                    <td className="p-4"><span className={'px-2 py-1 rounded-full text-xs font-bold ' + (p.daysInInventory > 180 ? 'bg-red-900/50 text-red-300' : p.daysInInventory > 90 ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300')}>{p.daysInInventory > 180 ? 'DEAD' : p.daysInInventory > 90 ? 'SLOW' : 'HEALTHY'}</span></td>
                    <td className="p-4"><div className="flex gap-2 justify-center"><button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button><button onClick={() => deleteProduct(p.id, p.name)} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete"><Trash2 className="w-4 h-4" /></button></div></td>
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