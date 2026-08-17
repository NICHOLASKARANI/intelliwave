'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Package, Warehouse, Truck, TrendingUp, AlertTriangle, Search,
  Download, Plus, Loader2, ArrowRight, Boxes, BarChart3, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalProducts: 0, totalStockValue: 0, lowStockItems: 0,
    outOfStockItems: 0, warehouses: 0, recentMovements: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [prodRes, summaryRes] = await Promise.all([
          fetch('/api/wavecore/inventory/products'),
          fetch('/api/wavecore/inventory/summary'),
        ])
        const prodData = await prodRes.json()
        const summaryData = await summaryRes.json()
        setStats({
          totalProducts: prodData.products?.length || 0,
          totalStockValue: summaryData.summary?.totalStockValue || 0,
          lowStockItems: summaryData.summary?.lowStockItems || 0,
          outOfStockItems: summaryData.summary?.outOfStockItems || 0,
          warehouses: summaryData.summary?.warehouses || 0,
          recentMovements: summaryData.recentMovements || [],
        })
      } catch {} finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const quickActions = [
    { label: 'Add Product', href: '/wavecore-erp/inventory/products/create', icon: Plus, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Warehouses', href: '/wavecore-erp/inventory/warehouses', icon: Warehouse, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
    { label: 'Stock Movements', href: '/wavecore-erp/inventory/movements', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'Summary', href: '/wavecore-erp/inventory/summary', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Inventory</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Inventory Management</h1>
          <p className="text-white/80 text-sm">Total Stock Value: {formatKES(stats.totalStockValue)}</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KPICard label="Products" value={stats.totalProducts} icon={Package} color="text-blue-500" />
              <KPICard label="Stock Value" value={formatKES(stats.totalStockValue)} icon={DollarSign} color="text-emerald-500" />
              <KPICard label="Low Stock" value={stats.lowStockItems} icon={AlertTriangle} color="text-amber-500" />
              <KPICard label="Out of Stock" value={stats.outOfStockItems} icon={Boxes} color="text-red-500" />
            </div>

            {/* Quick Actions */}
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {quickActions.map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.label} href={a.href} className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-orange-300 hover:shadow-md transition-all">
                    <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${a.color}`} /></div>
                    <span className="text-sm font-medium">{a.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Recent Movements */}
            <h2 className="text-lg font-bold mb-4">Recent Movements</h2>
            {stats.recentMovements.length > 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
                {stats.recentMovements.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-4 border-b">
                    <div>
                      <p className="font-medium">{m.product_name}</p>
                      <p className="text-xs text-muted-foreground">{m.type} • {new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`font-bold ${m.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.type === 'RECEIPT' ? '+' : '-'}{m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No stock movements yet</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}