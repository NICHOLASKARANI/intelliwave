'use client'
import { useEffect, useState, useMemo } from 'react'
import { ShoppingCart, DollarSign, TrendingUp, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { KpiCard } from '@/components/wavve-si/KpiCard'
import { ChartCard } from '@/components/wavve-si/ChartCard'

interface KpiData {
  total_orders: number
  total_revenue: number
  avg_ticket: number
  orders_today: number
  revenue_today: number
  product_count: number
  by_status: { status: string; count: number }[]
  revenue_trend: { day: string; revenue: number; orders: number }[]
  top_items: { name: string; quantity: number; revenue: number }[]
}

export default function RestaurantDashboardPage() {
  const [data, setData] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/wavve-si/restaurant/kpis', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 401) {
          window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login'
          return
        }
        if (!r.ok) throw new Error('Failed to load KPIs')
        return r.json()
      })
      .then(d => { if (d) setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const trendData = useMemo(() => {
    if (!data) return []
    return data.revenue_trend.map(r => ({ name: r.day.trim(), revenue: r.revenue, orders: r.orders }))
  }, [data])

  const pieData = useMemo(() => {
    if (!data) return []
    return data.by_status.map(s => ({ name: s.status, value: s.count }))
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" />
          <p className="font-bold">Error loading dashboard</p>
        </div>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Orders Today"
          value={data.orders_today}
          icon={ShoppingCart}
          accent="blue"
          subtitle={data.orders_today === 0 ? 'No orders yet today' : `${data.orders_today} order${data.orders_today === 1 ? '' : 's'}`}
        />
        <KpiCard
          label="Revenue Today"
          value={`KSh ${data.revenue_today.toLocaleString()}`}
          icon={DollarSign}
          accent="green"
          subtitle="From today's orders"
        />
        <KpiCard
          label="Avg Ticket"
          value={`KSh ${data.avg_ticket.toFixed(0)}`}
          icon={TrendingUp}
          accent="amber"
          subtitle={`${data.total_orders} total orders`}
        />
        <KpiCard
          label="Menu Items"
          value={data.product_count}
          icon={Package}
          accent="purple"
          subtitle="Active products"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue — Last 7 Days"
            subtitle="Daily sales trend"
            type="area"
            data={trendData}
            dataKey="revenue"
            xKey="name"
            color="#f59e0b"
            height={260}
            empty={trendData.length === 0}
          />
        </div>
        <ChartCard
          title="Orders by Status"
          subtitle="Current distribution"
          type="pie"
          data={pieData}
          dataKey="value"
          xKey="name"
          height={260}
          empty={pieData.length === 0}
        />
      </div>

      {/* Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Top 5 Selling Items</h3>
          {data.top_items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No sales yet. Add orders to see top items.</p>
          ) : (
            <div className="space-y-2">
              {data.top_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.quantity} sold</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-400">KSh {item.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" /> Orders Today</span>
              <span className="text-sm font-bold text-white">{data.orders_today}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Total Orders</span>
              <span className="text-sm font-bold text-white">{data.total_orders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Revenue</span>
              <span className="text-sm font-bold text-green-400">KSh {data.total_revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 flex items-center gap-2"><Package className="w-4 h-4" /> Menu Items</span>
              <span className="text-sm font-bold text-white">{data.product_count}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}