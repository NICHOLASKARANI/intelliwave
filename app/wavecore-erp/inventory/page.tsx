'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Search, Package, Printer, CheckCircle2, AlertTriangle, 
  Warehouse, MapPin, Boxes, DollarSign, TrendingUp, TrendingDown,
  BarChart3, Layers, ArrowRight, Activity, Box, Tags, Scan, Truck,
  ClipboardList, RefreshCw, ArrowLeftRight, Plus, Trash2, X, Edit,
  ArrowDown, ArrowUp, MoveRight
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState('all')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWarehouseForm, setShowWarehouseForm] = useState(false)
  const [showStockForm, setShowStockForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [productForm, setProductForm] = useState({
    name: '', sku: '', category: '', costPrice: '', sellingPrice: '',
    minStock: '', maxStock: '', unit: 'pcs', isTracked: true, trackSerial: false, trackBatch: false
  })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', address: '' })
  const [stockForm, setStockForm] = useState({ productId: '', quantity: '', movementType: 'IN', toLocation: '' })

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, productsRes, warehousesRes] = await Promise.all([
        fetch('/api/wavecore/inventory/summary'),
        fetch('/api/wavecore/inventory/products'),
        fetch('/api/wavecore/inventory/warehouse-management')
      ])
      const summaryData = await summaryRes.json()
      const productsData = await productsRes.json()
      const warehousesData = await warehousesRes.json()
      setData({ ...summaryData, warehouses: warehousesData.warehouses || summaryData.warehouses || [] })
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
    if (!productForm.name || !productForm.sellingPrice) {
      setError('Product name and selling price are required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, costPrice: Number(productForm.costPrice || 0), sellingPrice: Number(productForm.sellingPrice || 0), minStock: Number(productForm.minStock || 0), maxStock: Number(productForm.maxStock || 0) })
      })
      if (res.ok) {
        setSuccess('Product created!')
        setProductForm({ name: '', sku: '', category: '', costPrice: '', sellingPrice: '', minStock: '', maxStock: '', unit: 'pcs', isTracked: true, trackSerial: false, trackBatch: false })
        setShowProductForm(false)
        fetchInventory()
      }
    } catch (err) { setError('Failed to create product') }
  }

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!warehouseForm.name) { setError('Warehouse name required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/warehouse-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouseForm)
      })
      if (res.ok) {
        setSuccess('Warehouse created!')
        setWarehouseForm({ name: '', code: '', address: '' })
        setShowWarehouseForm(false)
        fetchInventory()
      }
    } catch (err) { setError('Failed to create warehouse') }
  }

  const createStockMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!stockForm.productId || !stockForm.quantity) { setError('Product and quantity required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stockForm, quantity: Number(stockForm.quantity) })
      })
      if (res.ok) {
        setSuccess('Stock movement recorded!')
        setStockForm({ productId: '', quantity: '', movementType: 'IN', toLocation: '' })
        setShowStockForm(false)
        fetchInventory()
      }
    } catch (err) { setError('Failed to record movement') }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    setDeleting(id)
    try {
      await fetch(`/api/wavecore/inventory/products?id=${id}`, { method: 'DELETE' })
      setSuccess('Product deleted!')
      fetchInventory()
    } catch (err) { setError('Delete failed') }
    finally { setDeleting('') }
  }

  const deleteWarehouse = async (id: string, name: string) => {
    if (!confirm(`Delete warehouse "${name}"?`)) return
    setDeleting(id)
    try {
      await fetch(`/api/wavecore/inventory/warehouse-management?id=${id}`, { method: 'DELETE' })
      setSuccess('Warehouse deleted!')
      fetchInventory()
    } catch (err) { setError('Delete failed') }
    finally { setDeleting('') }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/inventory/products/${id}/pdf`, '_blank')
  }

  const filtered = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  // Apply KPI filters
  const displayedProducts = filtered.filter(p => {
    const stockLevel = Number(p.stock_level || p.currentStock || 0)
    const sellingPrice = Number(p.sellingPrice || p.price || 0)
    const stockValue = stockLevel * sellingPrice
    if (activeView === 'value') return stockValue > 0
    if (activeView === 'low') return stockLevel < Number(p.minStock || 10)
    if (activeView === 'warehouses') return false // warehouses view shows warehouses, not products
    return true
  })

  const stats = data?.stats || {}
  const warehouses = data?.warehouses || []
  const recentMovements = data?.recentMovements || []

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Inventory Management</span>
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
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowProductForm(!showProductForm)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button onClick={() => setShowWarehouseForm(!showWarehouseForm)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 hover:bg-purple-700">
              <Warehouse className="w-4 h-4" /> Add Warehouse
            </button>
            <button onClick={() => setShowStockForm(!showStockForm)}
              className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 hover:bg-green-700">
              <ArrowLeftRight className="w-4 h-4" /> Stock Movement
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* FORMS */}
        {showProductForm && (
          <form onSubmit={createProduct} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500" /> New Product</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Product Name *" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="text" placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="text" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="number" placeholder="Cost Price" value={productForm.costPrice} onChange={(e) => setProductForm({...productForm, costPrice: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="number" placeholder="Selling Price *" value={productForm.sellingPrice} onChange={(e) => setProductForm({...productForm, sellingPrice: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="number" placeholder="Min Stock" value={productForm.minStock} onChange={(e) => setProductForm({...productForm, minStock: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="number" placeholder="Max Stock" value={productForm.maxStock} onChange={(e) => setProductForm({...productForm, maxStock: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <select value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="pcs">Pieces</option><option value="kg">Kilograms</option><option value="l">Liters</option><option value="box">Box</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">Create Product</button>
          </form>
        )}

        {showWarehouseForm && (
          <form onSubmit={createWarehouse} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Warehouse className="w-5 h-5 text-purple-500" /> New Warehouse</h2>
            <div className="grid grid-cols-3 gap-4">
              <input type="text" placeholder="Warehouse Name *" value={warehouseForm.name} onChange={(e) => setWarehouseForm({...warehouseForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="text" placeholder="Code" value={warehouseForm.code} onChange={(e) => setWarehouseForm({...warehouseForm, code: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="text" placeholder="Address" value={warehouseForm.address} onChange={(e) => setWarehouseForm({...warehouseForm, address: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold">Create Warehouse</button>
          </form>
        )}

        {showStockForm && (
          <form onSubmit={createStockMovement} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-green-500" /> Stock Movement</h2>
            <div className="grid grid-cols-2 gap-4">
              <select value={stockForm.productId} onChange={(e) => setStockForm({...stockForm, productId: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Quantity" value={stockForm.quantity} onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <select value={stockForm.movementType} onChange={(e) => setStockForm({...stockForm, movementType: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="IN">Stock In</option><option value="OUT">Stock Out</option><option value="TRANSFER">Transfer</option>
              </select>
              <input type="text" placeholder="To Location" value={stockForm.toLocation} onChange={(e) => setStockForm({...stockForm, toLocation: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold">Record Movement</button>
          </form>
        )}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center ${activeView === 'all' ? 'ring-4 ring-indigo-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
            <Package className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs opacity-80">Products</p>
          </button>
          <button onClick={() => setActiveView('value')}
            className={`p-5 rounded-2xl text-white text-center ${activeView === 'value' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {(stats.totalSellingValue || 0).toLocaleString()}</p>
            <p className="text-xs opacity-80">Stock Value</p>
          </button>
          <button onClick={() => setActiveView('low')}
            className={`p-5 rounded-2xl text-white text-center ${activeView === 'low' ? 'ring-4 ring-red-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.lowStockCount || 0}</p>
            <p className="text-xs opacity-80">Low Stock</p>
          </button>
          <button onClick={() => setActiveView('warehouses')}
            className={`p-5 rounded-2xl text-white text-center ${activeView === 'warehouses' ? 'ring-4 ring-purple-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Warehouse className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{warehouses.length}</p>
            <p className="text-xs opacity-80">Warehouses</p>
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search..." />
        </div>

        {/* CONTENT BASED ON ACTIVE VIEW */}
        {activeView === 'warehouses' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((wh: any) => (
              <div key={wh.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{wh.name}</p>
                    <p className="text-xs text-muted-foreground">{wh.code}</p>
                  </div>
                  <button onClick={() => deleteWarehouse(wh.id, wh.name)} className="p-2 rounded-lg bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{wh.address || 'No address'}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span>Locations: <b>{wh.locationCount || 0}</b></span>
                  <span>Stock: <b>{wh.totalStock || 0}</b></span>
                </div>
              </div>
            ))}
            {warehouses.length === 0 && <p className="col-span-full text-center py-8 text-muted-foreground">No warehouses</p>}
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
                {displayedProducts.map((product: any) => {
                  const stockLevel = Number(product.stock_level || product.currentStock || 0)
                  const sellingPrice = Number(product.sellingPrice || product.price || 0)
                  const costPrice = Number(product.costPrice || 0)
                  const stockValue = stockLevel * sellingPrice
                  return (
                    <tr key={product.id} className="border-t hover:bg-neutral-50">
                      <td className="p-4 font-bold">{product.name || 'N/A'}</td>
                      <td className="p-4 font-mono text-sm">{product.sku || 'N/A'}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-600">{product.category || 'Uncategorized'}</span></td>
                      <td className="p-4 text-right">KSh {costPrice.toLocaleString()}</td>
                      <td className="p-4 text-right font-bold">KSh {sellingPrice.toLocaleString()}</td>
                      <td className="p-4 text-right"><span className={`font-bold ${stockLevel === 0 ? 'text-red-600' : stockLevel < Number(product.minStock || 10) ? 'text-yellow-600' : 'text-green-600'}`}>{stockLevel}</span></td>
                      <td className="p-4 text-right font-bold text-indigo-600">KSh {stockValue.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => downloadPdf(product.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(product.id, product.name)} className="p-2 rounded-lg bg-red-50 text-red-600">{deleting === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
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