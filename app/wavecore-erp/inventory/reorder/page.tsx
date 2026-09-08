'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  AlertTriangle, CheckCircle2, DollarSign, ShieldAlert, TrendingDown, Plus, Trash2
} from 'lucide-react'

export default function ReorderPage() {
  const [reorderList, setReorderList] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [deleting, setDeleting] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/reorder')
      const data = await res.json()
      setReorderList(data.reorderList || [])
      setSummary(data.summary || {})
    } catch (err) {
      setError('Failed to load reorder data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const createPO = async (productId: string, quantity: number) => {
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/wavecore/inventory/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Purchase order created!')
        setTimeout(() => setSuccess(''), 3000)
        fetchData()
      } else {
        setError(data.error || 'Failed to create PO')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deletePO = async (id: string) => {
    if (!confirm('Delete this purchase order?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/reorder?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Purchase order deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchData()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/reorder/' + id + '/pdf', '_blank')
  }

  const filtered = reorderList.filter(r => {
    const matchesSearch = (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchesKpi = activeKpi === 'ALL' || 
      (activeKpi === 'CRITICAL' && r.priority === 'CRITICAL') ||
      (activeKpi === 'LOW' && r.priority === 'LOW')
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
          <Link href="/wavecore-erp/inventory/reorder" className="flex items-center gap-3 p-3 rounded-xl bg-orange-600 text-white font-bold shadow-lg">
            <ShoppingCart className="w-5 h-5" /> Reorder
          </Link>
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Zap className="w-5 h-5" /> ATP
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-orange-500" /> Reorder Automation
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Auto-suggest purchase orders when stock is low</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi(activeKpi === 'CRITICAL' ? 'ALL' : 'CRITICAL')} className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left ' + (activeKpi === 'CRITICAL' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.criticalCount || 0}</p>
            <p className="text-xs opacity-80">Critical</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'LOW' ? 'ALL' : 'LOW')} className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg text-left ' + (activeKpi === 'LOW' ? 'ring-4 ring-yellow-300' : '')}>
            <TrendingDown className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.lowCount || 0}</p>
            <p className="text-xs opacity-80">Low Stock</p>
          </button>
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg text-left'}>
            <DollarSign, ShieldAlert className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">KSh {(summary.totalReorderValue || 0).toLocaleString()}</p>
            <p className="text-xs opacity-80">Total Value</p>
          </button>
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left'}>
            <ShoppingCart className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.totalQuantity || 0}</p>
            <p className="text-xs opacity-80">Units to Order</p>
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-orange-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-neutral-400">All products are adequately stocked</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Current</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Min</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Suggested</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Value</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Priority</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4"><p className="font-bold text-white">{r.name}</p><p className="text-xs text-neutral-400">{r.sku}</p></td>
                    <td className="p-4 text-right text-red-400 font-bold">{r.currentStock}</td>
                    <td className="p-4 text-right text-neutral-400">{r.minStock}</td>
                    <td className="p-4 text-right font-bold text-white">{r.suggestedOrderQty}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {Number(r.suggestedOrderValue || 0).toLocaleString()}</td>
                    <td className="p-4"><span className={'px-2 py-1 rounded-full text-xs font-bold ' + (r.priority === 'CRITICAL' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300')}>{r.priority}</span></td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => createPO(r.id, r.suggestedOrderQty)} className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700" title="Create PO">
                          <Plus className="w-3 h-3" /> PO
                        </button>
                        <button onClick={() => downloadPdf(r.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletePO(r.id)} disabled={deleting === r.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-50" title="Delete">
                          {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
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