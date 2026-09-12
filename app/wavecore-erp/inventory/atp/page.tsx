'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Printer, Search, Brain, LineChart, PieChart, ShoppingCart, Zap,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity,
  CheckCircle2, XCircle, Trash2, DollarSign, ShieldAlert, Truck, Boxes
} from 'lucide-react'

export default function AtpPage() {
  const [atpList, setAtpList] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [deleting, setDeleting] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/atp')
      const data = await res.json()
      setAtpList(data.atpList || [])
      setSummary(data.summary || {})
    } catch (err) {
      setError('Failed to load ATP data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm('Delete product ' + name + '?')) return
    setDeleting(id)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/products?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Product deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Delete failed')
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/atp/' + id + '/pdf', '_blank')
  }

  const filtered = atpList.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchesKpi = activeKpi === 'ALL' || 
      (activeKpi === 'CAN' && p.canPromise) ||
      (activeKpi === 'CANNOT' && !p.canPromise)
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
          <Link href="/wavecore-erp/inventory/atp" className="flex items-center gap-3 p-3 rounded-xl bg-cyan-600 text-white font-bold shadow-lg">
            <Zap className="w-5 h-5" /> ATP
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-500" /> Available-to-Promise (ATP)
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Real-time availability for customer orders</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi('CAN')} className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left ' + (activeKpi === 'CAN' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.canPromise || 0}</p>
            <p className="text-xs opacity-80">Can Promise</p>
          </button>
          <button onClick={() => setActiveKpi('CANNOT')} className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left ' + (activeKpi === 'CANNOT' ? 'ring-4 ring-red-300' : '')}>
            <XCircle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.cannotPromise || 0}</p>
            <p className="text-xs opacity-80">Cannot Promise</p>
          </button>
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg text-left'}>
            <Boxes className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.totalAvailable || 0}</p>
            <p className="text-xs opacity-80">Total Available</p>
          </button>
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg text-left'}>
            <Zap className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.totalATP || 0}</p>
            <p className="text-xs opacity-80">Total ATP</p>
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No products</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">On Hand</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Available</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Reserved</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">ATP</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Status</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4"><p className="font-bold text-white">{p.name}</p><p className="text-xs text-neutral-400">{p.sku}</p></td>
                    <td className="p-4 text-right text-white">{p.onHand || 0}</td>
                    <td className="p-4 text-right text-green-400">{p.available || 0}</td>
                    <td className="p-4 text-right text-yellow-400">{p.reserved || 0}</td>
                    <td className="p-4 text-right font-bold text-cyan-400">{p.atpQuantity || 0}</td>
                    <td className="p-4">
                      <span className={'px-2 py-1 rounded-full text-xs font-bold ' + (p.canPromise ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300')}>
                        {p.canPromise ? 'CAN PROMISE' : 'CANNOT PROMISE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteProduct(p.id, p.name)} disabled={deleting === p.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-50" title="Delete">
                          {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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