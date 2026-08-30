'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Trash2, Loader2, Printer, Package, DollarSign, Tag, Box } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  stock: number
  category: string
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/store')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/store?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchProducts()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/store/${id}/pdf`, '_blank')
  }

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalInventoryValue = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || p.stock || 0), 0)
  const lowStock = products.filter(p => Number(p.quantity || p.stock || 0) < 10)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Products</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-500" /> Products ({products.length})
            </h1>
            <p className="text-sm text-muted-foreground">
              Inventory Value: KSh {totalInventoryValue.toLocaleString()} | Low Stock: {lowStock.length}
            </p>
          </div>
          <Link href="/wavecore-erp/store/products/create"
            className="px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Product
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search products by name or SKU..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No products yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Product</th>
                  <th className="text-left p-4 text-sm">SKU</th>
                  <th className="text-left p-4 text-sm">Category</th>
                  <th className="text-right p-4 text-sm">Price</th>
                  <th className="text-right p-4 text-sm">Stock</th>
                  <th className="text-right p-4 text-sm">Value</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-t hover:bg-neutral-50">
                    <td className="p-4">
                      <p className="font-bold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(product.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 font-mono text-sm">{product.sku || 'N/A'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-orange-600">
                      KSh {Number(product.price || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${Number(product.quantity || product.stock || 0) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {product.quantity || product.stock || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      KSh {(Number(product.price || 0) * Number(product.quantity || product.stock || 0)).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => downloadPdf(product.id)} title="Download PDF"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} title="Delete"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          {deleting === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
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