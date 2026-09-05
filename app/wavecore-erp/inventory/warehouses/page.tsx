'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Plus, Trash2, Printer, Search, X,
  ArrowLeft, RefreshCw, CheckCircle2, MapPin
} from 'lucide-react'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', country: '', locationName: '', locationCode: '', locationsCount: '1', initialStock: '', productId: '', sellingPrice: '' })

  const fetchWarehouses = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/warehouses')
      const data = await res.json()
      setWarehouses(data.warehouses || [])
    } catch (err) {
      setError('Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.name) {
      setError('Warehouse name is required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Warehouse created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setForm({ name: '', code: '', address: '', city: '', country: '', locationName: '', locationCode: '', locationsCount: '1', initialStock: '', productId: '', sellingPrice: '' })
        setShowForm(false)
        fetchWarehouses()
      } else {
        setError(data.error || 'Failed to create warehouse')
        console.error('Create warehouse error:', data)
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteWarehouse = async (id: string, name: string) => {
    if (!confirm('Delete warehouse "' + name + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/warehouses?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Warehouse deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchWarehouses()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open('/api/wavecore/inventory/warehouses/' + id + '/pdf', '_blank')
  }

  const filtered = warehouses.filter(w => 
    (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.city || '').toLowerCase().includes(search.toLowerCase())
  )

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
            <ArrowLeft className="w-5 h-5" /> Back to Inventory
          </Link>
          <Link href="/wavecore-erp/inventory/products" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Package className="w-5 h-5" /> Products
          </Link>
          <Link href="/wavecore-erp/inventory/warehouses" className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white font-bold">
            <Warehouse className="w-5 h-5" /> Warehouses
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-purple-500" /> Warehouses ({warehouses.length})
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Manage your warehouse locations</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg">
              <Plus className="w-4 h-4" /> Add Warehouse
            </button>
            <button onClick={fetchWarehouses}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createWarehouse} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg text-white">New Warehouse</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">City</label>
                <input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Country</label>
                <input type="text" value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Location Name</label>
                <input type="text" value={form.locationName} onChange={(e) => setForm({...form, locationName: e.target.value})} placeholder="e.g. Main Storage" className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Number of Locations</label>
                <input type="number" value={form.locationsCount} onChange={(e) => setForm({...form, locationsCount: e.target.value})} min="1" className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Location Code</label>
                <input type="text" value={form.locationCode} onChange={(e) => setForm({...form, locationCode: e.target.value})} placeholder="e.g. LOC-001" className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Product (for stock)</label>
                <select value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select product...</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Selling Price (KSh)</label>
                <input type="number" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-neutral-400">Initial Stock</label>
                <input type="number" value={form.initialStock} onChange={(e) => setForm({...form, initialStock: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold shadow-lg hover:bg-purple-700">Create Warehouse</button>
          </form>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Search warehouses..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No warehouses found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((wh: any) => (
              <div key={wh.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg text-white">{wh.name}</p>
                    <p className="text-xs text-neutral-400">{wh.code || 'No code'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadPdf(wh.id)} className="p-2 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteWarehouse(wh.id, wh.name)} disabled={deleting === wh.id} className="p-2 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                      {deleting === wh.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {wh.address || 'No address'}{wh.city ? ', ' + wh.city : ''}{wh.country ? ', ' + wh.country : ''}
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-neutral-400">Locations: <b className="text-white">{wh.locationCount || 0}</b></span>
                  <span className="text-neutral-400">Stock: <b className="text-white">{wh.totalStock || 0}</b></span>
                </div>
                <div className="text-sm mt-1 text-neutral-400">
                  Value: <b className="text-purple-300">KSh {(wh.stockValue || 0).toLocaleString()}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}