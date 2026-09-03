'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Search, Package, Printer, CheckCircle2, AlertTriangle, 
  Warehouse, MapPin, Boxes, DollarSign, TrendingUp, TrendingDown,
  BarChart3, Layers, ArrowRight, Activity, Box, Tags, Scan, Truck,
  ClipboardList, RefreshCw, ArrowLeftRight, Plus, Trash2, X,
  ArrowDown, ArrowUp, MoveRight, Calendar, Clock, PieChart, Target,
  FileText, ShoppingCart, Zap, Award, LineChart, Database,
  Brain, Shield, History, CheckSquare, Smartphone, GitBranch
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [valuation, setValuation] = useState<any>(null)
  const [reorder, setReorder] = useState<any>(null)
  const [reports, setReports] = useState<any>(null)
  const [zones, setZones] = useState<any[]>([])
  const [aisles, setAisles] = useState<any[]>([])
  const [bins, setBins] = useState<any[]>([])
  const [serials, setSerials] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [quality, setQuality] = useState<any[]>([])
  const [cycleCounts, setCycleCounts] = useState<any[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [auditTrail, setAuditTrail] = useState<any[]>([])
  const [forecast, setForecast] = useState<any>(null)
  const [abcXyz, setAbcXyz] = useState<any>(null)
  const [controlTower, setControlTower] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<any>(null)
  const [copilot, setCopilot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState('all')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showWarehouseForm, setShowWarehouseForm] = useState(false)
  const [showStockForm, setShowStockForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [copilotQuery, setCopilotQuery] = useState('')
  const [productForm, setProductForm] = useState({
    name: '', sku: '', category: '', costPrice: '', sellingPrice: '',
    minStock: '', maxStock: '', initialStock: '', unit: 'pcs', isTracked: true, trackSerial: false, trackBatch: false
  })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', address: '' })
  const [stockForm, setStockForm] = useState({ productId: '', quantity: '', movementType: 'IN', toLocation: '' })

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, productsRes, warehousesRes, valuationRes, reorderRes, reportsRes,
             zonesRes, aislesRes, binsRes, serialsRes, batchesRes, qualityRes,
             cycleCountRes, returnsRes, approvalsRes, auditRes, forecastRes,
             abcXyzRes, controlTowerRes, anomaliesRes] = await Promise.all([
        fetch('/api/wavecore/inventory/summary'),
        fetch('/api/wavecore/inventory/products'),
        fetch('/api/wavecore/inventory/warehouse-management'),
        fetch('/api/wavecore/inventory/valuation'),
        fetch('/api/wavecore/inventory/reorder'),
        fetch('/api/wavecore/inventory/reports'),
        fetch('/api/wavecore/inventory/zones'),
        fetch('/api/wavecore/inventory/aisles'),
        fetch('/api/wavecore/inventory/bins'),
        fetch('/api/wavecore/inventory/serials'),
        fetch('/api/wavecore/inventory/batches'),
        fetch('/api/wavecore/inventory/quality'),
        fetch('/api/wavecore/inventory/cycle-count'),
        fetch('/api/wavecore/inventory/returns'),
        fetch('/api/wavecore/inventory/approvals'),
        fetch('/api/wavecore/inventory/audit-trail'),
        fetch('/api/wavecore/inventory/forecast'),
        fetch('/api/wavecore/inventory/abc-xyz'),
        fetch('/api/wavecore/inventory/control-tower'),
        fetch('/api/wavecore/inventory/anomalies')
      ])
      
      setData({ ...(await summaryRes.json()), warehouses: (await warehousesRes.json()).warehouses || [] })
      setProducts((await productsRes.json()).products || [])
      setValuation(await valuationRes.json())
      setReorder(await reorderRes.json())
      setReports(await reportsRes.json())
      setZones((await zonesRes.json()).zones || [])
      setAisles((await aislesRes.json()).aisles || [])
      setBins((await binsRes.json()).bins || [])
      setSerials((await serialsRes.json()).serials || [])
      setBatches((await batchesRes.json()).batches || [])
      setQuality((await qualityRes.json()).inspections || [])
      setCycleCounts((await cycleCountRes.json()).counts || [])
      setReturns((await returnsRes.json()).returns || [])
      setApprovals((await approvalsRes.json()).approvals || [])
      setAuditTrail((await auditRes.json()).audit || [])
      setForecast(await forecastRes.json())
      setAbcXyz(await abcXyzRes.json())
      setControlTower(await controlTowerRes.json())
      setAnomalies(await anomaliesRes.json())
    } catch (err) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const askCopilot = async () => {
    if (!copilotQuery.trim()) return
    try {
      const res = await fetch(`/api/wavecore/inventory/copilot?query=${encodeURIComponent(copilotQuery)}`)
      const result = await res.json()
      setCopilot(result)
    } catch (err) {
      setError('Failed to query AI Copilot')
    }
  }

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name || !productForm.sellingPrice) { setError('Name and selling price required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, costPrice: Number(productForm.costPrice || 0), sellingPrice: Number(productForm.sellingPrice || 0), minStock: Number(productForm.minStock || 0), maxStock: Number(productForm.maxStock || 0), initialStock: Number(productForm.initialStock || 0) })
      })
      if (res.ok) { setSuccess('Product created!'); setShowProductForm(false); fetchInventory() }
    } catch (err) { setError('Failed to create product') }
  }

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!warehouseForm.name) { setError('Warehouse name required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/warehouse-management', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(warehouseForm)
      })
      if (res.ok) { setSuccess('Warehouse created!'); setShowWarehouseForm(false); fetchInventory() }
    } catch (err) { setError('Failed to create warehouse') }
  }

  const createStockMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockForm.productId || !stockForm.quantity) { setError('Product and quantity required'); return }
    try {
      const res = await fetch('/api/wavecore/inventory/movements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...stockForm, quantity: Number(stockForm.quantity) })
      })
      if (res.ok) { setSuccess('Movement recorded!'); setShowStockForm(false); fetchInventory() }
    } catch (err) { setError('Failed to record movement') }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    setDeleting(id)
    try { await fetch(`/api/wavecore/inventory/products?id=${id}`, { method: 'DELETE' }); setSuccess('Product deleted!'); fetchInventory() }
    catch (err) { setError('Delete failed') }
    finally { setDeleting('') }
  }

  const deleteWarehouse = async (id: string, name: string) => {
    if (!confirm(`Delete warehouse "${name}"?`)) return
    setDeleting(id)
    try { await fetch(`/api/wavecore/inventory/warehouse-management?id=${id}`, { method: 'DELETE' }); setSuccess('Warehouse deleted!'); fetchInventory() }
    catch (err) { setError('Delete failed') }
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

  const stats = data?.stats || {}
  const warehouses = data?.warehouses || []
  const controlTowerData = controlTower?.controlTower || null

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'bins', label: 'Bins', icon: Box },
    { id: 'serials', label: 'Serials', icon: Scan },
    { id: 'batches', label: 'Batches', icon: Layers },
    { id: 'quality', label: 'Quality', icon: Shield },
    { id: 'counts', label: 'Counts', icon: ClipboardList },
    { id: 'returns', label: 'Returns', icon: ArrowLeftRight },
    { id: 'valuation', label: 'Valuation', icon: DollarSign },
    { id: 'reorder', label: 'Reorder', icon: ShoppingCart },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'abcxyz', label: 'ABC/XYZ', icon: PieChart },
    { id: 'tower', label: 'Control Tower', icon: Target },
    { id: 'copilot', label: 'AI Copilot', icon: Brain },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Inventory Intelligence</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-indigo-500" /> Inventory ({products.length})
            </h1>
            <p className="text-sm text-muted-foreground mt-1">World-class Inventory Intelligence Platform</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowProductForm(!showProductForm)} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Product</button>
            <button onClick={() => setShowWarehouseForm(!showWarehouseForm)} className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2"><Warehouse className="w-4 h-4" /> Warehouse</button>
            <button onClick={() => setShowStockForm(!showStockForm)} className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Movement</button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* FORMS */}
        {showProductForm && (
          <form onSubmit={createProduct} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">New Product</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Product Name *" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="px-4 py-2.5 rounded-xl border" />
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

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap text-sm transition-colors ${
                activeSection === tab.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-900 text-muted-foreground hover:bg-neutral-100'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {controlTowerData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-2xl font-bold">KSh {(controlTowerData.inventoryValue || 0).toLocaleString()}</p>
                  <p className="text-xs opacity-80">Inventory Value</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white text-center">
                  <Boxes className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{(controlTowerData.totalQuantity || 0).toLocaleString()}</p>
                  <p className="text-xs opacity-80">Total Units</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{controlTowerData.stockoutRisk || 0}</p>
                  <p className="text-xs opacity-80">Stockout Risk</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white text-center">
                  <Warehouse className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{controlTowerData.totalWarehouses || 0}</p>
                  <p className="text-xs opacity-80">Warehouses</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{products.length}</p><p className="text-xs">Products</p></div>
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{warehouses.length}</p><p className="text-xs">Warehouses</p></div>
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{zones.length}</p><p className="text-xs">Zones</p></div>
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{bins.length}</p><p className="text-xs">Bins</p></div>
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{serials.length}</p><p className="text-xs">Serials</p></div>
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{batches.length}</p><p className="text-xs">Batches</p></div>
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{quality.length}</p><p className="text-xs">Quality Checks</p></div>
              <div className="p-4 rounded-2xl bg-white border text-center"><p className="text-xl font-bold">{returns.length}</p><p className="text-xs">Returns</p></div>
            </div>
          </div>
        )}

        {activeSection === 'products' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50"><tr>
                <th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th>
                <th className="text-right p-4">Cost</th><th className="text-right p-4">Selling</th>
                <th className="text-right p-4">Stock</th><th className="text-right p-4">Value</th>
                <th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((p: any) => {
                  const stock = Number(p.stock_level || 0)
                  const price = Number(p.sellingPrice || 0)
                  return (
                    <tr key={p.id} className="border-t hover:bg-neutral-50">
                      <td className="p-4 font-bold">{p.name}</td>
                      <td className="p-4 font-mono text-sm">{p.sku || 'N/A'}</td>
                      <td className="p-4 text-right">KSh {(Number(p.costPrice) || 0).toLocaleString()}</td>
                      <td className="p-4 text-right">KSh {price.toLocaleString()}</td>
                      <td className="p-4 text-right"><span className={stock === 0 ? 'text-red-600 font-bold' : stock < 10 ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold'}>{stock}</span></td>
                      <td className="p-4 text-right font-bold">KSh {(stock * price).toLocaleString()}</td>
                      <td className="p-4"><div className="flex gap-2 justify-center">
                        <button onClick={() => downloadPdf(p.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(p.id, p.name)} className="p-2 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
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
            {warehouses.map((wh: any) => (
              <div key={wh.id} className="p-4 rounded-2xl border bg-white">
                <div className="flex justify-between">
                  <div><p className="font-bold">{wh.name}</p><p className="text-xs">{wh.code}</p></div>
                  <button onClick={() => deleteWarehouse(wh.id, wh.name)} className="p-2 rounded-lg bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{wh.address || 'No address'}</p>
                <div className="flex gap-4 mt-3 text-sm"><span>Stock: <b>{wh.totalStock || 0}</b></span><span>Value: <b>KSh {(wh.stockValue || 0).toLocaleString()}</b></span></div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'zones' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((z: any) => (
              <div key={z.id} className="p-4 rounded-2xl border bg-white flex justify-between">
                <div><p className="font-bold">{z.name}</p><p className="text-xs">{z.zoneType} | {z.code}</p></div>
                <span className="text-xs">Aisles: {z.aisleCount || 0} | Bins: {z.binCount || 0}</span>
              </div>
            ))}
            {zones.length === 0 && <p className="text-muted-foreground">No zones yet</p>}
          </div>
        )}

        {activeSection === 'bins' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bins.map((b: any) => (
              <div key={b.id} className="p-4 rounded-2xl border bg-white">
                <p className="font-bold">{b.name}</p>
                <p className="text-xs">{b.binType} | {b.code}</p>
                <div className="flex gap-4 mt-2 text-sm"><span>Stock: <b>{b.currentStock || 0}</b></span><span>Capacity: <b>{b.capacity || 0}</b></span></div>
              </div>
            ))}
            {bins.length === 0 && <p className="text-muted-foreground">No bins yet</p>}
          </div>
        )}

        {activeSection === 'serials' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">Serial #</th><th className="text-left p-4">Product</th>
              <th className="text-left p-4">Status</th><th className="text-left p-4">Location</th>
            </tr></thead>
            <tbody>{serials.map((s: any) => (
              <tr key={s.id} className="border-t">
                <td className="p-4 font-mono">{s.serialNumber}</td>
                <td className="p-4">{s.productName}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-green-100">{s.status}</span></td>
                <td className="p-4">{s.warehouseName || s.binLocation || 'N/A'}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'batches' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">Batch #</th><th className="text-left p-4">Product</th>
              <th className="text-right p-4">Qty</th><th className="text-left p-4">Expiry</th><th className="text-left p-4">Status</th>
            </tr></thead>
            <tbody>{batches.map((b: any) => (
              <tr key={b.id} className="border-t">
                <td className="p-4 font-mono">{b.batchNumber}</td>
                <td className="p-4">{b.productName}</td>
                <td className="p-4 text-right">{b.remainingQuantity}</td>
                <td className="p-4">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100">{b.qualityStatus}</span></td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'quality' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">#</th><th className="text-left p-4">Product</th>
              <th className="text-left p-4">Type</th><th className="text-left p-4">Status</th>
              <th className="text-right p-4">Defects</th>
            </tr></thead>
            <tbody>{quality.map((q: any) => (
              <tr key={q.id} className="border-t">
                <td className="p-4 font-mono text-sm">{q.number}</td>
                <td className="p-4">{q.productName}</td>
                <td className="p-4">{q.inspectionType}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-green-100">{q.status}</span></td>
                <td className="p-4 text-right">{q.defectCount || 0}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'counts' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">#</th><th className="text-left p-4">Product</th>
              <th className="text-right p-4">Expected</th><th className="text-right p-4">Counted</th>
              <th className="text-right p-4">Variance</th><th className="text-left p-4">Status</th>
            </tr></thead>
            <tbody>{cycleCounts.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-4 font-mono text-sm">{c.number}</td>
                <td className="p-4">{c.productName}</td>
                <td className="p-4 text-right">{c.expectedQuantity}</td>
                <td className="p-4 text-right">{c.countedQuantity || 'N/A'}</td>
                <td className="p-4 text-right">{c.variance || 0}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100">{c.status}</span></td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'returns' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">#</th><th className="text-left p-4">Product</th>
              <th className="text-right p-4">Qty</th><th className="text-left p-4">Reason</th>
              <th className="text-left p-4">Status</th><th className="text-left p-4">Disposition</th>
            </tr></thead>
            <tbody>{returns.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-4 font-mono text-sm">{r.number}</td>
                <td className="p-4">{r.productName}</td>
                <td className="p-4 text-right">{r.quantity}</td>
                <td className="p-4">{r.returnReason || 'N/A'}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100">{r.status}</span></td>
                <td className="p-4">{r.disposition}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'valuation' && valuation && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-green-50 text-center"><p className="text-xl font-bold">KSh {(valuation.summary?.totalInventoryValue || 0).toLocaleString()}</p><p className="text-xs">Total Value</p></div>
              <div className="p-4 rounded-2xl bg-blue-50 text-center"><p className="text-xl font-bold">{valuation.summary?.avgDaysOfSupply || 0} days</p><p className="text-xs">Avg Days Supply</p></div>
              <div className="p-4 rounded-2xl bg-yellow-50 text-center"><p className="text-xl font-bold">{valuation.summary?.totalSlowMoving || 0}</p><p className="text-xs">Slow Moving</p></div>
            </div>
          </div>
        )}

        {activeSection === 'reorder' && reorder && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white">
              <p className="text-3xl font-bold">{reorder.reorderList?.length || 0} items need reordering</p>
              <p className="text-sm">Total value: KSh {(reorder.totalReorderValue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl border overflow-hidden">
              <table className="w-full"><thead className="bg-neutral-50"><tr>
                <th className="text-left p-4">Product</th><th className="text-right p-4">Current</th>
                <th className="text-right p-4">Suggested</th><th className="text-right p-4">Value</th>
              </tr></thead>
              <tbody>{reorder.reorderList?.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-4 font-bold">{r.name}</td>
                  <td className="p-4 text-right text-red-600">{r.currentStock}</td>
                  <td className="p-4 text-right font-bold">{r.suggestedOrderQty}</td>
                  <td className="p-4 text-right">KSh {(r.suggestedOrderValue || 0).toLocaleString()}</td>
                </tr>
              ))}</tbody></table>
            </div>
          </div>
        )}

        {activeSection === 'forecast' && forecast && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-bold mb-4">Demand Forecast</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {forecast.productForecasts?.map((f: any, i: number) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl bg-neutral-50">
                    <span className="font-bold">{f.name}</span>
                    <span>30-day: <b>{f.forecast30Days}</b> units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'abcxyz' && abcXyz && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-green-50 text-center"><p className="text-xl font-bold">{abcXyz.summary?.aClassCount || 0}</p><p className="text-xs">A Class</p></div>
              <div className="p-4 rounded-2xl bg-yellow-50 text-center"><p className="text-xl font-bold">{abcXyz.summary?.bClassCount || 0}</p><p className="text-xs">B Class</p></div>
              <div className="p-4 rounded-2xl bg-red-50 text-center"><p className="text-xl font-bold">{abcXyz.summary?.cClassCount || 0}</p><p className="text-xs">C Class</p></div>
            </div>
          </div>
        )}

        {activeSection === 'tower' && controlTowerData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-600 text-white text-center"><p className="text-xl font-bold">KSh {(controlTowerData.inventoryValue || 0).toLocaleString()}</p><p className="text-xs">Inventory Value</p></div>
              <div className="p-4 rounded-2xl bg-green-600 text-white text-center"><p className="text-xl font-bold">{controlTowerData.available || 0}</p><p className="text-xs">Available</p></div>
              <div className="p-4 rounded-2xl bg-yellow-600 text-white text-center"><p className="text-xl font-bold">{controlTowerData.reserved || 0}</p><p className="text-xs">Reserved</p></div>
              <div className="p-4 rounded-2xl bg-red-600 text-white text-center"><p className="text-xl font-bold">{controlTowerData.expiringCount || 0}</p><p className="text-xs">Expiring</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border"><p className="text-sm">Dead Stock</p><p className="text-xl font-bold">KSh {(controlTowerData.deadStockValue || 0).toLocaleString()}</p></div>
              <div className="p-4 rounded-2xl bg-white border"><p className="text-sm">Overstock</p><p className="text-xl font-bold">KSh {(controlTowerData.overstockValue || 0).toLocaleString()}</p></div>
              <div className="p-4 rounded-2xl bg-white border"><p className="text-sm">Potential Profit</p><p className="text-xl font-bold text-green-600">KSh {(controlTowerData.potentialProfit || 0).toLocaleString()}</p></div>
            </div>
          </div>
        )}

        {activeSection === 'copilot' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-500" /> AI Inventory Copilot</h2>
              <div className="flex gap-2">
                <input type="text" value={copilotQuery} onChange={(e) => setCopilotQuery(e.target.value)}
                  placeholder="Ask: Which products will stock out?" className="flex-1 px-4 py-2.5 rounded-xl border" />
                <button onClick={askCopilot} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">Ask</button>
              </div>
              {copilot && (
                <div className="mt-4 p-4 rounded-xl bg-indigo-50">
                  <p>{copilot.answer}</p>
                  {copilot.suggestions && copilot.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {copilot.suggestions.map((s: string, i: number) => (
                        <button key={i} onClick={() => setCopilotQuery(s)} className="text-sm text-indigo-600 hover:underline">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'anomalies' && anomalies && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-red-50 text-center"><p className="text-xl font-bold">{anomalies.summary?.movementAnomalies || 0}</p><p className="text-xs">Movement Anomalies</p></div>
              <div className="p-4 rounded-2xl bg-yellow-50 text-center"><p className="text-xl font-bold">{anomalies.summary?.negativeStock || 0}</p><p className="text-xs">Negative Stock</p></div>
              <div className="p-4 rounded-2xl bg-orange-50 text-center"><p className="text-xl font-bold">{anomalies.summary?.adjustmentAnomalies || 0}</p><p className="text-xs">Adjustment Anomalies</p></div>
            </div>
          </div>
        )}

        {activeSection === 'approvals' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">#</th><th className="text-left p-4">Type</th>
              <th className="text-left p-4">Requested By</th><th className="text-right p-4">Value</th>
              <th className="text-left p-4">Status</th>
            </tr></thead>
            <tbody>{approvals.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="p-4 font-mono text-sm">{a.number}</td>
                <td className="p-4">{a.approvalType}</td>
                <td className="p-4">{a.requestedByName || 'N/A'}</td>
                <td className="p-4 text-right">KSh {(a.requestedValue || 0).toLocaleString()}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100">{a.status}</span></td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'audit' && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full"><thead className="bg-neutral-50"><tr>
              <th className="text-left p-4">Entity</th><th className="text-left p-4">Action</th>
              <th className="text-left p-4">Field</th><th className="text-left p-4">Old → New</th>
              <th className="text-left p-4">User</th><th className="text-left p-4">Date</th>
            </tr></thead>
            <tbody>{auditTrail.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="p-4">{a.entityType}</td>
                <td className="p-4">{a.action}</td>
                <td className="p-4">{a.fieldName || 'N/A'}</td>
                <td className="p-4 text-sm">{a.oldValue} → {a.newValue}</td>
                <td className="p-4">{a.userName || 'N/A'}</td>
                <td className="p-4 text-sm">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody></table>
          </div>
        )}

        {activeSection === 'reports' && reports && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-bold mb-4">Stock Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-neutral-50 rounded-xl"><span>Total Products</span><b>{reports.summary?.totalProducts || 0}</b></div>
                <div className="flex justify-between p-3 bg-neutral-50 rounded-xl"><span>Total Units</span><b>{reports.summary?.totalStockUnits || 0}</b></div>
                <div className="flex justify-between p-3 bg-neutral-50 rounded-xl"><span>Cost Value</span><b>KSh {(reports.summary?.totalCostValue || 0).toLocaleString()}</b></div>
                <div className="flex justify-between p-3 bg-neutral-50 rounded-xl"><span>Selling Value</span><b>KSh {(reports.summary?.totalSellingValue || 0).toLocaleString()}</b></div>
                <div className="flex justify-between p-3 bg-green-50 rounded-xl"><span>Profit Value</span><b>KSh {(reports.summary?.totalProfitValue || 0).toLocaleString()}</b></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-bold mb-4">Stock Classification</h2>
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-red-50 rounded-xl"><span>Out of Stock</span><b>{reports.summary?.outOfStock || 0}</b></div>
                <div className="flex justify-between p-3 bg-yellow-50 rounded-xl"><span>Low Stock</span><b>{reports.summary?.lowStock || 0}</b></div>
                <div className="flex justify-between p-3 bg-orange-50 rounded-xl"><span>Overstocked</span><b>{reports.summary?.overstocked || 0}</b></div>
                <div className="flex justify-between p-3 bg-green-50 rounded-xl"><span>Optimal</span><b>{reports.summary?.optimal || 0}</b></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}