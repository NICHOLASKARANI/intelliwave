'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Search, Package, Printer, CheckCircle2, AlertTriangle, 
  Warehouse, MapPin, Boxes, DollarSign, TrendingUp, TrendingDown,
  BarChart3, Layers, ArrowRight, Activity, Box, Tags, Scan, Truck,
  ClipboardList, RefreshCw, ArrowLeftRight
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState('overview')
  const [activeSection, setActiveSection] = useState('dashboard')

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/summary')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const stats = data?.stats || {}
  const lowStockProducts = data?.lowStockProducts || []
  const recentMovements = data?.recentMovements || []
  const warehouses = data?.warehouses || []
  const stockByCategory = data?.stockByCategory || []

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
              <Warehouse className="w-6 h-6 text-indigo-500" /> Inventory Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time inventory management and analytics</p>
          </div>
          <button onClick={fetchInventory}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* NAVIGATION TABS */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
                { id: 'lowstock', label: 'Low Stock', icon: AlertTriangle },
                { id: 'movements', label: 'Movements', icon: ArrowLeftRight },
                { id: 'categories', label: 'Categories', icon: Tags }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveSection(tab.id)}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                    activeSection === tab.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-900 text-muted-foreground hover:bg-neutral-100'
                  }`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeSection === 'dashboard' && (
              <>
                {/* MAIN KPI CARDS - CLICKABLE */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <button onClick={() => setActiveView('products')}
                    className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'products' ? 'ring-4 ring-indigo-300' : ''}`}
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                    <Package className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.totalProducts || 0}</p>
                    <p className="text-xs opacity-80">Total Products</p>
                  </button>
                  <button onClick={() => setActiveView('quantity')}
                    className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'quantity' ? 'ring-4 ring-blue-300' : ''}`}
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                    <Boxes className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{(stats.totalQuantity || 0).toLocaleString()}</p>
                    <p className="text-xs opacity-80">Total Quantity</p>
                  </button>
                  <button onClick={() => setActiveView('value')}
                    className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'value' ? 'ring-4 ring-green-300' : ''}`}
                    style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
                    <DollarSign className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">KSh {(stats.totalSellingValue || 0).toLocaleString()}</p>
                    <p className="text-xs opacity-80">Stock Value</p>
                  </button>
                  <button onClick={() => setActiveView('warehouses')}
                    className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'warehouses' ? 'ring-4 ring-purple-300' : ''}`}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                    <Warehouse className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.totalWarehouses || 0}</p>
                    <p className="text-xs opacity-80">Warehouses</p>
                  </button>
                </div>

                {/* SECONDARY KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                    <Scan className="w-5 h-5 mx-auto mb-2 text-cyan-500" />
                    <p className="text-xl font-bold">{stats.trackedProducts || 0}</p>
                    <p className="text-xs text-muted-foreground">Tracked Products</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                    <MapPin className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                    <p className="text-xl font-bold">{stats.totalLocations || 0}</p>
                    <p className="text-xs text-muted-foreground">Stock Locations</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
                    <p className="text-xl font-bold">KSh {(stats.potentialProfit || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Potential Profit</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-red-500" />
                    <p className="text-xl font-bold">{stats.lowStockCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Low Stock Alerts</p>
                  </div>
                </div>

                {/* STOCK VALUE SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" /> Stock Valuation
                    </h2>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                        <span className="text-sm text-muted-foreground">Cost Value</span>
                        <span className="font-bold">KSh {(stats.totalCostValue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                        <span className="text-sm text-muted-foreground">Selling Value</span>
                        <span className="font-bold text-green-600">KSh {(stats.totalSellingValue || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <span className="text-sm font-bold text-emerald-700">Potential Profit</span>
                        <span className="font-bold text-emerald-700">KSh {(stats.potentialProfit || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Boxes className="w-5 h-5 text-blue-500" /> Stock Quantity Breakdown
                    </h2>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                        <span className="text-sm text-muted-foreground">Total Quantity</span>
                        <span className="font-bold">{(stats.totalQuantity || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="font-bold text-green-600">{(stats.availableQuantity || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                        <span className="text-sm text-muted-foreground">Reserved</span>
                        <span className="font-bold text-yellow-600">{(stats.reservedQuantity || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT MOVEMENTS */}
                {recentMovements.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-500" /> Recent Stock Movements
                    </h2>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentMovements.map((movement: any, i: number) => (
                        <div key={movement.id || i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                          <div>
                            <p className="font-bold text-sm">{movement.productName || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">
                              {movement.fromLocation || 'N/A'} → {movement.toLocation || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{movement.quantity || 0} units</p>
                            <p className="text-xs text-muted-foreground">{movement.movementType || 'MOVE'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeSection === 'warehouses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouses.map((wh: any) => (
                  <div key={wh.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                    <div className="flex items-center gap-3 mb-3">
                      <Warehouse className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="font-bold">{wh.name}</p>
                        <p className="text-xs text-muted-foreground">{wh.code || 'N/A'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{wh.address || 'No address'}</p>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Locations</p>
                        <p className="font-bold">{wh.locationCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Stock</p>
                        <p className="font-bold">{wh.totalStock || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${wh.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {wh.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {warehouses.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">No warehouses configured</div>
                )}
              </div>
            )}

            {activeSection === 'lowstock' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left p-4 text-sm">Product</th>
                      <th className="text-left p-4 text-sm">SKU</th>
                      <th className="text-right p-4 text-sm">Current Stock</th>
                      <th className="text-right p-4 text-sm">Reorder Level</th>
                      <th className="text-right p-4 text-sm">Max Stock</th>
                      <th className="text-right p-4 text-sm">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product: any) => (
                      <tr key={product.id} className="border-t hover:bg-neutral-50">
                        <td className="p-4 font-bold">{product.name}</td>
                        <td className="p-4 font-mono text-sm">{product.sku || 'N/A'}</td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-red-600">{product.currentStock || 0}</span>
                        </td>
                        <td className="p-4 text-right">{product.reorderLevel || 10}</td>
                        <td className="p-4 text-right">{product.maxStock || 'N/A'}</td>
                        <td className="p-4 text-right">KSh {(product.sellingPrice || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-green-600">All products are well stocked ✓</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === 'movements' && (
              <div className="space-y-3">
                {recentMovements.map((movement: any, i: number) => (
                  <div key={movement.id || i} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{movement.productName || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {movement.fromLocation || 'N/A'} <ArrowRight className="w-3 h-3" /> {movement.toLocation || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(movement.createdAt).toLocaleString('en-KE')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{movement.quantity || 0} units</p>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">{movement.movementType || 'MOVE'}</span>
                    </div>
                  </div>
                ))}
                {recentMovements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No stock movements recorded</div>
                )}
              </div>
            )}

            {activeSection === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stockByCategory.map((cat: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{cat.category}</p>
                        <p className="text-sm text-muted-foreground">{cat.productCount} products</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{cat.totalQuantity} units</p>
                        <p className="text-sm text-green-600">KSh {(cat.stockValue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {stockByCategory.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">No categories with stock</div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}