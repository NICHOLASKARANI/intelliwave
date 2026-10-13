'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Truck, Loader2, Plus, Trash2, X, RefreshCw, Search,
  CheckCircle2, AlertTriangle, ArrowRight, Printer, Download
} from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface StockLocation {
  id: string
  name: string
  code: string
  warehouseId: string
  warehouseName: string
}

interface Product {
  id: string
  name: string
  sku: string
  stock_level?: number
}

export default function TransferPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<StockLocation[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleting, setDeleting] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeView, setActiveView] = useState('all')

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    fromLocationId: '',
    toLocationId: '',
    notes: '',
  })

  const fetchAll = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setError('')
    try {
      const [transferRes, productsRes] = await Promise.all([
        authedFetch('/api/wavecore/store/transfer'),
        authedFetch('/api/wavecore/store'),
      ])
      const transferData = await transferRes.json()
      const productsData = await productsRes.json()
      setTransfers(transferData.transfers || [])
      setStats(transferData.stats || {})
      setLocations(transferData.locations || [])
      setProducts(productsData.products || [])
    } catch {
      setError('Failed to load transfers')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    const t = setInterval(() => { fetchAll({ silent: true }) }, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const createTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!formData.productId) { setError('Select a product'); return }
    if (!formData.fromLocationId) { setError('Select a source location'); return }
    if (!formData.toLocationId) { setError('Select a destination location'); return }
    if (formData.fromLocationId === formData.toLocationId) { setError('Source and destination must be different'); return }
    if (!formData.quantity || Number(formData.quantity) <= 0) { setError('Enter a valid quantity'); return }

    try {
      const res = await authedFetch('/api/wavecore/store/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          fromLocationId: formData.fromLocationId,
          toLocationId: formData.toLocationId,
          quantity: Number(formData.quantity),
          notes: formData.notes,
        }),
      })
      const data = await res.json()
      if (res.ok && data.transfer) {
        flash('Transfer completed — stock moved')
        setFormData({ productId: '', quantity: '', fromLocationId: '', toLocationId: '', notes: '' })
        setShowForm(false)
        fetchAll()
      } else {
        setError(data.error || 'Failed to create transfer')
      }
    } catch {
      setError('Network error — transfer failed')
    }
  }

  const deleteTransfer = async (id: string, number: string) => {
    if (!confirm(`Delete transfer "${number}"? Stock movement is not reversed.`)) return
    setDeleting(id)
    try {
      const res = await authedFetch(`/api/wavecore/store/transfer?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) { flash('Transfer record deleted'); fetchAll() }
    } finally {
      setDeleting('')
    }
  }

  const printReport = () => window.print()

  const filtered = transfers.filter(t => {
    const q = search.toLowerCase()
    const matches =
      (t.productName || '').toLowerCase().includes(q) ||
      (t.fromLocation || '').toLowerCase().includes(q) ||
      (t.toLocation || '').toLowerCase().includes(q) ||
      (t.number || '').toLowerCase().includes(q)
    if (activeView === 'pending') return matches && t.status === 'PENDING'
    if (activeView === 'completed') return matches && t.status === 'COMPLETED'
    return matches
  })

  const totalTransfers = stats.totalTransfers || transfers.length
  const pendingTransfers = stats.pendingTransfers || 0
  const completedTransfers = stats.completedTransfers || 0

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b print:hidden">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Transfers</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Print-only header */}
        <div className="hidden print:flex items-center gap-4 mb-6 pb-4 border-b-2 border-neutral-800">
          <img src="/api/wavecore/organization/logo" alt="Logo" className="h-16 w-auto object-contain" />
          <div>
            <p className="text-xl font-bold">Stock Transfers</p>
            <p className="text-xs text-neutral-500">Generated {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="w-7 h-7 text-purple-500" /> Stock Transfers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Move stock between locations · Real-time</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => fetchAll()} className="px-4 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 font-medium flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={printReport} className="px-4 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 font-medium flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Transfer
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-2 print:hidden"><AlertTriangle className="w-4 h-4" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 flex items-center gap-2 print:hidden"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        {/* Create form */}
        {showForm && (
          <form onSubmit={createTransfer} className="mb-6 p-6 rounded-2xl border bg-white dark:bg-neutral-900 print:hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">New Transfer</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.sku || '—'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <input type="number" min="1" value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">From Location</label>
                <select value={formData.fromLocationId}
                  onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select source...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.warehouseName} · {l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">To Location</label>
                <select value={formData.toLocationId}
                  onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select destination...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.warehouseName} · {l.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <textarea rows={2} value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>
            {locations.length < 2 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                You need at least two locations to transfer stock. Add shops under Warehouse settings.
              </div>
            )}
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700">
              Move Stock
            </button>
          </form>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={'p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ' + (activeView === 'all' ? 'ring-4 ring-purple-300' : '')}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Truck className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalTransfers}</p>
            <p className="text-xs opacity-80">Total Transfers</p>
          </button>
          <button onClick={() => setActiveView('pending')}
            className={'p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ' + (activeView === 'pending' ? 'ring-4 ring-amber-300' : '')}
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingTransfers}</p>
            <p className="text-xs opacity-80">Pending</p>
          </button>
          <button onClick={() => setActiveView('completed')}
            className={'p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ' + (activeView === 'completed' ? 'ring-4 ring-green-300' : '')}
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedTransfers}</p>
            <p className="text-xs opacity-80">Completed</p>
          </button>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <ArrowRight className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground">Locations</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 print:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transfers..."
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full bg-white dark:bg-neutral-900" />
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No transfers</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4">#</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4 text-right">Qty</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="p-4 font-mono text-xs">{t.number || '—'}</td>
                    <td className="p-4 font-medium">{t.productName || '—'}</td>
                    <td className="p-4">{t.fromLocation || '—'}</td>
                    <td className="p-4">{t.toLocation || '—'}</td>
                    <td className="p-4 text-right font-bold">{t.quantity || 0}</td>
                    <td className="p-4">
                      <span className={'px-2 py-1 rounded-full text-xs font-bold ' +
                        (t.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                         t.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                         'bg-neutral-100 text-neutral-700')}>
                        {t.status || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="p-4 print:hidden">
                      <button onClick={() => deleteTransfer(t.id, t.number || t.id)} disabled={deleting === t.id}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                        {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}