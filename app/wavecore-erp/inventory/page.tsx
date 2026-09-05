'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Boxes, DollarSign, AlertTriangle,
  RefreshCw, Activity, XCircle, CheckCircle2,
  Plus, Trash2, Printer, Search, X
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [productForm, setProductForm] = useState({
    name: '', sku: '', category: '', costPrice: '', sellingPrice: '',
    minStock: '', maxStock: '', initialStock: '', unit: 'pcs', barcode: '', description: ''
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [cmdRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/inventory/command-center'),
        fetch('/api/wavecore/inventory/products')
      ])
      const cmdData = await cmdRes.json()
      const productsData = await productsRes.json()
      setData(cmdData)
      setProducts(productsData.products || [])
    } catch (err) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!productForm.name || !productForm.sellingPrice) {
      setError('Product name and selling price are required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          costPrice: Number(productForm.costPrice || 0),
          sellingPrice: Number(productForm.sellingPrice || 0),
          minStock: Number(productForm.minStock || 10),
          maxStock: Number(productForm.maxStock || 100),
          initialStock: Number(productForm.initialStock || 0)
        })
      })
      const result = await res.json()
      if (res.ok) {
        setSuccess('Product created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setProductForm({ name: '', sku: '', category: '', costPrice: '', sellingPrice: '', minStock: '', maxStock: '', initialStock: '', unit: 'pcs', barcode: '', description: '' })
        setShowProductForm(false)
        fetchData()
      } else {
        setError(result.error || 'Failed to create product')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm('Delete product "' + name + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/products?id=' + id, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Product deleted!')
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
    window.open('/api/wavecore/inventory/products/' + id + '/pdf', '_blank')
  }

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const kpis = data?.kpis || {}
  const recentMovements = data?.recentMovements || []
  const lowStockProducts = data?.lowStockProducts || []

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-muted-foreground">Inventory</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-indigo-600" /> Inventory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time inventory management</p>
          </div>
          <button onClick={fetchData}
            className="px-4 py-2.5 rounded-xl bg-white border font-bold flex items-center gap-2 hover:bg-neutral-100">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveSection('dashboard')}
            className={'px-4 py-2 rounded-xl font-bold ' + (activeSection === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white text-muted-foreground hover:bg-neutral-100')}>
            Dashboard
          </button>
          <button onClick={() => setActiveSection('products')}
            className={'px-4 py-2 rounded-xl font-bold ' + (activeSection === 'products' ? 'bg-indigo-600 text-white' : 'bg-white text-muted-foreground hover:bg-neutral-100')}>
            Products ({products.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" /></div>
        ) : activeSection === 'dashboard' ? (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md">
                <Package className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.totalProducts}</p>
                <p className="text-xs opacity-80 mt-1">Total Products</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-md">
                <Boxes className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.totalUnits.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Total Units</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md">
                <DollarSign className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KSh {kpis.totalSellingValue.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Stock Value</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-md">
                <Warehouse className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.totalWarehouses}</p>
                <p className="text-xs opacity-80 mt-1">Warehouses</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-md">
                <XCircle className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.outOfStockCount}</p>
                <p className="text-xs opacity-80 mt-1">Out of Stock</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-md">
                <AlertTriangle className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.lowStockCount}</p>
                <p className="text-xs opacity-80 mt-1">Low Stock</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-700 text-white shadow-md">
                <Activity className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.movements24h}</p>
                <p className="text-xs opacity-80 mt-1">Movements (24h)</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md">
                <DollarSign className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KSh {kpis.grossMargin.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Gross Margin</p>
              </div>
            </div>

            {/* RECENT MOVEMENTS */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg mb-4">Recent Movements</h2>
              {recentMovements.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent movements</p>
              ) : (
                <div className="space-y-2">
                  {recentMovements.map((m: any, i: number) => (
                    <div key={m.id || i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50">
                      <div>
                        <p className="font-bold">{m.productName || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{m.type || 'MOVEMENT'}</p>
                      </div>
                      <span className="font-bold">{m.quantity || 0} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LOW STOCK */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" /> Low Stock Alerts
              </h2>
              {lowStockProducts.length === 0 ? (
                <p className="text-green-600 text-center py-4 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> All products are adequately stocked
                </p>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-yellow-50">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{p.currentStock} / {p.minStock}</p>
                        <p className="text-xs text-muted-foreground">Current / Min</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* PRODUCTS SECTION */
          <div className="space-y-4">
            <button onClick={() => setShowProductForm(!showProductForm)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Product
            </button>

            {showProductForm && (
              <form onSubmit={createProduct} className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex justify-between mb-4">
                  <h2 className="font-bold text-lg">New Product</h2>
                  <button type="button" onClick={() => setShowProductForm(false)} className="text-red-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name *</label>
                    <input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">SKU</label>
                    <input type="text" value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <input type="text" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Cost Price (KSh)</label>
                    <input type="number" value={productForm.costPrice} onChange={(e) => setProductForm({...productForm, costPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Selling Price (KSh) *</label>
                    <input type="number" value={productForm.sellingPrice} onChange={(e) => setProductForm({...productForm, sellingPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Initial Stock</label>
                    <input type="number" value={productForm.initialStock} onChange={(e) => setProductForm({...productForm, initialStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Stock</label>
                    <input type="number" value={productForm.minStock} onChange={(e) => setProductForm({...productForm, minStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Stock</label>
                    <input type="number" value={productForm.maxStock} onChange={(e) => setProductForm({...productForm, maxStock: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Unit</label>
                    <select value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border">
                      <option value="pcs">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="l">Liters</option>
                      <option value="box">Box</option>
                      <option value="carton">Carton</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700">Create Product</button>
              </form>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search products..." />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="text-left p-4">Product</th>
                      <th className="text-left p-4">SKU</th>
                      <th className="text-left p-4">Category</th>
                      <th className="text-right p-4">Cost</th>
                      <th className="text-right p-4">Selling</th>
                      <th className="text-right p-4">Stock</th>
                      <th className="text-right p-4">Value</th>
                      <th className="text-center p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p: any) => {
                      const stock = Number(p.stock_level || 0)
                      const price = Number(p.sellingPrice || 0)
                      return (
                        <tr key={p.id} className="border-t hover:bg-neutral-50">
                          <td className="p-4 font-bold">{p.name}</td>
                          <td className="p-4 font-mono text-sm">{p.sku || 'N/A'}</td>
                          <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-600">{p.category || 'Uncategorized'}</span></td>
                          <td className="p-4 text-right">KSh {(Number(p.costPrice) || 0).toLocaleString()}</td>
                          <td className="p-4 text-right">KSh {price.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <span className={stock === 0 ? 'text-red-600 font-bold' : stock < Number(p.minStock || 10) ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold'}>
                              {stock}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold">KSh {(stock * price).toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="PDF">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteProduct(p.id, p.name)} disabled={deleting === p.id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Delete">
                                {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
          </div>
        )}
      </main>
    </div>
  )
}