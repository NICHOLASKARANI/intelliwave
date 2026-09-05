'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Boxes, DollarSign, AlertTriangle,
  RefreshCw, Activity, XCircle, CheckCircle2,
  Plus, Trash2, Printer, Search, X, Layers, ClipboardList, Sliders
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [ledger, setLedger] = useState<any[]>([])
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [cycleCounts, setCycleCounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWarehouseForm, setShowWarehouseForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
  const [showCountForm, setShowCountForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [productForm, setProductForm] = useState({
    name: '', sku: '', category: '', costPrice: '', sellingPrice: '',
    minStock: '', maxStock: '', initialStock: '', unit: 'pcs'
  })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', address: '' })
  const [movementForm, setMovementForm] = useState({ productId: '', quantity: '', movementType: 'IN', toLocation: '', fromLocation: '' })
  const [adjustmentForm, setAdjustmentForm] = useState({ productId: '', quantity: '', reason: '', adjustmentType: 'MANUAL' })
  const [countForm, setCountForm] = useState({ productId: '', countedQuantity: '', countedBy: '', notes: '' })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [cmdRes, productsRes, warehousesRes, movementsRes, ledgerRes, adjustmentsRes, countsRes] = await Promise.all([
        fetch('/api/wavecore/inventory/command-center'),
        fetch('/api/wavecore/inventory/products'),
        fetch('/api/wavecore/inventory/warehouses'),
        fetch('/api/wavecore/inventory/movements'),
        fetch('/api/wavecore/inventory/ledger'),
        fetch('/api/wavecore/inventory/adjustments'),
        fetch('/api/wavecore/inventory/cycle-counts')
      ])
      setData(await cmdRes.json())
      setProducts((await productsRes.json()).products || [])
      setWarehouses((await warehousesRes.json()).warehouses || [])
      setMovements((await movementsRes.json()).movements || [])
      setLedger((await ledgerRes.json()).ledger || [])
      setAdjustments((await adjustmentsRes.json()).adjustments || [])
      setCycleCounts((await countsRes.json()).counts || [])
    } catch (err) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!productForm.name || !productForm.sellingPrice) { setError('Name and selling price required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, costPrice: Number(productForm.costPrice || 0), sellingPrice: Number(productForm.sellingPrice || 0), minStock: Number(productForm.minStock || 10), maxStock: Number(productForm.maxStock || 100), initialStock: Number(productForm.initialStock || 0) })
      })
      if (res.ok) { setSuccess('Product created!'); setProductForm({ name: '', sku: '', category: '', costPrice: '', sellingPrice: '', minStock: '', maxStock: '', initialStock: '', unit: 'pcs' }); setShowProductForm(false); fetchData() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!warehouseForm.name) { setError('Name required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/warehouses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(warehouseForm)
      })
      if (res.ok) { setSuccess('Warehouse created!'); setWarehouseForm({ name: '', code: '', address: '' }); setShowWarehouseForm(false); fetchData() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createMovement = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!movementForm.productId || !movementForm.quantity) { setError('Product and quantity required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/movements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...movementForm, quantity: Number(movementForm.quantity) })
      })
      if (res.ok) { setSuccess('Movement recorded!'); setMovementForm({ productId: '', quantity: '', movementType: 'IN', toLocation: '', fromLocation: '' }); setShowMovementForm(false); fetchData() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createAdjustment = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!adjustmentForm.productId || !adjustmentForm.quantity) { setError('Product and quantity required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/adjustments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...adjustmentForm, quantity: Number(adjustmentForm.quantity) })
      })
      if (res.ok) { setSuccess('Adjustment created!'); setAdjustmentForm({ productId: '', quantity: '', reason: '', adjustmentType: 'MANUAL' }); setShowAdjustmentForm(false); fetchData() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createCount = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!countForm.productId || !countForm.countedQuantity) { setError('Product and counted quantity required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/cycle-counts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...countForm, countedQuantity: Number(countForm.countedQuantity) })
      })
      if (res.ok) { setSuccess('Count created!'); setCountForm({ productId: '', countedQuantity: '', countedBy: '', notes: '' }); setShowCountForm(false); fetchData() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const deleteEntity = async (endpoint: string, id: string, name: string, type: string) => {
    if (!confirm('Delete ' + type + ' "' + name + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/inventory/' + endpoint + '?id=' + id, { method: 'DELETE' })
      if (res.ok) { setSuccess(type + ' deleted!'); setTimeout(() => setSuccess(''), 3000); fetchData() }
    } catch { setError('Delete failed') } finally { setDeleting('') }
  }

  const downloadPdf = (endpoint: string, id: string) => {
    window.open('/api/wavecore/inventory/' + endpoint + '/' + id + '/pdf', '_blank')
  }

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  const kpis = data?.kpis || {}
  const recentMovements = data?.recentMovements || []
  const lowStockProducts = data?.lowStockProducts || []

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'movements', label: 'Movements', icon: RefreshCw },
    { id: 'ledger', label: 'Ledger', icon: Layers },
    { id: 'adjustments', label: 'Adjustments', icon: Sliders },
    { id: 'counts', label: 'Counts', icon: ClipboardList }
  ]

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
              <Warehouse className="w-6 h-6 text-indigo-600" /> Inventory Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time inventory control</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 rounded-xl bg-white border font-bold flex items-center gap-2 hover:bg-neutral-100">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* TABS */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              className={'px-4 py-2 rounded-xl font-bold flex items-center gap-2 ' + (activeSection === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-muted-foreground hover:bg-neutral-100')}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" /></div>
        ) : activeSection === 'dashboard' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md"><Package className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalProducts}</p><p className="text-xs opacity-80 mt-1">Products</p></div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-md"><Boxes className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalUnits.toLocaleString()}</p><p className="text-xs opacity-80 mt-1">Units</p></div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md"><DollarSign className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">KSh {kpis.totalSellingValue.toLocaleString()}</p><p className="text-xs opacity-80 mt-1">Stock Value</p></div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-md"><Warehouse className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.totalWarehouses}</p><p className="text-xs opacity-80 mt-1">Warehouses</p></div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-md"><XCircle className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.outOfStockCount}</p><p className="text-xs opacity-80 mt-1">Out of Stock</p></div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-md"><AlertTriangle className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.lowStockCount}</p><p className="text-xs opacity-80 mt-1">Low Stock</p></div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-700 text-white shadow-md"><Activity className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">{kpis.movements24h}</p><p className="text-xs opacity-80 mt-1">Movements (24h)</p></div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md"><DollarSign className="w-6 h-6 mb-2" /><p className="text-3xl font-bold">KSh {kpis.grossMargin.toLocaleString()}</p><p className="text-xs opacity-80 mt-1">Gross Margin</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h2 className="font-bold text-lg mb-4">Recent Movements</h2>
                {recentMovements.length === 0 ? <p className="text-muted-foreground text-center py-4">No movements</p> : (
                  <div className="space-y-2">
                    {recentMovements.map((m: any, i: number) => (
                      <div key={i} className="flex justify-between p-3 rounded-xl bg-neutral-50">
                        <div><p className="font-bold">{m.productName}</p><p className="text-xs text-muted-foreground">{m.type}</p></div>
                        <span className="font-bold">{m.quantity} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" /> Low Stock</h2>
                {lowStockProducts.length === 0 ? <p className="text-green-600 text-center py-4 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> All stocked</p> : (
                  <div className="space-y-2">
                    {lowStockProducts.map((p: any) => (
                      <div key={p.id} className="flex justify-between p-3 rounded-xl bg-yellow-50">
                        <div><p className="font-bold">{p.name}</p><p className="text-xs">{p.sku}</p></div>
                        <p className="font-bold text-red-600">{p.currentStock} / {p.minStock}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeSection === 'products' ? (
          <div className="space-y-4">
            <button onClick={() => setShowProductForm(!showProductForm)} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Product</button>
            {showProductForm && (
              <form onSubmit={createProduct} className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">New Product</h2><button type="button" onClick={() => setShowProductForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="Name *" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="text" placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="text" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="number" placeholder="Cost Price" value={productForm.costPrice} onChange={(e) => setProductForm({...productForm, costPrice: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="number" placeholder="Selling Price *" value={productForm.sellingPrice} onChange={(e) => setProductForm({...productForm, sellingPrice: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="number" placeholder="Initial Stock" value={productForm.initialStock} onChange={(e) => setProductForm({...productForm, initialStock: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="number" placeholder="Min Stock" value={productForm.minStock} onChange={(e) => setProductForm({...productForm, minStock: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="number" placeholder="Max Stock" value={productForm.maxStock} onChange={(e) => setProductForm({...productForm, maxStock: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <select value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="px-4 py-2.5 rounded-xl border"><option value="pcs">Pieces</option><option value="kg">Kilograms</option><option value="l">Liters</option><option value="box">Box</option></select>
                </div>
                <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700">Create Product</button>
              </form>
            )}
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search products..." /></div>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <table className="w-full"><thead className="bg-neutral-50"><tr><th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th><th className="text-right p-4">Selling</th><th className="text-right p-4">Stock</th><th className="text-right p-4">Value</th><th className="text-center p-4">Actions</th></tr></thead>
              <tbody>{filteredProducts.map((p: any) => { const stock = Number(p.stock_level || 0); const price = Number(p.sellingPrice || 0); return (
                <tr key={p.id} className="border-t hover:bg-neutral-50">
                  <td className="p-4 font-bold">{p.name}</td><td className="p-4 font-mono text-sm">{p.sku || 'N/A'}</td>
                  <td className="p-4 text-right">KSh {price.toLocaleString()}</td>
                  <td className="p-4 text-right"><span className={stock === 0 ? 'text-red-600 font-bold' : stock < Number(p.minStock || 10) ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold'}>{stock}</span></td>
                  <td className="p-4 text-right font-bold">KSh {(stock * price).toLocaleString()}</td>
                  <td className="p-4"><div className="flex gap-2 justify-center">
                    <button onClick={() => downloadPdf('products', p.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Printer className="w-4 h-4" /></button>
                    <button onClick={() => deleteEntity('products', p.id, p.name, 'Product')} disabled={deleting === p.id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">{deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                  </div></td>
                </tr>
              )})}</tbody>
            </table>
            </div>
          </div>
        ) : activeSection === 'warehouses' ? (
          <div className="space-y-4">
            <button onClick={() => setShowWarehouseForm(!showWarehouseForm)} className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 shadow-md hover:bg-purple-700"><Plus className="w-4 h-4" /> Add Warehouse</button>
            {showWarehouseForm && (
              <form onSubmit={createWarehouse} className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">New Warehouse</h2><button type="button" onClick={() => setShowWarehouseForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="Name *" value={warehouseForm.name} onChange={(e) => setWarehouseForm({...warehouseForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="text" placeholder="Code" value={warehouseForm.code} onChange={(e) => setWarehouseForm({...warehouseForm, code: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="text" placeholder="Address" value={warehouseForm.address} onChange={(e) => setWarehouseForm({...warehouseForm, address: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                </div>
                <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold shadow-md hover:bg-purple-700">Create Warehouse</button>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((wh: any) => (
                <div key={wh.id} className="p-4 rounded-2xl border bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div><p className="font-bold text-lg">{wh.name}</p><p className="text-xs text-muted-foreground">{wh.code}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadPdf('warehouses', wh.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Printer className="w-4 h-4" /></button>
                      <button onClick={() => deleteEntity('warehouses', wh.id, wh.name, 'Warehouse')} disabled={deleting === wh.id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">{deleting === wh.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{wh.address || 'No address'}</p>
                  <div className="flex gap-4 mt-3 text-sm"><span>Stock: <b>{wh.totalStock || 0}</b></span><span>Value: <b>KSh {(wh.stockValue || 0).toLocaleString()}</b></span></div>
                </div>
              ))}
            </div>
          </div>
        ) : activeSection === 'movements' ? (
          <div className="space-y-4">
            <button onClick={() => setShowMovementForm(!showMovementForm)} className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 shadow-md hover:bg-green-700"><Plus className="w-4 h-4" /> Record Movement</button>
            {showMovementForm && (
              <form onSubmit={createMovement} className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">Stock Movement</h2><button type="button" onClick={() => setShowMovementForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-2 gap-4">
                  <select value={movementForm.productId} onChange={(e) => setMovementForm({...movementForm, productId: e.target.value})} className="px-4 py-2.5 rounded-xl border"><option value="">Select product...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>)}</select>
                  <input type="number" placeholder="Quantity *" value={movementForm.quantity} onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <select value={movementForm.movementType} onChange={(e) => setMovementForm({...movementForm, movementType: e.target.value})} className="px-4 py-2.5 rounded-xl border"><option value="IN">Stock In</option><option value="OUT">Stock Out</option><option value="TRANSFER">Transfer</option></select>
                  <input type="text" placeholder="To Location" value={movementForm.toLocation} onChange={(e) => setMovementForm({...movementForm, toLocation: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                </div>
                <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold shadow-md hover:bg-green-700">Record Movement</button>
              </form>
            )}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <table className="w-full"><thead className="bg-neutral-50"><tr><th className="text-left p-4">Type</th><th className="text-left p-4">Product</th><th className="text-right p-4">Qty</th><th className="text-left p-4">Date</th><th className="text-center p-4">Actions</th></tr></thead>
              <tbody>{movements.map((m: any) => (
                <tr key={m.id} className="border-t hover:bg-neutral-50">
                  <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{m.type}</span></td>
                  <td className="p-4 font-bold">{m.productName}</td>
                  <td className="p-4 text-right font-bold">{m.quantity}</td>
                  <td className="p-4 text-sm">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-center"><button onClick={() => deleteEntity('movements', m.id, m.productName, 'Movement')} disabled={deleting === m.id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">{deleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button></td>
                </tr>
              ))}</tbody>
            </table>
            </div>
          </div>
        ) : activeSection === 'ledger' ? (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr><th className="text-left p-4">Transaction</th><th className="text-left p-4">Product</th><th className="text-right p-4">Qty</th><th className="text-right p-4">Before</th><th className="text-right p-4">After</th><th className="text-left p-4">Type</th><th className="text-left p-4">Date</th></tr></thead>
            <tbody>{ledger.map((l: any) => (
              <tr key={l.id} className="border-t hover:bg-neutral-50">
                <td className="p-4 font-mono text-xs">{l.transactionId}</td>
                <td className="p-4 font-bold">{l.productName}</td>
                <td className="p-4 text-right font-bold">{l.quantity}</td>
                <td className="p-4 text-right">{l.beforeQuantity}</td>
                <td className="p-4 text-right">{l.afterQuantity}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{l.transactionType}</span></td>
                <td className="p-4 text-sm">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody>
            </table>
          </div>
        ) : activeSection === 'adjustments' ? (
          <div className="space-y-4">
            <button onClick={() => setShowAdjustmentForm(!showAdjustmentForm)} className="px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold flex items-center gap-2 shadow-md hover:bg-orange-700"><Plus className="w-4 h-4" /> New Adjustment</button>
            {showAdjustmentForm && (
              <form onSubmit={createAdjustment} className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">Stock Adjustment</h2><button type="button" onClick={() => setShowAdjustmentForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-2 gap-4">
                  <select value={adjustmentForm.productId} onChange={(e) => setAdjustmentForm({...adjustmentForm, productId: e.target.value})} className="px-4 py-2.5 rounded-xl border"><option value="">Select product...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>)}</select>
                  <input type="number" placeholder="Quantity (+/-)" value={adjustmentForm.quantity} onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <select value={adjustmentForm.adjustmentType} onChange={(e) => setAdjustmentForm({...adjustmentForm, adjustmentType: e.target.value})} className="px-4 py-2.5 rounded-xl border"><option value="MANUAL">Manual</option><option value="DAMAGE">Damage</option><option value="LOSS">Loss</option><option value="FOUND">Found</option><option value="EXPIRY">Expiry</option></select>
                  <input type="text" placeholder="Reason" value={adjustmentForm.reason} onChange={(e) => setAdjustmentForm({...adjustmentForm, reason: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                </div>
                <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold shadow-md hover:bg-orange-700">Create Adjustment</button>
              </form>
            )}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <table className="w-full"><thead className="bg-neutral-50"><tr><th className="text-left p-4">Number</th><th className="text-left p-4">Product</th><th className="text-right p-4">Qty</th><th className="text-left p-4">Type</th><th className="text-left p-4">Status</th><th className="text-center p-4">Actions</th></tr></thead>
              <tbody>{adjustments.map((a: any) => (
                <tr key={a.id} className="border-t hover:bg-neutral-50">
                  <td className="p-4 font-mono text-xs">{a.number}</td>
                  <td className="p-4 font-bold">{a.productName}</td>
                  <td className="p-4 text-right font-bold">{a.quantity}</td>
                  <td className="p-4">{a.adjustmentType}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100">{a.status}</span></td>
                  <td className="p-4"><div className="flex gap-2 justify-center">
                    <button onClick={() => downloadPdf('adjustments', a.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Printer className="w-4 h-4" /></button>
                    <button onClick={() => deleteEntity('adjustments', a.id, a.productName, 'Adjustment')} disabled={deleting === a.id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">{deleting === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setShowCountForm(!showCountForm)} className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2 shadow-md hover:bg-cyan-700"><Plus className="w-4 h-4" /> New Count</button>
            {showCountForm && (
              <form onSubmit={createCount} className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">Cycle Count</h2><button type="button" onClick={() => setShowCountForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-2 gap-4">
                  <select value={countForm.productId} onChange={(e) => setCountForm({...countForm, productId: e.target.value})} className="px-4 py-2.5 rounded-xl border"><option value="">Select product...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_level || 0})</option>)}</select>
                  <input type="number" placeholder="Counted Quantity *" value={countForm.countedQuantity} onChange={(e) => setCountForm({...countForm, countedQuantity: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="text" placeholder="Counted By" value={countForm.countedBy} onChange={(e) => setCountForm({...countForm, countedBy: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                  <input type="text" placeholder="Notes" value={countForm.notes} onChange={(e) => setCountForm({...countForm, notes: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
                </div>
                <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold shadow-md hover:bg-cyan-700">Create Count</button>
              </form>
            )}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <table className="w-full"><thead className="bg-neutral-50"><tr><th className="text-left p-4">Number</th><th className="text-left p-4">Product</th><th className="text-right p-4">Expected</th><th className="text-right p-4">Counted</th><th className="text-right p-4">Variance</th><th className="text-left p-4">Status</th><th className="text-center p-4">Actions</th></tr></thead>
              <tbody>{cycleCounts.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-neutral-50">
                  <td className="p-4 font-mono text-xs">{c.number}</td>
                  <td className="p-4 font-bold">{c.productName}</td>
                  <td className="p-4 text-right">{c.expectedQuantity}</td>
                  <td className="p-4 text-right">{c.countedQuantity || 'N/A'}</td>
                  <td className="p-4 text-right"><span className={Number(c.variance) === 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{c.variance || 0}</span></td>
                  <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-green-100">{c.status}</span></td>
                  <td className="p-4"><div className="flex gap-2 justify-center">
                    <button onClick={() => downloadPdf('cycle-counts', c.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Printer className="w-4 h-4" /></button>
                    <button onClick={() => deleteEntity('cycle-counts', c.id, c.productName, 'Count')} disabled={deleting === c.id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">{deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}