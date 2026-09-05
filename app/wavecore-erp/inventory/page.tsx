'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Boxes, DollarSign, AlertTriangle,
  RefreshCw, Activity, XCircle, CheckCircle2, ArrowLeftRight, ArrowRight, ArrowLeft,
  ClipboardList, Sliders, Layers
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

  useEffect(() => { fetchData() }, [])

  const kpis = data?.kpis || {}
  const recentMovements = data?.recentMovements || []
  const lowStockProducts = data?.lowStockProducts || []

  const navItems = [
    { href: '/wavecore-erp/inventory/products', label: 'Products', icon: Package, color: 'indigo', description: 'Manage products' },
    { href: '/wavecore-erp/inventory/warehouses', label: 'Warehouses', icon: Warehouse, color: 'purple', description: 'Manage warehouses' },
    { href: '/wavecore-erp/inventory/movements', label: 'Movements', icon: ArrowLeftRight, color: 'green', description: 'Stock in/out' },
    { href: '/wavecore-erp/inventory/adjustments', label: 'Adjustments', icon: Sliders, color: 'orange', description: 'Stock adjustments' },
    { href: '/wavecore-erp/inventory/counts', label: 'Counts', icon: ClipboardList, color: 'cyan', description: 'Cycle counts' },
    { href: '/wavecore-erp/inventory/ledger', label: 'Ledger', icon: Layers, color: 'yellow', description: 'Transaction history' }
  ]

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Dark Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 z-50">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/wavecore-erp" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back to ERP
          </Link>
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600 text-white font-bold">
            <Activity className="w-5 h-5" /> Dashboard
          </Link>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
              <item.icon className="w-5 h-5" /> {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" /> Inventory Dashboard
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Real-time inventory command center</p>
          </div>
          <button onClick={fetchData}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg">
                <Package className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.totalProducts}</p>
                <p className="text-xs opacity-80 mt-1">Total Products</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
                <Boxes className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.totalUnits.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Total Units</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
                <DollarSign className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KSh {kpis.totalSellingValue.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Stock Value</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg">
                <Warehouse className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.totalWarehouses}</p>
                <p className="text-xs opacity-80 mt-1">Warehouses</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg">
                <XCircle className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.outOfStockCount}</p>
                <p className="text-xs opacity-80 mt-1">Out of Stock</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg">
                <AlertTriangle className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.lowStockCount}</p>
                <p className="text-xs opacity-80 mt-1">Low Stock</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-700 text-white shadow-lg">
                <Activity className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{kpis.movements24h}</p>
                <p className="text-xs opacity-80 mt-1">Movements (24h)</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                <DollarSign className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KSh {kpis.grossMargin.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Gross Margin</p>
              </div>
            </div>

            {/* NAVIGATION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}
                  className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-indigo-600 hover:bg-neutral-800/50 transition-all group">
                  <item.icon className="w-8 h-8 text-indigo-500 mb-3" />
                  <p className="font-bold text-white text-lg group-hover:text-indigo-300">{item.label}</p>
                  <p className="text-sm text-neutral-400 mt-1">{item.description}</p>
                  <div className="flex items-center gap-1 text-indigo-400 mt-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              ))}
            </div>

            {/* RECENT MOVEMENTS + LOW STOCK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h2 className="font-bold text-lg text-white mb-4">Recent Movements</h2>
                {recentMovements.length === 0 ? (
                  <p className="text-neutral-400 text-center py-4">No movements</p>
                ) : (
                  <div className="space-y-2">
                    {recentMovements.map((m: any, i: number) => (
                      <div key={i} className="flex justify-between p-3 rounded-xl bg-neutral-800">
                        <div>
                          <p className="font-bold text-white">{m.productName}</p>
                          <p className="text-xs text-neutral-400">{m.type}</p>
                        </div>
                        <span className="font-bold text-white">{m.quantity} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h2 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" /> Low Stock Alerts
                </h2>
                {lowStockProducts.length === 0 ? (
                  <p className="text-green-400 text-center py-4 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> All stocked
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lowStockProducts.map((p: any) => (
                      <div key={p.id} className="flex justify-between p-3 rounded-xl bg-yellow-900/30">
                        <div>
                          <p className="font-bold text-white">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.sku}</p>
                        </div>
                        <p className="font-bold text-yellow-400">{p.currentStock} / {p.minStock}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}