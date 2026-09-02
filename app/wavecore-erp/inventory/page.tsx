'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Search, Package, Printer, CheckCircle2, AlertTriangle, 
  Warehouse, MapPin, Boxes, DollarSign, TrendingUp, TrendingDown,
  BarChart3, Layers, ArrowRight, Activity, Box, Tags, Scan, Truck,
  ClipboardList, RefreshCw, ArrowLeftRight, Plus, Trash2, X, Edit
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    minStock: '',
    maxStock: '',
    unit: 'pcs',
    isTracked: true,
    trackSerial: false,
    trackBatch: false
  })

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/inventory/summary'),
        fetch('/api/wavecore/inventory/products')
      ])
      const summaryData = await summaryRes.json()
      const productsData = await productsRes.json()
      setData(summaryData)
      setProducts(productsData.products || [])
    } catch (err) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.name || !formData.sellingPrice) {
      setError('Product name and selling price are required')
      return
    }

    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          costPrice: Number(formData.costPrice || 0),
          sellingPrice: Number(formData.sellingPrice || 0),
          minStock: Number(formData.minStock || 0),
          maxStock: Number(formData.maxStock || 0)
        })
      })
      const result = await res.json()
      if (res.ok) {
        setSuccess('Product created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setFormData({
          name: '',
          sku: '',
          category: '',
          costPrice: '',
          sellingPrice: '',
          minStock: '',
          maxStock: '',
          unit: 'pcs',
          isTracked: true,
          trackSerial: false,
          trackBatch: false
        })
        setShowForm(false)
        fetchInventory()
      } else {
        setError(result.error || 'Failed to create product')
      }
    } catch (err) {
      setError('Network error - failed to create')
    }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"?`)) return
    setDeleting(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/wavecore/inventory/products?id=${encodeURIComponent(id)}`, { 
        method: 'DELETE' 
      })
      const result = await res.json()
      if (res.ok) {
        setSuccess(`Product "${name}" deleted successfully`)
        setTimeout(() => setSuccess(''), 3000)
        fetchInventory()
      } else {
        setError(result.error || 'Delete failed')
      }
    } catch (err) {
      setError('Network error - delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    if (!id) return
    window.open(`/api/wavecore/inventory/products/${id}/pdf`, '_blank')
  }

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = data?.stats || {}
  const lowStockProducts = data?.lowStockProducts || []
  const recentMovements = data?.recentMovements || []
  const warehouses = data?.warehouses || []

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Inventory</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-indigo-500" /> Inventory ({products.length})
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage products, stock, and warehouses</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button onClick={fetchInventory}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border font-bold flex items-center gap-2 hover:bg-neutral-100 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* ADD PRODUCT FORM */}
        {showForm && (
          <form onSubmit={createProduct} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-500" /> New Product</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Product Name *</label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Product name" 
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">SKU</label>
                <input type="text" value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="SKU code"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <input type="text" value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Category"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cost Price</label>
                <input type="number" value={formData.costPrice}
                  onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  placeholder="0.00" step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Selling Price *</label>
                <input type="number" value={formData.sellingPrice}
                  onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                  placeholder="0.00" step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Unit</label>
                <select value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="l">Liters (l)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="box">Box</option>
                  <option value="carton">Carton</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Min Stock</label>
                <input type="number" value={formData.minStock}
                  onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                  placeholder="10"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max Stock</label>
                <input type="number" value={formData.maxStock}
                  onChange={(e) => setFormData({...formData, maxStock: e.target.value})}
                  placeholder="100"
                  className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isTracked}
                    onChange={(e) => setFormData({...formData, isTracked: e.target.checked})}
                    className="rounded" />
                  <span className="text-sm">Track Stock</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.trackSerial}
                    onChange={(e) => setFormData({...formData, trackSerial: e.target.checked})}
                    className="rounded" />
                  <span className="text-sm">Track Serial</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.trackBatch}
                    onChange={(e) => setFormData({...formData, trackBatch: e.target.checked})}
                    className="rounded" />
                  <span className="text-sm">Track Batch</span>
                </label>
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">
              Create Product
            </button>
          </form>
        )}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-indigo-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
            <Package className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs opacity-80">Products</p>
          </button>
          <button onClick={() => setActiveView('value')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'value' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {(stats.totalSellingValue || 0).toLocaleString()}</p>
            <p className="text-xs opacity-80">Stock Value</p>
          </button>
          <button onClick={() => setActiveView('low')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'low' ? 'ring-4 ring-red-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.lowStockCount || 0}</p>
            <p className="text-xs opacity-80">Low Stock</p>
          </button>
          <button onClick={() => setActiveView('warehouses')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'warehouses' ? 'ring-4 ring-purple-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Warehouse className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalWarehouses || 0}</p>
            <p className="text-xs opacity-80">Warehouses</p>
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No products found</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
              Add Product
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Product</th>
                  <th className="text-left p-4 text-sm">SKU</th>
                  <th className="text-left p-4 text-sm">Category</th>
                  <th className="text-right p-4 text-sm">Cost</th>
                  <th className="text-right p-4 text-sm">Selling</th>
                  <th className="text-right p-4 text-sm">Stock</th>
                  <th className="text-right p-4 text-sm">Value</th>
                  <th className="text-center p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product: any) => {
                  const stockLevel = Number(product.stock_level || product.currentStock || 0)
                  const sellingPrice = Number(product.sellingPrice || product.price || 0)
                  const costPrice = Number(product.costPrice || 0)
                  const stockValue = stockLevel * sellingPrice
                  return (
                    <tr key={product.id} className="border-t hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <td className="p-4">
                        <p className="font-bold">{product.name || 'N/A'}</p>
                        {product.isTracked && (
                          <span className="text-xs text-indigo-500 flex items-center gap-1 mt-1">
                            <Scan className="w-3 h-3" /> Tracked
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm">{product.sku || 'N/A'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-600">{product.category || 'Uncategorized'}</span>
                      </td>
                      <td className="p-4 text-right">KSh {costPrice.toLocaleString()}</td>
                      <td className="p-4 text-right font-bold">KSh {sellingPrice.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          stockLevel === 0 ? 'text-red-600' :
                          stockLevel < Number(product.minStock || 10) ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {stockLevel}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-indigo-600">KSh {stockValue.toLocaleString()}</td>
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