'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Package, ShoppingCart, TrendingUp, DollarSign,
  Users, Truck, AlertTriangle, Search, Plus, Download, Calculator,
  BarChart3, Settings, ArrowRight, Loader2, CreditCard, Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StoreStats {
  todayProfit: number
  todaySales: number
  todayOrders: number
  todayStockIn: number
  todayExpenses: number
  totalStockValue: number
  lowStockCount: number
  totalProducts: number
  totalSuppliers: number
}

export default function StoreManagerPage() {
  const [stats, setStats] = useState<StoreStats>({
    todayProfit: 0, todaySales: 0, todayOrders: 0, todayStockIn: 0,
    todayExpenses: 0, totalStockValue: 0, lowStockCount: 0, totalProducts: 0, totalSuppliers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('today')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [prodRes, stockRes] = await Promise.all([
          fetch('/api/wavecore/inventory/products'),
          fetch('/api/wavecore/inventory/summary'),
        ])
        const prodData = await prodRes.json()
        const stockData = await stockRes.json()
        setStats(prev => ({
          ...prev,
          totalProducts: prodData.products?.length || 0,
          totalStockValue: stockData.summary?.totalStockValue || 0,
          lowStockItems: stockData.summary?.lowStockItems || 0,
        }))
      } catch {} finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const formatKES = (amount: number) => 'KSh ' + (amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const navItems = [
    { icon: Package, label: 'Products', href: '/wavecore-erp/store/products', color: 'text-blue-500' },
    { icon: ShoppingCart, label: 'Add Sale', href: '/wavecore-erp/store/sales/create', color: 'text-green-500' },
    { icon: Truck, label: 'Stock In', href: '/wavecore-erp/store/stock-in', color: 'text-orange-500' },
    { icon: Users, label: 'Suppliers', href: '/wavecore-erp/store/suppliers', color: 'text-purple-500' },
    { icon: TrendingUp, label: 'Insights', href: '/wavecore-erp/store/insights', color: 'text-teal-500' },
    { icon: Calculator, label: 'Cash Flow', href: '/wavecore-erp/store/cash-flow', color: 'text-indigo-500' },
    { icon: AlertTriangle, label: 'Restock Alerts', href: '/wavecore-erp/store/restock', color: 'text-red-500' },
    { icon: Phone, label: 'Settlements', href: '/wavecore-erp/store/settlements', color: 'text-pink-500' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold text-lg">WaveCore</span>
            </Link>
            <span className="text-sm">Store Manager</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
            <Link href="/wavecore-erp/store/products/create"><Button className="gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Product</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KPICard label="Today Profit" value={formatKES(stats.todayProfit)} icon={TrendingUp} color="text-emerald-500" />
              <KPICard label="Today Sales" value={formatKES(stats.todaySales)} icon={DollarSign} color="text-green-500" />
              <KPICard label="Today Orders" value={stats.todayOrders.toString()} icon={ShoppingCart} color="text-blue-500" />
              <KPICard label="Today Stock In" value={stats.todayStockIn.toString()} icon={Truck} color="text-orange-500" />
              <KPICard label="Today Expenses" value={formatKES(stats.todayExpenses)} icon={CreditCard} color="text-red-500" />
              <KPICard label="Stock Value" value={formatKES(stats.totalStockValue)} icon={Package} color="text-purple-500" />
              <KPICard label="Products" value={stats.totalProducts.toString()} icon={Package} color="text-teal-500" />
              <KPICard label="Low Stock" value={stats.lowStockCount.toString()} icon={AlertTriangle} color="text-amber-500" />
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or barcode..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setViewMode('today')} className={`px-4 py-2 rounded-xl text-sm font-medium ${viewMode === 'today' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-800'}`}>Today</button>
              <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-xl text-sm font-medium ${viewMode === 'month' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-800'}`}>This Month</button>
              <button onClick={() => setViewMode('range')} className={`px-4 py-2 rounded-xl text-sm font-medium ${viewMode === 'range' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-neutral-800'}`}>Range View</button>
            </div>

            {/* Navigation Grid */}
            <h2 className="text-lg font-bold mb-4">Store Management</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.label} href={item.href}
                    className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-lg transition-all text-center group">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <p className="font-medium text-sm">{item.label}</p>
                  </Link>
                )
              })}
            </div>

            {/* Store Modes */}
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Categories', href: '/wavecore-erp/store/categories', icon: Package },
                { label: 'All Items', href: '/wavecore-erp/store/products', icon: Package },
                { label: 'Stock Value', href: '/wavecore-erp/store/stock-value', icon: DollarSign },
                { label: 'Profit Estimate', href: '/wavecore-erp/store/profit', icon: TrendingUp },
                { label: 'Stock Transfer', href: '/wavecore-erp/store/transfer', icon: Truck },
                { label: 'My Stock', href: '/wavecore-erp/store/stock', icon: Package },
                { label: 'Offers', href: '/wavecore-erp/store/offers', icon: ShoppingCart },
                { label: 'Counts', href: '/wavecore-erp/store/counts', icon: Calculator },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.label} href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 text-sm">
                    <Icon className="w-4 h-4 text-indigo-500" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}