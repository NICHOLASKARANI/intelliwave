'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Plus, Trash2, Printer, Search, X,
  ArrowLeft, ArrowLeftRight, RefreshCw, CheckCircle2, Sliders, ClipboardList, Layers, Activity, LineChart,
  TrendingUp, TrendingDown, Filter, Calendar, DollarSign, AlertTriangle
} from 'lucide-react'

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [form, setForm] = useState({ 
    productId: '', quantity: '', reason: '', adjustmentType: 'MANUAL',
    buyingPrice: '', sellingPrice: ''
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [adjRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/inventory/adjustments'),
        fetch('/api/wavecore/inventory/products')
      ])
      setAdjustments((await adjRes.json()).adjustments || [])
      setProducts((await productsRes.json()).products || [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const createAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.productId || !form.quantity) {
      setError('Product and quantity required')
      return
    }
    try {
      const selectedProduct = products.find(p => p.id === form.productId)
      const buyingPrice = form.buyingPrice || selectedProduct?.costPrice || 0
      const sellingPrice = form.sellingPrice || selectedProduct?.sellingPrice || 0

      const res = await fetch('/api/wavecore/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          quantity: Number(form.quantity),
          buyingPrice: Number(buyingPrice),
          sellingPrice: Number(sellingPrice)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Adjustment created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setForm({ productId: '', quantity: '', reason: '', adjustmentType: 'MANUAL', buyingPrice: '', sellingPrice: '' })
        setShowForm(false)
        fetchData()
      } else {
        setError(data.error || 'Failed to create adjustment')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteAdjustment = async (id: string) => {
    if (!confirm('Delete this adjustment?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/adjustments?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Adjustment deleted!')
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
    window.open('/api/wavecore/inventory/adjustments/' + id + '/pdf', '_blank')
  }

  const getBuyingPrice = (a: any) => {
    try {
      const n = JSON.parse(a.notes || '{}')
      return n.buyingPrice || 'N/A'
    } catch {
      return 'N/A'
    }
  }

  const getSellingPrice = (a: any) => {
    try {
      const n = JSON.parse(a.notes || '{}')
      return n.sellingPrice || 'N/A'
    } catch {
      return 'N/A'
    }
  }

  const filtered = adjustments.filter(a => {
    const matchesSearch = (a.productName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.adjustmentType || '').toLowerCase().includes(search.toLowerCase())
    const matchesKpi = activeKpi === 'ALL' || a.adjustmentType === activeKpi
    return matchesSearch && matchesKpi
  })

  const totalManual = adjustments.filter(a => a.adjustmentType === 'MANUAL').length
  const totalDamage = adjustments.filter(a => a.adjustmentType === 'DAMAGE').length
  const totalLoss = adjustments.filter(a => a.adjustmentType === 'LOSS').length
  const totalFound = adjustments.filter(a => a.adjustmentType === 'FOUND').length
  const totalExpiry = adjustments.filter(a => a.adjustmentType === 'EXPIRY').length
  const totalQuantity = adjustments.reduce((s, a) => s + Number(a.quantity || 0), 0)

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
          <Link href="/wavecore-erp/inventory/adjustments" className="flex items-center gap-3 p-3 rounded-xl bg-orange-600 text-white font-bold shadow-lg">
            <Sliders className="w-5 h-5" /> Adjustments
          </Link>
          <Link href="/wavecore-erp/inventory/counts" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
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
              <Sliders className="w-6 h-6 text-orange-500" /> Stock Adjustments
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Manage stock corrections and variances</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold flex items-center gap-2 hover:bg-orange-700 shadow-lg transition-colors">
              <Plus className="w-4 h-4" /> New Adjustment
            </button>
            <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button onClick={() => setActiveKpi(activeKpi === 'MANUAL' ? 'ALL' : 'MANUAL')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'MANUAL' ? 'ring-4 ring-slate-300' : '')}>
            <Filter className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalManual}</p>
            <p className="text-xs opacity-80">Manual</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'DAMAGE' ? 'ALL' : 'DAMAGE')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'DAMAGE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalDamage}</p>
            <p className="text-xs opacity-80">Damage</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'LOSS' ? 'ALL' : 'LOSS')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'LOSS' ? 'ring-4 ring-yellow-300' : '')}>
            <TrendingDown className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalLoss}</p>
            <p className="text-xs opacity-80">Loss</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'FOUND' ? 'ALL' : 'FOUND')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'FOUND' ? 'ring-4 ring-green-300' : '')}>
            <TrendingUp className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalFound}</p>
            <p className="text-xs opacity-80">Found</p>
          </button>
          <button onClick={() => setActiveKpi(activeKpi === 'EXPIRY' ? 'ALL' : 'EXPIRY')}
            className={'p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg text-left transition-all hover:shadow-xl ' + (activeKpi === 'EXPIRY' ? 'ring-4 ring-purple-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{totalExpiry}</p>
            <p className="text-xs opacity-80">Expiry</p>
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <form onSubmit={createAdjustment} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6 shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg text-white">New Stock Adjustment</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Product *</label>
                <select value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Quantity (+/-) *</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Adjustment Type</label>
                <select value={form.adjustmentType} onChange={(e) => setForm({...form, adjustmentType: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="MANUAL">Manual</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="LOSS">Loss</option>
                  <option value="FOUND">Found Stock</option>
                  <option value="EXPIRY">Expiry</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Buying Price (KSh)</label>
                <input type="number" value={form.buyingPrice} onChange={(e) => setForm({...form, buyingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Selling Price (KSh)</label>
                <input type="number" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Reason</label>
                <input type="text" value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold shadow-lg hover:bg-orange-700 transition-colors">Create Adjustment</button>
          </form>
        )}

        {/* SEARCH */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Search adjustments..." />
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-orange-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Sliders className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No adjustments recorded</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400 text-sm">Number</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Product</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Qty</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Buying</th>
                  <th className="text-right p-4 text-neutral-400 text-sm">Selling</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Type</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Reason</th>
                  <th className="text-left p-4 text-neutral-400 text-sm">Date</th>
                  <th className="text-center p-4 text-neutral-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any) => (
                  <tr key={a.id} className="border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-neutral-400">{a.number || 'N/A'}</td>
                    <td className="p-4 font-bold text-white">{a.productName || 'N/A'}</td>
                    <td className="p-4 text-right font-bold text-white">{a.quantity || 0}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {getBuyingPrice(a)}</td>
                    <td className="p-4 text-right text-neutral-300">KSh {getSellingPrice(a)}</td>
                    <td className="p-4">
                      <span className={'px-2 py-1 rounded-full text-xs font-bold ' + 
                        (a.adjustmentType === 'DAMAGE' ? 'bg-red-900/50 text-red-300' :
                         a.adjustmentType === 'LOSS' ? 'bg-yellow-900/50 text-yellow-300' :
                         a.adjustmentType === 'FOUND' ? 'bg-green-900/50 text-green-300' :
                         a.adjustmentType === 'EXPIRY' ? 'bg-purple-900/50 text-purple-300' :
                         'bg-slate-700/50 text-slate-300')}>
                        {a.adjustmentType || 'MANUAL'}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-300">{a.reason || 'N/A'}</td>
                    <td className="p-4 text-neutral-400 text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(a.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800 transition-colors" title="Download PDF">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteAdjustment(a.id)} disabled={deleting === a.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800 disabled:opacity-50 transition-colors" title="Delete">
                          {deleting === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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