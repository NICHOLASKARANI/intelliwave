'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Plus, Search, Trash2, Edit3, Package, Download, ArrowLeft, Loader2,
  AlertTriangle, TrendingUp, DollarSign, Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  unit: string
  costPrice: number
  sellingPrice: number
  minStock: number
  maxStock: number
  total_stock: number
  available_stock: number
  isActive: boolean
  createdAt: string
}

export default function StoreProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showLowStock, setShowLowStock] = useState(false)

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/inventory/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      const res = await fetch(`/api/wavecore/inventory/products/${id}`, { method: 'DELETE' })
      if (res.ok) fetchProducts()
    } catch {}
  }

  const handleExport = () => {
    const csv = 'Name,SKU,Category,Cost Price,Selling Price,Stock,Min Stock,Status\n' +
      filtered.map(p => `${p.name},${p.sku},${p.category},${p.costPrice},${p.sellingPrice},${p.total_stock},${p.minStock},${p.isActive ? 'Active' : 'Inactive'}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter
    const matchesLowStock = !showLowStock || (p.total_stock || 0) <= (p.minStock || 0)
    return matchesSearch && matchesCategory && matchesLowStock
  })

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]
  const totalStockValue = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.total_stock || 0), 0)
  const lowStockItems = products.filter(p => (p.total_stock || 0) <= (p.minStock || 0)).length

  const formatKES = (amount: number) => 'KSh ' + (amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp/store" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Products</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
            <Link href="/wavecore-erp/store/products/create"><Button className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Product</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Products</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
            <Package className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">Total Products</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
            <DollarSign className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-xl font-bold">{formatKES(totalStockValue)}</p>
            <p className="text-xs text-muted-foreground">Stock Value</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
            <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-xl font-bold">{lowStockItems}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </div>
          <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
            <TrendingUp className="w-5 h-5 text-teal-500 mb-2" />
            <p className="text-xl font-bold">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border text-sm w-full" placeholder="Search by name, SKU, or barcode..." />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border text-sm">
            <option value="ALL">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${showLowStock ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
            Low Stock Only
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">SKU</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-right p-4">Cost</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Stock</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.unit}</p>
                    </td>
                    <td className="p-4 font-mono text-xs">{product.sku}</td>
                    <td className="p-4">{product.category || '-'}</td>
                    <td className="p-4 text-right">{formatKES(product.costPrice)}</td>
                    <td className="p-4 text-right font-medium">{formatKES(product.sellingPrice)}</td>
                    <td className="p-4 text-right">
                      <span className={product.total_stock <= product.minStock ? 'text-amber-600 font-bold' : ''}>
                        {product.total_stock || 0}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first product</p>
            <Link href="/wavecore-erp/store/products/create">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Product</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}