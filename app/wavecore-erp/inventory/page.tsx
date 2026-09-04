'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Search, Package, Printer, CheckCircle2, AlertTriangle, 
  Warehouse, Boxes, DollarSign, Plus, Trash2, X,
  ArrowLeftRight, RefreshCw, BarChart3, MapPin, Box, Scan, Layers
} from 'lucide-react'

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [bins, setBins] = useState<any[]>([])
  const [serials, setSerials] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWarehouseForm, setShowWarehouseForm] = useState(false)
  const [showStockForm, setShowStockForm] = useState(false)
  const [showZoneForm, setShowZoneForm] = useState(false)
  const [showBinForm, setShowBinForm] = useState(false)
  const [showSerialForm, setShowSerialForm] = useState(false)
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  
  const [productForm, setProductForm] = useState({
    name: '', sku: '', category: '', costPrice: '', sellingPrice: '',
    minStock: '', maxStock: '', initialStock: '', unit: 'pcs'
  })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', address: '' })
  const [stockForm, setStockForm] = useState({ productId: '', quantity: '', movementType: 'IN', toLocation: '' })
  const [zoneForm, setZoneForm] = useState({ name: '', warehouseId: '', zoneType: 'STORAGE', code: '' })
  const [binForm, setBinForm] = useState({ name: '', warehouseId: '', zoneId: '', binType: 'PICKING', code: '', capacity: '' })
  const [serialForm, setSerialForm] = useState({ serialNumber: '', productId: '', status: 'IN_STOCK' })
  const [batchForm, setBatchForm] = useState({ batchNumber: '', productId: '', quantity: '', expiryDate: '', manufacturingDate: '' })

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const [productsRes, warehousesRes, zonesRes, binsRes, serialsRes, batchesRes] = await Promise.all([
        fetch('/api/wavecore/inventory/products'),
        fetch('/api/wavecore/inventory/warehouse-management'),
        fetch('/api/wavecore/inventory/zones'),
        fetch('/api/wavecore/inventory/bins'),
        fetch('/api/wavecore/inventory/serials'),
        fetch('/api/wavecore/inventory/batches')
      ])
      setProducts((await productsRes.json()).products || [])
      setWarehouses((await warehousesRes.json()).warehouses || [])
      setZones((await zonesRes.json()).zones || [])
      setBins((await binsRes.json()).bins || [])
      setSerials((await serialsRes.json()).serials || [])
      setBatches((await batchesRes.json()).batches || [])
    } catch (err) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInventory() }, [])

  const closeAllForms = () => {
    setShowProductForm(false); setShowWarehouseForm(false); setShowStockForm(false)
    setShowZoneForm(false); setShowBinForm(false); setShowSerialForm(false); setShowBatchForm(false)
  }

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!productForm.name || !productForm.sellingPrice) { setError('Name and selling price required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, costPrice: Number(productForm.costPrice || 0), sellingPrice: Number(productForm.sellingPrice || 0), minStock: Number(productForm.minStock || 10), maxStock: Number(productForm.maxStock || 100), initialStock: Number(productForm.initialStock || 0) })
      })
      if (res.ok) { setSuccess('Product created!'); setProductForm({ name: '', sku: '', category: '', costPrice: '', sellingPrice: '', minStock: '', maxStock: '', initialStock: '', unit: 'pcs' }); closeAllForms(); fetchInventory() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!warehouseForm.name) { setError('Name required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/warehouse-management', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(warehouseForm)
      })
      if (res.ok) { setSuccess('Warehouse created!'); setWarehouseForm({ name: '', code: '', address: '' }); closeAllForms(); fetchInventory() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createStockMovement = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!stockForm.productId || !stockForm.quantity) { setError('Product and quantity required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/movements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...stockForm, quantity: Number(stockForm.quantity) })
      })
      if (res.ok) { setSuccess('Movement recorded!'); setStockForm({ productId: '', quantity: '', movementType: 'IN', toLocation: '' }); closeAllForms(); fetchInventory() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createZone = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!zoneForm.name || !zoneForm.warehouseId) { setError('Name and warehouse required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/zones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(zoneForm)
      })
      if (res.ok) { setSuccess('Zone created!'); setZoneForm({ name: '', warehouseId: '', zoneType: 'STORAGE', code: '' }); closeAllForms(); fetchInventory() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createBin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!binForm.name || !binForm.warehouseId) { setError('Name and warehouse required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/bins', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...binForm, capacity: Number(binForm.capacity || 0) })
      })
      if (res.ok) { setSuccess('Bin created!'); setBinForm({ name: '', warehouseId: '', zoneId: '', binType: 'PICKING', code: '', capacity: '' }); closeAllForms(); fetchInventory() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createSerial = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!serialForm.serialNumber || !serialForm.productId) { setError('Serial number and product required'); return }
    try {
      const selectedProduct = products.find(p => p.id === serialForm.productId)
      const res = await fetch('/api/wavecore/inventory/serials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...serialForm, productName: selectedProduct?.name || '' })
      })
      if (res.ok) { setSuccess('Serial created!'); setSerialForm({ serialNumber: '', productId: '', status: 'IN_STOCK' }); closeAllForms(); fetchInventory() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const createBatch = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!batchForm.batchNumber || !batchForm.productId) { setError('Batch number and product required'); return }
    try {
      const selectedProduct = products.find(p => p.id === batchForm.productId)
      const res = await fetch('/api/wavecore/inventory/batches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...batchForm, productName: selectedProduct?.name || '', quantity: Number(batchForm.quantity || 0) })
      })
      if (res.ok) { setSuccess('Batch created!'); setBatchForm({ batchNumber: '', productId: '', quantity: '', expiryDate: '', manufacturingDate: '' }); closeAllForms(); fetchInventory() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
  }

  const askCopilot = async () => {
    if (!copilotQuery.trim()) return
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/copilot?query=' + encodeURIComponent(copilotQuery))
      const data = await res.json()
      setCopilotAnswer(data.answer || 'No answer available')
    } catch { setError('Failed to query AI Copilot') }
  }

  const deleteEntity = async (endpoint: string, id: string, name: string, type: string) => {
    if (!confirm(`Delete ${type} "${name}"?`)) return
    setDeleting(id)
    try {
      await fetch(`/api/wavecore/inventory/${endpoint}?id=${id}`, { method: 'DELETE' })
      setSuccess(`${type} deleted!`); setTimeout(() => setSuccess(''), 3000); fetchInventory()
    } catch { setError('Delete failed') }
    finally { setDeleting('') }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/inventory/products/${id}/pdf`, '_blank')
  }

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalStockValue = products.reduce((s, p) => s + (Number(p.sellingPrice || 0) * Number(p.stock_level || 0)), 0)
  const totalStock = products.reduce((s, p) => s + Number(p.stock_level || 0), 0)
  const lowStockCount = products.filter(p => Number(p.stock_level || 0) < Number(p.minStock || 10)).length

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'bins', label: 'Bins', icon: Box },
    { id: 'serials', label: 'Serials', icon: Scan },
    { id: 'batches', label: 'Batches', icon: Layers }
  ]

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
              <Warehouse className="w-6 h-6 text-indigo-500" /> Inventory Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage products, warehouses, zones, bins, serials, and batches</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { closeAllForms(); setShowProductForm(true) }} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Product</button>
            <button onClick={() => { closeAllForms(); setShowWarehouseForm(true) }} className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2"><Warehouse className="w-4 h-4" /> Warehouse</button>
            <button onClick={() => { closeAllForms(); setShowStockForm(true) }} className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Movement</button>
            <button onClick={() => { closeAllForms(); setShowZoneForm(true) }} className="px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold flex items-center gap-2"><MapPin className="w-4 h-4" /> Zone</button>
            <button onClick={() => { closeAllForms(); setShowBinForm(true) }} className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2"><Box className="w-4 h-4" /> Bin</button>
            <button onClick={() => { closeAllForms(); setShowSerialForm(true) }} className="px-4 py-2.5 rounded-xl bg-pink-600 text-white font-bold flex items-center gap-2"><Scan className="w-4 h-4" /> Serial</button>
            <button onClick={() => { closeAllForms(); setShowBatchForm(true) }} className="px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold flex items-center gap-2"><Layers className="w-4 h-4" /> Batch</button>
            <button onClick={fetchInventory} className="px-4 py-2.5 rounded-xl bg-white border font-bold"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* FORMS */}
        {showProductForm && (
          <form onSubmit={createProduct} className="bg-white rounded-2xl border p-6 mb-6">
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
              <select value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="pcs">Pieces</option><option value="kg">Kilograms</option><option value="l">Liters</option><option value="box">Box</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">Create Product</button>
          </form>
        )}

        {showWarehouseForm && (
          <form onSubmit={createWarehouse} className="bg-white rounded-2xl border p-6 mb-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">New Warehouse</h2><button type="button" onClick={() => setShowWarehouseForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-3 gap-4">
              <input type="text" placeholder="Name *" value={warehouseForm.name} onChange={(e) => setWarehouseForm({...warehouseForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="text" placeholder="Code" value={warehouseForm.code} onChange={(e) => setWarehouseForm({...warehouseForm, code: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="text" placeholder="Address" value={warehouseForm.address} onChange={(e) => setWarehouseForm({...warehouseForm, address: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold">Create Warehouse</button>
          </form>
        )}

        {showStockForm && (
          <form onSubmit={createStockMovement} className="bg-white rounded-2xl border p-6 mb-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">Stock Movement</h2><button type="button" onClick={() => setShowStockForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
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

        {showZoneForm && (
          <form onSubmit={createZone} className="bg-white rounded-2xl border p-6 mb-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">New Zone</h2><button type="button" onClick={() => setShowZoneForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Zone Name *" value={zoneForm.name} onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <select value={zoneForm.warehouseId} onChange={(e) => setZoneForm({...zoneForm, warehouseId: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="">Select Warehouse...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <input type="text" placeholder="Code" value={zoneForm.code} onChange={(e) => setZoneForm({...zoneForm, code: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <select value={zoneForm.zoneType} onChange={(e) => setZoneForm({...zoneForm, zoneType: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="STORAGE">Storage</option><option value="PICKING">Picking</option><option value="PACKING">Packing</option><option value="RECEIVING">Receiving</option><option value="QUARANTINE">Quarantine</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold">Create Zone</button>
          </form>
        )}

        {showBinForm && (
          <form onSubmit={createBin} className="bg-white rounded-2xl border p-6 mb-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">New Bin</h2><button type="button" onClick={() => setShowBinForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Bin Name *" value={binForm.name} onChange={(e) => setBinForm({...binForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <select value={binForm.warehouseId} onChange={(e) => setBinForm({...binForm, warehouseId: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="">Select Warehouse...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select value={binForm.zoneId} onChange={(e) => setBinForm({...binForm, zoneId: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="">Select Zone...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
              <input type="number" placeholder="Capacity" value={binForm.capacity} onChange={(e) => setBinForm({...binForm, capacity: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold">Create Bin</button>
          </form>
        )}

        {showSerialForm && (
          <form onSubmit={createSerial} className="bg-white rounded-2xl border p-6 mb-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">New Serial Number</h2><button type="button" onClick={() => setShowSerialForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Serial Number *" value={serialForm.serialNumber} onChange={(e) => setSerialForm({...serialForm, serialNumber: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <select value={serialForm.productId} onChange={(e) => setSerialForm({...serialForm, productId: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-pink-600 text-white font-bold">Create Serial</button>
          </form>
        )}

        {showBatchForm && (
          <form onSubmit={createBatch} className="bg-white rounded-2xl border p-6 mb-6">
            <div className="flex justify-between mb-4"><h2 className="font-bold text-lg">New Batch</h2><button type="button" onClick={() => setShowBatchForm(false)} className="text-red-500"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Batch Number *" value={batchForm.batchNumber} onChange={(e) => setBatchForm({...batchForm, batchNumber: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <select value={batchForm.productId} onChange={(e) => setBatchForm({...batchForm, productId: e.target.value})} className="px-4 py-2.5 rounded-xl border">
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Quantity" value={batchForm.quantity} onChange={(e) => setBatchForm({...batchForm, quantity: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
              <input type="date" placeholder="Expiry Date" value={batchForm.expiryDate} onChange={(e) => setBatchForm({...batchForm, expiryDate: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold">Create Batch</button>
          </form>
        )}

        {/* TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm whitespace-nowrap ${
                activeSection === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-muted-foreground'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label} ({tab.id === 'products' ? products.length : tab.id === 'warehouses' ? warehouses.length : tab.id === 'zones' ? zones.length : tab.id === 'bins' ? bins.length : tab.id === 'serials' ? serials.length : tab.id === 'batches' ? batches.length : ''})
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeSection === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-center">
              <Package className="w-6 h-6 mx-auto mb-2" /><p className="text-2xl font-bold">{products.length}</p><p className="text-xs">Products</p>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white text-center">
              <Boxes className="w-6 h-6 mx-auto mb-2" /><p className="text-2xl font-bold">{totalStock}</p><p className="text-xs">Total Stock</p>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2" /><p className="text-2xl font-bold">KSh {totalStockValue.toLocaleString()}</p><p className="text-xs">Stock Value</p>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white text-center">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" /><p className="text-2xl font-bold">{lowStockCount}</p><p className="text-xs">Low Stock</p>
            </div>
          </div>
        )}

        {activeSection === 'products' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50"><tr>
                <th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th>
                <th className="text-right p-4">Cost</th><th className="text-right p-4">Selling</th>
                <th className="text-right p-4">Stock</th><th className="text-right p-4">Value</th>
                <th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>
                {filteredProducts.map((p: any) => {
                  const stock = Number(p.stock_level || 0)
                  const price = Number(p.sellingPrice || 0)
                  return (
                    <tr key={p.id} className="border-t hover:bg-neutral-50">
                      <td className="p-4 font-bold">{p.name}</td>
                      <td className="p-4 font-mono text-sm">{p.sku || 'N/A'}</td>
                      <td className="p-4 text-right">KSh {(Number(p.costPrice) || 0).toLocaleString()}</td>
                      <td className="p-4 text-right">KSh {price.toLocaleString()}</td>
                      <td className="p-4 text-right"><span className={stock === 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{stock}</span></td>
                      <td className="p-4 text-right font-bold">KSh {(stock * price).toLocaleString()}</td>
                      <td className="p-4"><div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => deleteEntity('products', p.id, p.name, 'Product')} className="p-2 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeSection === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((w: any) => (
              <div key={w.id} className="p-4 rounded-2xl border bg-white">
                <div className="flex justify-between">
                  <div><p className="font-bold">{w.name}</p><p className="text-xs">{w.code}</p></div>
                  <button onClick={() => deleteEntity('warehouse-management', w.id, w.name, 'Warehouse')} className="p-2 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-sm mt-2">{w.address || 'No address'}</p>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'zones' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((z: any) => (
              <div key={z.id} className="p-4 rounded-2xl border bg-white flex justify-between items-center">
                <div><p className="font-bold">{z.name}</p><p className="text-xs">{z.zoneType} | {z.code}</p></div>
                <button onClick={() => deleteEntity('zones', z.id, z.name, 'Zone')} className="p-2 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'bins' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bins.map((b: any) => (
              <div key={b.id} className="p-4 rounded-2xl border bg-white flex justify-between items-center">
                <div><p className="font-bold">{b.name}</p><p className="text-xs">{b.binType} | Capacity: {b.capacity}</p></div>
                <button onClick={() => deleteEntity('bins', b.id, b.name, 'Bin')} className="p-2 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'serials' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">Serial #</th><th className="text-left p-4">Product</th><th className="text-left p-4">Status</th>
            </tr></thead>
            <tbody>{serials.map((s: any) => (
              <tr key={s.id} className="border-t">
                <td className="p-4 font-mono">{s.serialNumber}</td>
                <td className="p-4">{s.productName}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-green-100">{s.status}</span></td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'movements' && (
          <div className='bg-white rounded-2xl border overflow-hidden'>
            <table className='w-full'><thead className='bg-neutral-50'><tr>
              <th className='text-left p-4'>Type</th><th className='text-left p-4'>Product</th>
              <th className='text-right p-4'>Qty</th><th className='text-left p-4'>From</th>
              <th className='text-left p-4'>To</th><th className='text-left p-4'>Date</th>
            </tr></thead>
            <tbody>{movements.map((m: any, i: number) => (
              <tr key={m.id || i} className='border-t'>
                <td className='p-4'><span className='px-2 py-1 rounded-full text-xs bg-blue-100'>{m.movementType || m.type || 'MOVE'}</span></td>
                <td className='p-4'>{m.productName || 'N/A'}</td>
                <td className='p-4 text-right font-bold'>{m.quantity || 0}</td>
                <td className='p-4'>{m.fromLocation || 'N/A'}</td>
                <td className='p-4'>{m.toLocation || 'N/A'}</td>
                <td className='p-4 text-sm'>{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'ledger' && (
          <div className='bg-white rounded-2xl border overflow-hidden'>
            <table className='w-full'><thead className='bg-neutral-50'><tr>
              <th className='text-left p-4'>Transaction</th><th className='text-left p-4'>Product</th>
              <th className='text-right p-4'>Qty</th><th className='text-right p-4'>Before</th>
              <th className='text-right p-4'>After</th><th className='text-left p-4'>Type</th>
              <th className='text-left p-4'>Date</th>
            </tr></thead>
            <tbody>{ledger.map((l: any, i: number) => (
              <tr key={l.id || i} className='border-t'>
                <td className='p-4 font-mono text-xs'>{l.transactionId || 'N/A'}</td>
                <td className='p-4'>{l.productName || 'N/A'}</td>
                <td className='p-4 text-right font-bold'>{l.quantity || 0}</td>
                <td className='p-4 text-right'>{l.beforeQuantity || 0}</td>
                <td className='p-4 text-right'>{l.afterQuantity || 0}</td>
                <td className='p-4'><span className='px-2 py-1 rounded-full text-xs bg-green-100'>{l.transactionType || 'N/A'}</span></td>
                <td className='p-4 text-sm'>{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'atp' && (
          <div className='bg-white rounded-2xl border overflow-hidden'>
            <table className='w-full'><thead className='bg-neutral-50'><tr>
              <th className='text-left p-4'>Product</th><th className='text-right p-4'>On Hand</th>
              <th className='text-right p-4'>Available</th><th className='text-right p-4'>Reserved</th>
              <th className='text-right p-4'>ATP</th>
            </tr></thead>
            <tbody>{atpList.map((a: any) => (
              <tr key={a.id} className='border-t'>
                <td className='p-4 font-bold'>{a.name}</td>
                <td className='p-4 text-right'>{a.onHand || 0}</td>
                <td className='p-4 text-right text-green-600'>{a.available || 0}</td>
                <td className='p-4 text-right text-yellow-600'>{a.reserved || 0}</td>
                <td className='p-4 text-right font-bold text-blue-600'>{a.atpQuantity || 0}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'forecast' && forecastData && (
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-4'>
              <div className='p-4 rounded-2xl bg-green-50 text-center'><p className='text-xl font-bold'>{(forecastData.stats?.avgDailyDemand || 0)}</p><p className='text-xs'>Avg Daily Demand</p></div>
              <div className='p-4 rounded-2xl bg-blue-50 text-center'><p className='text-xl font-bold'>{(forecastData.stats?.totalForecast30Days || 0)}</p><p className='text-xs'>30-Day Forecast</p></div>
              <div className='p-4 rounded-2xl bg-yellow-50 text-center'><p className='text-xl font-bold'>{(forecastData.productForecasts?.length || 0)}</p><p className='text-xs'>Products Forecasted</p></div>
            </div>
          </div>
        )}

        {activeSection === 'abcxyz' && abcXyzData && (
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-4'>
              <div className='p-4 rounded-2xl bg-green-50 text-center'><p className='text-xl font-bold'>{abcXyzData.summary?.aClassCount || 0}</p><p className='text-xs'>A Class</p></div>
              <div className='p-4 rounded-2xl bg-yellow-50 text-center'><p className='text-xl font-bold'>{abcXyzData.summary?.bClassCount || 0}</p><p className='text-xs'>B Class</p></div>
              <div className='p-4 rounded-2xl bg-red-50 text-center'><p className='text-xl font-bold'>{abcXyzData.summary?.cClassCount || 0}</p><p className='text-xs'>C Class</p></div>
            </div>
          </div>
        )}

        {activeSection === 'tower' && controlTowerData?.controlTower && (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='p-4 rounded-2xl bg-indigo-600 text-white text-center'><p className='text-xl font-bold'>KSh {(controlTowerData.controlTower.inventoryValue || 0).toLocaleString()}</p><p className='text-xs'>Inventory Value</p></div>
              <div className='p-4 rounded-2xl bg-green-600 text-white text-center'><p className='text-xl font-bold'>{controlTowerData.controlTower.available || 0}</p><p className='text-xs'>Available</p></div>
              <div className='p-4 rounded-2xl bg-yellow-600 text-white text-center'><p className='text-xl font-bold'>{controlTowerData.controlTower.reserved || 0}</p><p className='text-xs'>Reserved</p></div>
              <div className='p-4 rounded-2xl bg-red-600 text-white text-center'><p className='text-xl font-bold'>{controlTowerData.controlTower.expiringCount || 0}</p><p className='text-xs'>Expiring</p></div>
            </div>
          </div>
        )}

        {activeSection === 'copilot' && (
          <div className='bg-white rounded-2xl border p-6'>
            <h2 className='font-bold mb-4'>AI Inventory Copilot</h2>
            <div className='flex gap-2'>
              <input type='text' value={copilotQuery} onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder='Ask: Which products will stock out?' className='flex-1 px-4 py-2.5 rounded-xl border'
                onKeyDown={(e) => { if (e.key === 'Enter') askCopilot() }} />
              <button onClick={askCopilot} className='px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold'>Ask</button>
            </div>
            {copilotAnswer && (
              <div className='mt-4 p-4 rounded-xl bg-indigo-50'><p>{copilotAnswer}</p></div>
            )}
          </div>
        )}

        {activeSection === 'anomalies' && anomaliesData && (
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-4'>
              <div className='p-4 rounded-2xl bg-red-50 text-center'><p className='text-xl font-bold'>{anomaliesData.summary?.movementAnomalies || 0}</p><p className='text-xs'>Movement Anomalies</p></div>
              <div className='p-4 rounded-2xl bg-yellow-50 text-center'><p className='text-xl font-bold'>{anomaliesData.summary?.negativeStock || 0}</p><p className='text-xs'>Negative Stock</p></div>
              <div className='p-4 rounded-2xl bg-orange-50 text-center'><p className='text-xl font-bold'>{anomaliesData.summary?.adjustmentAnomalies || 0}</p><p className='text-xs'>Adjustment Anomalies</p></div>
            </div>
          </div>
        )}

        {activeSection === 'audit' && (
          <div className='bg-white rounded-2xl border overflow-hidden'>
            <table className='w-full'><thead className='bg-neutral-50'><tr>
              <th className='text-left p-4'>Entity</th><th className='text-left p-4'>Action</th>
              <th className='text-left p-4'>Field</th><th className='text-left p-4'>Old - New</th>
              <th className='text-left p-4'>User</th><th className='text-left p-4'>Date</th>
            </tr></thead>
            <tbody>{auditTrail.map((a: any) => (
              <tr key={a.id} className='border-t'>
                <td className='p-4'>{a.entityType}</td>
                <td className='p-4'>{a.action}</td>
                <td className='p-4'>{a.fieldName || 'N/A'}</td>
                <td className='p-4 text-sm'>{a.oldValue} - {a.newValue}</td>
                <td className='p-4'>{a.userName || 'N/A'}</td>
                <td className='p-4 text-sm'>{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'batches' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">Batch #</th><th className="text-left p-4">Product</th>
              <th className="text-right p-4">Qty</th><th className="text-left p-4">Expiry</th>
            </tr></thead>
            <tbody>{batches.map((b: any) => (
              <tr key={b.id} className="border-t">
                <td className="p-4 font-mono">{b.batchNumber}</td>
                <td className="p-4">{b.productName}</td>
                <td className="p-4 text-right">{b.remainingQuantity}</td>
                <td className="p-4">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
      </main>
    </div>
  )
}