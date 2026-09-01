'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Plus, Download, Loader2, ArrowDown, Search, Printer, CheckCircle } from 'lucide-react'

export default function StockInPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/store/stock-in')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    if (!selectedProduct || !quantity || Number(quantity) <= 0) {
      setError('Select product and enter valid quantity')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/store/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProduct, quantity: Number(quantity) })
      })

      if (res.ok) {
        setSuccess(`Stock added successfully! +${quantity} units`)
        setSelectedProduct('')
        setQuantity('')
        setShowForm(false)
        fetchProducts()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add stock')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadPdf = (product: any) => {
    window.open(`/api/wavecore/store/${product.id}/pdf`, '_blank')
  }

  const filtered = products.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock In</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowDown className="w-6 h-6 text-green-500" /> Stock In
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Stock
          </button>
        </div>

        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {success}</div>}
        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {showForm && (
          <form onSubmit={handleStockIn} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Add Stock In</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Product</label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity to Add</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 10" className="w-full px-4 py-2.5 rounded-xl border" min="1" />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDown className="w-5 h-5" />}
              {submitting ? 'Adding...' : 'Add Stock'}
            </button>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Product</th>
                  <th className="text-left p-4 text-sm">SKU</th>
                  <th className="text-right p-4 text-sm">Price</th>
                  <th className="text-right p-4 text-sm">Current Stock</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-t hover:bg-neutral-50">
                    <td className="p-4 font-bold">{product.name}</td>
                    <td className="p-4 text-sm">{product.sku || 'N/A'}</td>
                    <td className="p-4 text-right">KSh {Number(product.sellingPrice || 0).toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-green-600">{product.stock_level || 0}</td>
                    <td className="p-4">
                      <button onClick={() => downloadPdf(product.id)} title="PDF"
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <Printer className="w-4 h-4" />
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