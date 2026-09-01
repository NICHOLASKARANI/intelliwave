'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Trash2, Search, Package, Printer, CheckCircle2, AlertTriangle, ArrowRight, Plus, X, Truck } from 'lucide-react'

export default function TransferPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
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
    productName: '',
    fromLocation: 'Main Store',
    toLocation: 'Warehouse',
    quantity: '',
    notes: ''
  })

  const fetchTransfers = async () => {
    setLoading(true)
    setError('')
    try {
      const [transferRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/store/transfer'),
        fetch('/api/wavecore/store')
      ])
      const transferData = await transferRes.json()
      const productsData = await productsRes.json()
      setTransfers(transferData.transfers || [])
      setStats(transferData.stats || {})
      setProducts(productsData.products || [])
    } catch (err) {
      setError('Failed to load transfers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [])

  const createTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.productId || !formData.quantity || Number(formData.quantity) <= 0) {
      setError('Please select a product and enter valid quantity')
      return
    }

    const selectedProduct = products.find(p => p.id === formData.productId)
    
    try {
      const res = await fetch('/api/wavecore/store/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productName: selectedProduct?.name || '',
          quantity: Number(formData.quantity)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Transfer created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setFormData({
          productId: '',
          productName: '',
          fromLocation: 'Main Store',
          toLocation: 'Warehouse',
          quantity: '',
          notes: ''
        })
        setShowForm(false)
        fetchTransfers()
      } else {
        setError(data.error || 'Failed to create transfer')
      }
    } catch (err) {
      setError('Network error - failed to create')
    }
  }

  const deleteTransfer = async (id: string, number: string) => {
    if (!confirm(`Delete transfer "${number}"?`)) return
    setDeleting(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/wavecore/store/transfer?id=${encodeURIComponent(id)}`, { 
        method: 'DELETE' 
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Transfer "${number}" deleted successfully`)
        setTimeout(() => setSuccess(''), 3000)
        fetchTransfers()
      } else {
        setError(data.error || 'Delete failed')
      }
    } catch (err) {
      setError('Network error - delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    if (!id) {
      setError('Transfer ID missing')
      return
    }
    window.open(`/api/wavecore/store/transfer/${id}/pdf`, '_blank')
  }

  const filtered = transfers.filter(t => 
    (t.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.fromLocation || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.toLocation || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalTransfers = Number(stats.totalTransfers || 0)
  const pendingTransfers = Number(stats.pendingTransfers || 0)
  const completedTransfers = Number(stats.completedTransfers || 0)
  const totalQuantity = Number(stats.totalQuantity || 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Transfer</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-purple-500" /> Stock Transfer ({totalTransfers})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4" /> New Transfer
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createTransfer} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><ArrowRight className="w-5 h-5 text-purple-500" /> New Transfer</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <select value={formData.productId} 
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <input type="number" value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="Enter quantity" min="1"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">From Location</label>
                <input type="text" value={formData.fromLocation}
                  onChange={(e) => setFormData({...formData, fromLocation: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">To Location</label>
                <input type="text" value={formData.toLocation}
                  onChange={(e) => setFormData({...formData, toLocation: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional notes" rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors">
              Create Transfer
            </button>
          </form>
        )}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-purple-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Truck className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalTransfers}</p>
            <p className="text-xs opacity-80">Total Transfers</p>
          </button>
          <button onClick={() => setActiveView('pending')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'pending' ? 'ring-4 ring-yellow-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingTransfers}</p>
            <p className="text-xs opacity-80">Pending</p>
          </button>
          <button onClick={() => setActiveView('completed')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'completed' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedTransfers}</p>
            <p className="text-xs opacity-80">Completed</p>
          </button>
          <button onClick={() => setActiveView('quantity')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'quantity' ? 'ring-4 ring-blue-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <Package className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalQuantity}</p>
            <p className="text-xs opacity-80">Total Quantity</p>
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Search transfers..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No transfers found</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold">
              Create First Transfer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered
              .filter(t => {
                if (activeView === 'pending') return t.status === 'PENDING'
                if (activeView === 'completed') return t.status === 'COMPLETED'
                if (activeView === 'quantity') return Number(t.quantity || 0) > 0
                return true
              })
              .map((transfer) => (
                <div key={transfer.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-mono font-bold">{transfer.number}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          transfer.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {transfer.status}
                        </span>
                      </div>
                      <p className="font-bold text-lg">{transfer.productName || 'N/A'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <span>{transfer.fromLocation || 'N/A'}</span>
                        <ArrowRight className="w-4 h-4" />
                        <span>{transfer.toLocation || 'N/A'}</span>
                      </div>
                      <p className="text-sm mt-1">
                        Quantity: <span className="font-bold">{transfer.quantity || 0} units</span>
                      </p>
                      {transfer.notes && <p className="text-sm text-muted-foreground mt-1">Notes: {transfer.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadPdf(transfer.id)} 
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Download PDF">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTransfer(transfer.id, transfer.number)}
                        disabled={deleting === transfer.id}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        title="Delete transfer">
                        {deleting === transfer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}