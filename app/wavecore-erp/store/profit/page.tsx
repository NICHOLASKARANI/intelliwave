'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Trash2, Search, Package, Printer, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, DollarSign, BarChart3, Percent } from 'lucide-react'

export default function ProfitPage() {
  const [products, setProducts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleting, setDeleting] = useState('')
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState('all')

  const fetchProfit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/store/profit')
      const data = await res.json()
      setProducts(data.products || [])
      setStats(data.stats || {})
    } catch (err) {
      setError('Failed to load profit data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfit()
  }, [])

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"?`)) return
    setDeleting(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/wavecore/store?id=${encodeURIComponent(id)}`, { 
        method: 'DELETE' 
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Product "${name}" deleted successfully`)
        setTimeout(() => setSuccess(''), 3000)
        fetchProfit()
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
      setError('Product ID missing')
      return
    }
    window.open(`/api/wavecore/store/profit/${id}/pdf`, '_blank')
  }

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPotentialProfit = Number(stats.totalPotentialProfit || 0)
  const profitMargin = Number(stats.profitMargin || 0)
  const highProfitProducts = Number(stats.highProfitProducts || 0)
  const lowProfitProducts = Number(stats.lowProfitProducts || 0)
  const totalProducts = Number(stats.totalProducts || 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Profit Analysis</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" /> Profit Analysis ({totalProducts})
          </h1>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <Package className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-xs opacity-80">Total Products</p>
          </button>
          <button onClick={() => setActiveView('profit')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'profit' ? 'ring-4 ring-emerald-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {totalPotentialProfit.toLocaleString()}</p>
            <p className="text-xs opacity-80">Potential Profit</p>
          </button>
          <button onClick={() => setActiveView('high')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'high' ? 'ring-4 ring-blue-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{highProfitProducts}</p>
            <p className="text-xs opacity-80">High Margin (&gt;30%)</p>
          </button>
          <button onClick={() => setActiveView('low')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'low' ? 'ring-4 ring-red-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            <TrendingDown className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{lowProfitProducts}</p>
            <p className="text-xs opacity-80">Low Margin (&lt;10%)</p>
          </button>
        </div>

        {/* Profit Margin Bar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-500" /> Overall Profit Margin
            </h2>
            <span className="text-2xl font-bold text-green-600">{profitMargin.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(profitMargin, 100)}%` }}
            />
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Search products by name, SKU, or category..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Product</th>
                  <th className="text-left p-4 text-sm">SKU</th>
                  <th className="text-right p-4 text-sm">Cost Price</th>
                  <th className="text-right p-4 text-sm">Selling Price</th>
                  <th className="text-right p-4 text-sm">Profit/Unit</th>
                  <th className="text-right p-4 text-sm">Margin</th>
                  <th className="text-right p-4 text-sm">Potential Profit</th>
                  <th className="text-center p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .filter(p => {
                    const margin = p.sellingPrice > 0 ? ((Number(p.sellingPrice) - Number(p.costPrice || 0)) / Number(p.sellingPrice)) * 100 : 0
                    if (activeView === 'profit') return Number(p.potentialProfit || 0) > 0
                    if (activeView === 'high') return margin > 30
                    if (activeView === 'low') return margin < 10
                    return true
                  })
                  .map((product) => {
                    const costPrice = Number(product.costPrice || 0)
                    const sellingPrice = Number(product.sellingPrice || 0)
                    const profitPerUnit = Number(product.profitPerUnit || sellingPrice - costPrice)
                    const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0
                    const potentialProfit = Number(product.potentialProfit || profitPerUnit * Number(product.stock_level || 0))
                    return (
                      <tr key={product.id} className="border-t hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <td className="p-4">
                          <p className="font-bold">{product.name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{product.category || 'Uncategorized'}</p>
                        </td>
                        <td className="p-4 font-mono text-sm">{product.sku || 'N/A'}</td>
                        <td className="p-4 text-right">KSh {costPrice.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold">KSh {sellingPrice.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-green-600">KSh {profitPerUnit.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            margin > 30 ? 'bg-green-100 text-green-700' : 
                            margin > 10 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-600">KSh {potentialProfit.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => downloadPdf(product.id)} 
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Download PDF">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteProduct(product.id, product.name)}
                              disabled={deleting === product.id}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                              title="Delete product">
                              {deleting === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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