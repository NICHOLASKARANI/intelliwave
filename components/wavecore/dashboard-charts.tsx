'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Package, Users, FileText } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4']

interface ChartData {
  revenueTrend: Array<{ month: string; revenue: number; expenses: number }>
  salesByCategory: Array<{ name: string; value: number }>
  invoiceStatus: Array<{ name: string; value: number }>
}

export function DashboardCharts({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCharts() {
      try {
        const res = await fetch('/api/wavecore/charts')
        if (res.ok) {
          setData(await res.json())
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchCharts()
  }, [organizationId])

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="h-72 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        <div className="h-72 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const revenueData = data?.revenueTrend || [
    { month: 'Jan', revenue: 0, expenses: 0 },
    { month: 'Feb', revenue: 0, expenses: 0 },
    { month: 'Mar', revenue: 0, expenses: 0 },
    { month: 'Apr', revenue: 0, expenses: 0 },
    { month: 'May', revenue: 0, expenses: 0 },
    { month: 'Jun', revenue: 0, expenses: 0 },
  ]

  const categoryData = data?.salesByCategory || []

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-8">
      {/* Revenue vs Expenses Area Chart */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Revenue vs Expenses</h3>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
              }}
              formatter={(value: number) => [`KSh ${value.toLocaleString()}`, '']}
            />
            <Legend />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExpenses)" strokeWidth={2} name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sales by Category Pie Chart */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Sales Distribution</h3>
            <p className="text-xs text-muted-foreground">By product category</p>
          </div>
          <Package className="w-5 h-5 text-indigo-500" />
        </div>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No sales data yet</p>
          </div>
        )}
      </div>

      {/* Invoice Status Bar Chart */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Invoice Status</h3>
            <p className="text-xs text-muted-foreground">Overview</p>
          </div>
          <FileText className="w-5 h-5 text-purple-500" />
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data?.invoiceStatus || [
            { name: 'Draft', value: 0 },
            { name: 'Sent', value: 0 },
            { name: 'Paid', value: 0 },
            { name: 'Overdue', value: 0 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
        <h3 className="font-bold mb-4 text-neutral-900 dark:text-white">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={DollarSign} label="Total Revenue" value="KSh 0" color="text-emerald-500" />
          <StatCard icon={TrendingDown} label="Total Expenses" value="KSh 0" color="text-red-500" />
          <StatCard icon={Users} label="Active Customers" value="0" color="text-blue-500" />
          <StatCard icon={Package} label="Products" value="0" color="text-orange-500" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}