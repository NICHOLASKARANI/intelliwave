'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package, Loader2, ChevronLeft, TrendingUp, ShoppingBag, Store, Star,
  AlertTriangle, ArrowRight, Wallet, Clock,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardData {
  kpi: {
    totalSales: number
    totalOrders: number
    activeListings: number
    avgRating: number
    needsActionCount: number
    lowStockCount: number
  }
  revenueSeries: { day: string, revenue: number }[]
  recentOrders: any[]
  topProducts: any[]
  lowStock: any[]
}

const STATUS_COLORS: Record<string, string> = {
  'AWAITING_SELLER_ACCEPT': 'bg-yellow-500/20 text-yellow-400',
  'SELLER_ACCEPTED': 'bg-blue-500/20 text-blue-400',
  'AWAITING_SELLER_VERIFICATION': 'bg-purple-500/20 text-purple-400',
  'CONFIRMED': 'bg-green-500/20 text-green-400',
  'SHIPPED': 'bg-blue-500/20 text-blue-400',
  'DELIVERED': 'bg-emerald-500/20 text-emerald-400',
}

export default function SellerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace/seller/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p>Unable to load dashboard</p>
      </div>
    )
  }

  const k = data.kpi

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Store className="w-5 h-5 text-cyan-400" /> Seller Dashboard
          </span>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/marketplace/seller/orders" className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold">Orders</Link>
            <Link href="/marketplace/seller/customers" className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold">Customers</Link>
            <Link href="/marketplace/seller/reports" className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold">Reports</Link>
            <Link href="/marketplace/seller/inventory" className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold">Inventory</Link>
            <Link href="/marketplace/seller/payment-settings" className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold">Settings</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white">
            <Wallet className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">KES {Number(k.totalSales).toLocaleString()}</p>
            <p className="text-xs opacity-80">Total Sales</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <ShoppingBag className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{k.totalOrders}</p>
            <p className="text-xs opacity-80">Paid Orders</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white">
            <Package className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{k.activeListings}</p>
            <p className="text-xs opacity-80">Active Listings</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 text-white">
            <Star className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{Number(k.avgRating || 0).toFixed(1)}★</p>
            <p className="text-xs opacity-80">Avg Rating</p>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/marketplace/seller/orders" className="p-5 rounded-2xl bg-yellow-950/30 border-2 border-yellow-700 hover:border-yellow-500 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs uppercase font-bold text-yellow-400">Needs Action</span>
                </div>
                <p className="text-3xl font-bold">{k.needsActionCount}</p>
                <p className="text-xs text-neutral-400 mt-1">Orders awaiting your response</p>
              </div>
              <ArrowRight className="w-5 h-5 text-yellow-400" />
            </div>
          </Link>

          <div className="p-5 rounded-2xl bg-red-950/30 border-2 border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-xs uppercase font-bold text-red-400">Low Stock</span>
                </div>
                <p className="text-3xl font-bold">{k.lowStockCount}</p>
                <p className="text-xs text-neutral-400 mt-1">Listings with 3 or fewer items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Revenue · Last 30 Days</h2>
          </div>
          {data.revenueSeries.every(d => d.revenue === 0) ? (
            <p className="text-center text-neutral-500 py-8 text-sm">No sales yet in the last 30 days</p>
          ) : (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={data.revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="day"
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })
                    }}
                  />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link href="/marketplace/seller/orders" className="text-xs text-cyan-400 hover:text-cyan-300">View all →</Link>
            </div>
            {data.recentOrders.length === 0 ? (
              <p className="text-center text-neutral-500 py-6 text-sm">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentOrders.map(o => (
                  <Link key={o.id} href={`/marketplace/orders/${o.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{o.orderNumber}</p>
                      <p className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-sm text-green-400">KES {Number(o.total).toLocaleString()}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || 'bg-neutral-700 text-neutral-400'}`}>
                      {o.status.replace(/_/g, ' ').slice(0, 15)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Top Products</h2>
              <span className="text-xs text-neutral-500">By revenue</span>
            </div>
            {data.topProducts.length === 0 ? (
              <p className="text-center text-neutral-500 py-6 text-sm">No sales yet</p>
            ) : (
              <div className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{p.title}</p>
                      <p className="text-xs text-neutral-500">{p.unitsSold} sold</p>
                    </div>
                    <span className="font-bold text-sm text-green-400">KES {Number(p.revenue).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock */}
        {data.lowStock.length > 0 && (
          <div className="p-5 rounded-2xl bg-red-950/20 border border-red-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-bold text-red-400">Low Stock Alerts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.lowStock.map(item => (
                <Link key={item.id} href={`/marketplace/listing/${item.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-red-600 transition">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-neutral-600" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.title}</p>
                    <p className="text-xs text-red-400">{item.stock} left</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}