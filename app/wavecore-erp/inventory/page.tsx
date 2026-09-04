'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Search, Package, Printer, CheckCircle2, AlertTriangle, 
  Warehouse, Boxes, DollarSign, Plus, Trash2, X,
  ArrowLeftRight, RefreshCw, BarChart3
} from 'lucide-react'

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWarehouseForm, setShowWarehouseForm] = useState(false)
  const [showStockForm, setShowStockForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [productForm, setProductForm] = useState({
    name: '', sku: '', category: '', costPrice: '', sellingPrice: '',
    minStock: '', maxStock: '', initialStock: '', unit: 'pcs'
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
      
      setStats(summaryData.stats || {})
      setProducts(productsData.products || [])
      setWarehouses(warehousesData.warehouses || summaryData.warehouses || [])
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
        body: JSON.stringify({
          ...productForm,
          costPrice: Number(productForm.costPrice || 0),
          sellingPrice: Number(productForm.sellingPrice || 0),
          minStock: Number(productForm.minStock || 10),
          maxStock: Number(productForm.maxStock || 100),
          initialStock: Number(productForm.initialStock || 0)
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Product created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setProductForm({ name: '', sku: '', category: '', costPrice: '', sellingPrice: '', minStock: '', maxStock: '', initialStock: '', unit: 'pcs' })
        setShowProductForm(false)
        fetchInventory()
      } else {
        setError(data.error || 'Failed to create product')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!warehouseForm.name) {
      setError('Warehouse name is required')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/warehouse-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouseForm)
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Warehouse created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setWarehouseForm({ name: '', code: '', address: '' })
        setShowWarehouseForm(false)
        fetchInventory()
      } else {
        setError(data.error || 'Failed to create warehouse')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const createStockMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!stockForm.productId || !stockForm.quantity || Number(stockForm.quantity) <= 0) {
      setError('Select product and enter valid quantity')
      return
    }
    try {
      const res = await fetch('/api/wavecore/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stockForm, quantity: Number(stockForm.quantity) })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Stock movement recorded!')
        setTimeout(() => setSuccess(''), 3000)
        setStockForm({ productId: '', quantity: '', movementType: 'IN', toLocation: '' })
        setShowStockForm(false)
        fetchInventory()
      } else {
        setError(data.error || 'Failed to record movement')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"?`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/inventory/products?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Product deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchInventory()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const deleteWarehouse = async (id: string, name: string) => {
    if (!confirm(`Delete warehouse "${name}"?`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/inventory/warehouse-management?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Warehouse deleted!')
        setTimeout(() => setSuccess(''), 3000)
        fetchInventory()
      }
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/inventory/products/${id}/pdf`, '_blank')
  }

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalStockValue = products.reduce((sum, p) => sum + (Number(p.sellingPrice || 0) * Number(p.stock_level || p.currentStock || 0)), 0)
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock_level || p.currentStock || 0), 0)
  const lowStockCount = products.filter(p => Number(p.stock_level || p.currentStock || 0) < Number(p.minStock || 10)).length

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
        {/* Header with Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-indigo-500" /> Inventory Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage products, stock, and warehouses</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setShowProductForm(!showProductForm); setShowWarehouseForm(false); setShowStockForm(false); }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button onClick={() => { setShowWarehouseForm(!showWarehouseForm); setShowProductForm(false); setShowStockForm(false); }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 hover:bg-purple-700">
              <Warehouse className="w-4 h-4" /> Add Warehouse
            </button>
            <button onClick={() => { setShowStockForm(!showStockForm); setShowProductForm(false); setShowWarehouseForm(false); }}
              className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 hover:bg-green-700">
              <ArrowLeftRight className="w-4 h-4" /> Stock Movement
            </button>
            <button onClick={fetchInventory}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border font-bold flex items-center gap-2 hover:bg-neutral-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* FORMS */}
        {showProductForm && (
          <form onSubmit={createProduct} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">New Product</h2>
              <button type="button" onClick={() => setShowProductForm(false)} className="text-red-500 p-1 rounded-lg hover:bg-red-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product Name *</label>
                <input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. Laptop" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">SKU</label>
                <input type="text" value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} placeholder="e.g. SKU-001" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <input type="text" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} placeholder="e.g. Electronics" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cost Price (KSh)</label>
                <input type="number" value={productForm.costPrice} onChange={(e) => setProductForm({...productForm, costPrice: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Selling Price (KSh) *</label>
                <input type="number" value={productForm.sellingPrice} onChange={(e) => setProductForm({...productForm, sellingPrice: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Initial Stock</label>
                <input type="number" value={productForm.initialStock} onChange={(e) => setProductForm({...productForm, initialStock: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Min Stock</label>
                <input type="number" value={productForm.minStock} onChange={(e) => setProductForm({...productForm, minStock: e.target.value})} placeholder="10" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Stock</label>
                <input type="number" value={productForm.maxStock} onChange={(e) => setProductForm({...productForm, maxStock: e.target.value})} placeholder="100" className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Unit</label>
                <select value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="l">Liters (l)</option>
                  <option value="box">Box</option>
                  <option value="carton">Carton</option>
                </select>
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">
              Create Product
            </button>
          </form>
        )}

        {showWarehouseForm && (
          <form onSubmit={createWarehouse} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">New Warehouse</h2>
              <button type="button" onClick={() => setShowWarehouseForm(false)} className="text-red-500 p-1 rounded-lg hover:bg-red-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Warehouse Name *</label>
                <input type="text" value={warehouseForm.name} onChange={(e) => setWarehouseForm({...warehouseForm, name: e.target.value})} placeholder="e.g. Main Store" className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Code</label>
                <input type="text" value={warehouseForm.code} onChange={(e) => setWarehouseForm({...warehouseForm, code: e.target.value})} placeholder="e.g. WH-001" className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <input type="text" value={warehouseForm.address} onChange={(e) => setWarehouseForm({...warehouseForm, address: e.target.value})} placeholder="e.g. Nairobi" className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700">
              Create Warehouse
            </button>
          </form>
        )}

        {showStockForm && (
          <form onSubmit={createStockMovement} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Stock Movement</h2>
              <button type="button" onClick={() => setShowStockForm(false)} className="text-red-500 p-1 rounded-lg hover:bg-red-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product *</label>
                <select value={stockForm.productId} onChange={(e) => setStockForm({...stockForm, productId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity *</label>
                <input type="number" value={stockForm.quantity} onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})} placeholder="e.g. 10" min="1" className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Movement Type</label>
                <select value={stockForm.movementType} onChange={(e) => setStockForm({...stockForm, movementType: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To Location (for transfer)</label>
                <input type="text" value={stockForm.toLocation} onChange={(e) => setStockForm({...stockForm, toLocation: e.target.value})} placeholder="Optional" className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700">
              Record Movement
            </button>
          </form>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'warehouses', label: 'Warehouses', icon: Warehouse }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeSection === tab.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-900 text-muted-foreground hover:bg-neutral-100'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD VIEW */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-center">
                <Package className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs opacity-80">Total Products</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white text-center">
                <Boxes className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
                <p className="text-xs opacity-80">Total Stock</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">KSh {totalStockValue.toLocaleString()}</p>
                <p className="text-xs opacity-80">Stock Value</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-xs opacity-80">Low Stock</p>
              </div>
            </div>

            {/* WAREHOUSES SUMMARY */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-purple-500" /> Warehouses ({warehouses.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouses.map((wh: any) => (
                  <div key={wh.id} className="p-4 rounded-xl border bg-neutral-50 dark:bg-neutral-800">
                    <p className="font-bold">{wh.name}</p>
                    <p className="text-xs text-muted-foreground">{wh.code || 'No code'}</p>
                    <p className="text-sm mt-2">Stock: <b>{wh.totalStock || 0}</b></p>
                    <p className="text-sm">Value: <b>KSh {(wh.stockValue || 0).toLocaleString()}</b></p>
                  </div>
                ))}
                {warehouses.length === 0 && (
                  <p className="text-muted-foreground col-span-full text-center py-4">No warehouses yet. Click "Add Warehouse" to create one.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS VIEW */}
        {activeSection === 'products' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search products by name, SKU, or category..." />
            </div>

            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No products found</p>
                <button onClick={() => setShowProductForm(true)} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  Add Your First Product
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
                    {filteredProducts.map((product: any) => {
                      const stockLevel = Number(product.stock_level || product.currentStock || 0)
                      const sellingPrice = Number(product.sellingPrice || product.price || 0)
                      const costPrice = Number(product.costPrice || 0)
                      const stockValue = stockLevel * sellingPrice
                      return (
                        <tr key={product.id} className="border-t hover:bg-neutral-50 dark:hover:bg-neutral-800">
                          <td className="p-4 font-bold">{product.name || 'N/A'}</td>
                          <td className="p-4 font-mono text-sm">{product.sku || 'N/A'}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-600">{product.category || 'Uncategorized'}</span>
                          </td>
                          <td className="p-4 text-right">KSh {costPrice.toLocaleString()}</td>
                          <td className="p-4 text-right font-bold">KSh {sellingPrice.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <span className={`font-bold ${
                              stockLevel === 0 ? 'text-red-600' : 
                              stockLevel < Number(product.minStock || 10) ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {stockLevel}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-indigo-600">KSh {stockValue.toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => downloadPdf(product.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Download PDF">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteProduct(product.id, product.name)} disabled={deleting === product.id}
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50" title="Delete">
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
          </div>
        )}

        {/* WAREHOUSES VIEW */}
        {activeSection === 'warehouses' && (
          <div className="space-y-4">
            {warehouses.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No warehouses yet</p>
                <button onClick={() => setShowWarehouseForm(true)} className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold">
                  Add Your First Warehouse
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouses.map((wh: any) => (
                  <div key={wh.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{wh.name}</p>
                        <p className="text-xs text-muted-foreground">{wh.code || 'No code'}</p>
                      </div>
                      <button onClick={() => deleteWarehouse(wh.id, wh.name)} disabled={deleting === wh.id}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                        {deleting === wh.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{wh.address || 'No address'}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span>Locations: <b>{wh.locationCount || 0}</b></span>
                      <span>Stock: <b>{wh.totalStock || 0}</b></span>
                    </div>
                    <div className="text-sm mt-1">
                      Value: <b className="text-indigo-600">KSh {(wh.stockValue || 0).toLocaleString()}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}