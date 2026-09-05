'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Plus, Trash2, Printer, Search, X,
  ArrowLeft, ArrowLeftRight, RefreshCw, CheckCircle2, Sliders, ClipboardList, Layers, Activity
} from 'lucide-react'

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [form, setForm] = useState({ productId: '', quantity: '', movementType: 'IN', toLocation: '', fromLocation: '' })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [movementsRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/inventory/movements'),
        fetch('/api/wavecore/inventory/products')
      ])
      setMovements((await movementsRes.json()).movements || [])
      setProducts((await productsRes.json()).products || [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const createMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.productId || !form.quantity || Number(form.quantity) <= 0) {
      setError('Product and valid quantity required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Movement recorded!')
        setTimeout(() => setSuccess(''), 3000)
        setForm({ productId: '', quantity: '', movementType: 'IN', toLocation: '', fromLocation: '' })
        setShowForm(false)
        fetchData()
      } else {
        setError(data.error || 'Failed to record movement')
      }
    } catch (err) {
      setError('Network error')
    }
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

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/movements/' + id + '/pdf', '_blank')
  }

  const filtered = movements.filter(m => 
    (m.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.type || '').toLowerCase().includes(search.toLowerCase())
  )

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
          <Link href="/wavecore-erp/inventory/movements" className="flex items-center gap-3 p-3 rounded-xl bg-green-600 text-white font-bold">
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
        </nav>
      </div>

      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-green-500" /> Stock Movements ({movements.length})
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Record stock in and out</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg">
              <Plus className="w-4 h-4" /> Record Movement
            </button>
            <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createMovement} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg text-white">Stock Movement</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Product *</label>
                <select value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Quantity *</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Movement Type</label>
                <select value={form.movementType} onChange={(e) => setForm({...form, movementType: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">From Location</label>
                <input type="text" value={form.fromLocation} onChange={(e) => setForm({...form, fromLocation: e.target.value})} placeholder="e.g. Main Store" className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">To Location</label>
                <input type="text" value={form.toLocation} onChange={(e) => setForm({...form, toLocation: e.target.value})} placeholder="e.g. Warehouse" className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700">Record Movement</button>
          </form>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Search movements..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No movements recorded</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400">Type</th>
                  <th className="text-left p-4 text-neutral-400">Product</th>
                  <th className="text-right p-4 text-neutral-400">Qty</th>
                  <th className="text-left p-4 text-neutral-400">Date</th>
                  <th className="text-center p-4 text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m: any) => (
                  <tr key={m.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-blue-900/50 text-blue-300">{m.type || 'MOVEMENT'}</span></td>
                    <td className="p-4 font-bold text-white">{m.productName || 'N/A'}</td>
                    <td className="p-4 text-right font-bold text-white">{m.quantity || 0}</td>
                    <td className="p-4 text-neutral-400 text-sm">{new Date(m.date || m.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(m.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMovement(m.id)} disabled={deleting === m.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                          {deleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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