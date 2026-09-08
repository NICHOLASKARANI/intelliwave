'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Plus, Trash2, Printer, Search, X,
  ArrowLeft, ArrowLeftRight, RefreshCw, CheckCircle2, Sliders, ClipboardList, Layers, Activity, LineChart, PieChart, ShoppingCart, Zap,
  TrendingUp, TrendingDown, Filter, Calendar, DollarSign, Scale, CheckCircle, XCircle
} from 'lucide-react'

export default function CountsPage() {
  const [counts, setCounts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [form, setForm] = useState({ 
    productId: '', countedQuantity: '', countedBy: '', notes: '',
    buyingPrice: '', sellingPrice: ''
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [countsRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/inventory/cycle-counts'),
        fetch('/api/wavecore/inventory/products')
      ])
      setCounts((await countsRes.json()).counts || [])
      setProducts((await productsRes.json()).products || [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const createCount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.productId || !form.countedQuantity) {
      setError('Product and counted quantity required')
      return
    }
    try {
      const selectedProduct = products.find(p => p.id === form.productId)
      const buyingPrice = form.buyingPrice || selectedProduct?.costPrice || 0
      const sellingPrice = form.sellingPrice || selectedProduct?.sellingPrice || 0

      const res = await fetch('/api/wavecore/inventory/cycle-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          countedQuantity: Number(form.countedQuantity),
          buyingPrice: Number(buyingPrice),
          sellingPrice: Number(sellingPrice)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Cycle count created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setForm({ productId: '', countedQuantity: '', countedBy: '', notes: '', buyingPrice: '', sellingPrice: '' })
        setShowForm(false)
        fetchData()
      } else {
        setError(data.error || 'Failed to create count')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteCount = async (id: string) => {
    if (!confirm('Delete this count?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/cycle-counts?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Count deleted!')
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
    window.open('/api/wavecore/inventory/cycle-counts/' + id + '/pdf', '_blank')
  }

  const getBuyingPrice = (c: any) => {
    try {
      const n = JSON.parse(c.notes || '{}')
      return n.buyingPrice || 'N/A'
    } catch {
      return 'N/A'
    }
  }

  const getSellingPrice = (c: any) => {
    try {
      const n = JSON.parse(c.notes || '{}')
      return n.sellingPrice || 'N/A'
    } catch {
      return 'N/A'
    }
  }

  const filtered = counts.filter(c => {
    const matchesSearch = (c.productName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.number || '').toLowerCase().includes(search.toLowerCase())
    const variance = Number(c.variance || 0)
    const matchesKpi = activeKpi === 'ALL' || 
      (activeKpi === 'MATCH' && variance === 0) ||
      (activeKpi === 'VARIANCE' && variance !== 0)
    return matchesSearch && matchesKpi
  })

  const totalCounts = counts.length
  const matchedCounts = counts.filter(c => Number(c.variance || 0) === 0).length
  const varianceCounts = counts.filter(c => Number(c.variance || 0) !== 0).length
  const totalVariance = counts.reduce((s, c) => s + Math.abs(Number(c.variance || 0)), 0)

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
          <Link href="/wavecore-erp/inventory/counts" className="flex items-center gap-3 p-3 rounded-xl bg-cyan-600 text-white font-bold shadow-lg">
            <ClipboardList className="w-5 h-5" /> Counts
          </Link>
          <Link href="/wavecore-erp/inventory/ledger" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Layers className="w-5 h-5" /> Ledger
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-cyan-500" /> Cycle Counts
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Physical stock counting and variance tracking</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2 hover:bg-cyan-700 shadow-lg transition-colors">
              <Plus className="w-4 h-4" /> New Count
            </button>
            <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveKpi(activeKpi === 'ALL' ? 'ALL' : 'ALL')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'ALL' ? 'ring-4 ring-cyan-300' : '')}>
            <ClipboardList className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalCounts}</p>
            <p className="text-xs opacity-80">Total Counts</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'MATCH' ? 'ALL' : 'MATCH')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'MATCH' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{matchedCounts}</p>
            <p className="text-xs opacity-80">Matched</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'VARIANCE' ? 'ALL' : 'VARIANCE')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'VARIANCE' ? 'ring-4 ring-red-300' : '')}>
            <XCircle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{varianceCounts}</p>
            <p className="text-xs opacity-80">With Variance</p>
          </button>
          <button onClick={() => setActiveKpi('ALL')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg text-left transition-all hover:shadow-xl'}>
            <Scale className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalVariance}</p>
            <p className="text-xs opacity-80">Total Variance</p>
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <form onSubmit={createCount} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6 shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg text-white">New Cycle Count</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Product *</label>
                <select value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Counted Quantity *</label>
                <input type="number" value={form.countedQuantity} onChange={(e) => setForm({...form, countedQuantity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Counted By</label>
                <input type="text" value={form.countedBy} onChange={(e) => setForm({...form, countedBy: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Buying Price (KSh)</label>
                <input type="number" value={form.buyingPrice} onChange={(e) => setForm({...form, buyingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Selling Price (KSh)</label>
                <input type="number" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold shadow-lg hover:bg-cyan-700 transition-colors">Create Count</button>
          </form>
        )}

        {/* SEARCH */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Search counts..." />
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No counts recorded</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Number</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Expected</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Counted</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Variance</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Buying</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Selling</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Date</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c.id} className="border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-neutral-400">{c.number || 'N/A'}</td>
                    <td className="p-4 font-bold text-white">{c.productName || 'N/A'}</td>
                    <td className="p-4 text-right text-neutral-300">{c.expectedQuantity || 0}</td>
                    <td className="p-4 text-right font-bold text-white">{c.countedQuantity || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <span className={Number(c.variance) === 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                        {c.variance || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right text-neutral-300">KSh {getBuyingPrice(c)}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {getSellingPrice(c)}</td>
                    <td className="p-4 text-neutral-400 text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(c.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800 transition-colors" title="Download PDF">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCount(c.id)} disabled={deleting === c.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-50 transition-colors" title="Delete">
                          {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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