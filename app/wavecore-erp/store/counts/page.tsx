'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Trash2, Search, Package, Printer, CheckCircle2, AlertTriangle, Plus, X, ClipboardList, Scale } from 'lucide-react'

export default function StockCountsPage() {
  const [counts, setCounts] = useState<any[]>([])
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
    expectedQuantity: '',
    actualQuantity: '',
    status: 'PENDING',
    countedBy: '',
    notes: ''
  })

  const fetchCounts = async () => {
    setLoading(true)
    setError('')
    try {
      const [countsRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/store/counts'),
        fetch('/api/wavecore/store')
      ])
      const countsData = await countsRes.json()
      const productsData = await productsRes.json()
      setCounts(countsData.counts || [])
      setStats(countsData.stats || {})
      setProducts(productsData.products || [])
    } catch (err) {
      setError('Failed to load stock counts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  const createCount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.productId || !formData.actualQuantity) {
      setError('Please select a product and enter actual quantity')
      return
    }

    const selectedProduct = products.find(p => p.id === formData.productId)
    const expectedQty = selectedProduct?.stock_level || 0
    
    try {
      const res = await fetch('/api/wavecore/store/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productName: selectedProduct?.name || '',
          expectedQuantity: expectedQty,
          actualQuantity: Number(formData.actualQuantity)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Stock count created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setFormData({
          productId: '',
          productName: '',
          expectedQuantity: '',
          actualQuantity: '',
          status: 'PENDING',
          countedBy: '',
          notes: ''
        })
        setShowForm(false)
        fetchCounts()
      } else {
        setError(data.error || 'Failed to create stock count')
      }
    } catch (err) {
      setError('Network error - failed to create')
    }
  }

  const deleteCount = async (id: string, number: string) => {
    if (!confirm(`Delete stock count "${number}"?`)) return
    setDeleting(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/wavecore/store/counts?id=${encodeURIComponent(id)}`, { 
        method: 'DELETE' 
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Stock count "${number}" deleted successfully`)
        setTimeout(() => setSuccess(''), 3000)
        fetchCounts()
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
      setError('Stock count ID missing')
      return
    }
    window.open(`/api/wavecore/store/counts/${id}/pdf`, '_blank')
  }

  const filtered = counts.filter(c => 
    (c.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.countedBy || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalCounts = Number(stats.totalCounts || 0)
  const pendingCounts = Number(stats.pendingCounts || 0)
  const completedCounts = Number(stats.completedCounts || 0)
  const totalVariance = Number(stats.totalVariance || 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Counts</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-cyan-500" /> Stock Counts ({totalCounts})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2 hover:bg-cyan-700 transition-colors">
            <Plus className="w-4 h-4" /> New Count
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {showForm && (
          <form onSubmit={createCount} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><Scale className="w-5 h-5 text-cyan-500" /> New Stock Count</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <select value={formData.productId} 
                  onChange={(e) => {
                    const selected = products.find(p => p.id === e.target.value)
                    setFormData({...formData, productId: e.target.value, expectedQuantity: selected?.stock_level?.toString() || ''})
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current: {p.stock_level || 0})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Actual Quantity</label>
                <input type="number" value={formData.actualQuantity}
                  onChange={(e) => setFormData({...formData, actualQuantity: e.target.value})}
                  placeholder="Enter actual count" min="0"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Counted By</label>
                <input type="text" value={formData.countedBy}
                  onChange={(e) => setFormData({...formData, countedBy: e.target.value})}
                  placeholder="Name of person counting"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional notes" rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors">
              Create Stock Count
            </button>
          </form>
        )}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-cyan-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }}>
            <ClipboardList className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalCounts}</p>
            <p className="text-xs opacity-80">Total Counts</p>
          </button>
          <button onClick={() => setActiveView('pending')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'pending' ? 'ring-4 ring-yellow-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingCounts}</p>
            <p className="text-xs opacity-80">Pending</p>
          </button>
          <button onClick={() => setActiveView('completed')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'completed' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedCounts}</p>
            <p className="text-xs opacity-80">Completed</p>
          </button>
          <button onClick={() => setActiveView('variance')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'variance' ? 'ring-4 ring-red-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            <Scale className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalVariance}</p>
            <p className="text-xs opacity-80">Total Variance</p>
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Search stock counts..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No stock counts found</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold">
              Create First Count
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Count #</th>
                  <th className="text-left p-4 text-sm">Product</th>
                  <th className="text-right p-4 text-sm">Expected</th>
                  <th className="text-right p-4 text-sm">Actual</th>
                  <th className="text-right p-4 text-sm">Variance</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-left p-4 text-sm">Counted By</th>
                  <th className="text-center p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .filter(c => {
                    if (activeView === 'pending') return c.status === 'PENDING'
                    if (activeView === 'completed') return c.status === 'COMPLETED'
                    if (activeView === 'variance') return Math.abs(Number(c.variance || 0)) > 0
                    return true
                  })
                  .map((count) => {
                    const variance = Number(count.variance || 0)
                    return (
                      <tr key={count.id} className="border-t hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <td className="p-4 font-mono text-sm">{count.number}</td>
                        <td className="p-4">
                          <p className="font-bold">{count.productName || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{count.sku || ''}</p>
                        </td>
                        <td className="p-4 text-right">{count.expectedQuantity || 0}</td>
                        <td className="p-4 text-right font-bold">{count.actualQuantity || 0}</td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${
                            variance === 0 ? 'text-green-600' :
                            variance > 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {variance > 0 ? '+' : ''}{variance}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            count.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {count.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm">{count.countedBy || 'N/A'}</td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => downloadPdf(count.id)} 
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Download PDF">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteCount(count.id, count.number)}
                              disabled={deleting === count.id}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                              title="Delete stock count">
                              {deleting === count.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}