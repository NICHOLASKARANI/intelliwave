'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Boxes, DollarSign, AlertTriangle,
  RefreshCw, TrendingUp, TrendingDown, Activity, XCircle, CheckCircle2
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/command-center')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
          <span className="text-sm text-muted-foreground">Inventory Command Center</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-indigo-600" /> Inventory Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time inventory intelligence</p>
          </div>
          <button onClick={fetchData}
            className="px-4 py-2.5 rounded-xl bg-white border font-bold flex items-center gap-2 hover:bg-neutral-100">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" /></div>
        ) : (
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
                <TrendingUp className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KSh {kpis.grossMargin.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Gross Margin</p>
              </div>
            </div>

            {/* RECENT MOVEMENTS */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> Recent Movements
              </h2>
              {recentMovements.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent movements</p>
              ) : (
                <div className="space-y-2">
                  {recentMovements.map((m: any, i: number) => (
                    <div key={m.id || i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50">
                      <div>
                        <p className="font-bold">{m.productName || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{m.type || 'MOVEMENT'} | {new Date(m.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="font-bold">{m.quantity || 0} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LOW STOCK ALERTS */}
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
        )}
      </main>
    </div>
  )
}