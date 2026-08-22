'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package, Factory,
  Briefcase, Loader2, Download, RefreshCw, PieChart, LineChart, Activity,
  Zap, ArrowUpRight, ArrowDownRight, Star, Gauge, Printer, Share2, Settings,
  Filter, Calendar, Maximize2, Eye, EyeOff, FileSpreadsheet
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ExecutiveAnalyticsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [timeRange, setTimeRange] = useState('MONTH')
  const [timeRange, setTimeRange] = useState('MONTH')
  const [showFilters, setShowFilters] = useState(false)

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/analytics')
      if (res.ok) { const data = await res.json(); setStats(data.kpis || {}) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetchStats()
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const subPages = [
    { label: 'Financial Analytics', href: '/wavecore-erp/analytics/finance', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Sales Analytics', href: '/wavecore-erp/analytics/sales', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Inventory Analytics', href: '/wavecore-erp/analytics/inventory', icon: Package, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'HR Analytics', href: '/wavecore-erp/analytics/hr', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Manufacturing', href: '/wavecore-erp/analytics/manufacturing', icon: Factory, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
    { label: 'Custom Reports', href: '/wavecore-erp/analytics/custom', icon: FileSpreadsheet, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950' },
  ]

  const kpiCards = [
    { label: 'Revenue (MTD)', value: formatKES(stats.revenueMTD), icon: DollarSign, color: 'text-emerald-500', trend: '+12%' },
    { label: 'Receivables', value: formatKES(stats.outstandingReceivables), icon: TrendingUp, color: 'text-orange-500', trend: '-3%' },
    { label: 'Payables', value: formatKES(stats.accountsPayable), icon: TrendingDown, color: 'text-red-500', trend: '+5%' },
    { label: 'Customers', value: stats.activeCustomers || 0, icon: Users, color: 'text-purple-500', trend: '+8%' },
    { label: 'Products', value: stats.inventoryItems || 0, icon: Package, color: 'text-teal-500', trend: '0%' },
    { label: 'Employees', value: stats.employees || 0, icon: Briefcase, color: 'text-indigo-500', trend: '+2%' },
    { label: 'Invoices', value: stats.invoiceCount || 0, icon: FileSpreadsheet, color: 'text-blue-500', trend: '+10%' },
    { label: 'Projects', value: stats.projects || 0, icon: Factory, color: 'text-pink-500', trend: '+4%' },
  ]

  const chartTypes = [
    { name: 'Revenue Trend', icon: LineChart, color: 'text-emerald-500', desc: 'Monthly revenue analysis' },
    { name: 'Expense Breakdown', icon: PieChart, color: 'text-red-500', desc: 'Cost distribution' },
    { name: 'Sales Pipeline', icon: BarChart3, color: 'text-blue-500', desc: 'Deal stages' },
    { name: 'Inventory Levels', icon: Activity, color: 'text-orange-500', desc: 'Stock tracking' },
    { name: 'Cash Flow', icon: TrendingUp, color: 'text-purple-500', desc: 'Money movement' },
    { name: 'Performance', icon: Gauge, color: 'text-teal-500', desc: 'KPI tracking' },
  ]

  const handleExport = () => {
    const csv = 'Metric,Value,Trend\n' + kpiCards.map(k => `${k.label},${typeof k.value === 'string' ? k.value.replace('KSh ', '') : k.value},${k.trend}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'executive-dashboard.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Executive Dashboard</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-700 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><BarChart3 className="w-8 h-8" /> Executive Dashboard</h1>
              <p className="text-white/80 text-sm">Complete business intelligence at a glance</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="border-white/30 text-white hover:bg-white/10"><Download className="w-4 h-4 mr-1" /> Export</Button>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-white/30 text-white hover:bg-white/10"><Filter className="w-4 h-4 mr-1" /> Filters</Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10"><Share2 className="w-4 h-4 mr-1" /> Share</Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10"><Printer className="w-4 h-4 mr-1" /> Print</Button>
            </div>
          </div>
        </div>

        {/* Time Range */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['TODAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${timeRange === range ? 'bg-purple-600 text-white shadow-lg' : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>
              {range}
            </button>
          ))}
          {timeRange === 'CUSTOM' && (
            <div className="flex gap-2 items-center">
              <input type="date" className="px-3 py-2 rounded-xl border text-sm" />
              <span className="text-sm">to</span>
              <input type="date" className="px-3 py-2 rounded-xl border text-sm" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <>
                      {/* Time Range Filter */}
          <div className="flex gap-2 mb-6">
            {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(range => (
              <button key={range} onClick={() => setTimeRange(range)}
                className={px-4 py-2 rounded-xl text-sm font-medium transition-all }>
                {range}
              </button>
            ))}
          </div>
          {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {kpiCards.map(kpi => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-xl transition-all cursor-default group">
                    <div className="flex justify-between items-start mb-3">
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                      <span className={`text-xs font-medium ${kpi.trend.startsWith('+') ? 'text-green-600' : kpi.trend.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}`}>{kpi.trend}</span>
                    </div>
                    <div className="text-xl font-bold">{kpi.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Sub-pages Navigation */}
            <h2 className="text-lg font-bold mb-4">Analytics Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {subPages.map(page => {
                const Icon = page.icon
                return (
                  <Link key={page.label} href={page.href}
                    className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-purple-300 hover:shadow-lg transition-all group text-center">
                    <div className={`w-12 h-12 rounded-xl ${page.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${page.color}`} />
                    </div>
                    <p className="font-medium text-xs">{page.label}</p>
                  </Link>
                )
              })}
            </div>

            {/* Chart Types */}
            <h2 className="text-lg font-bold mb-4">Available Charts</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {chartTypes.map(chart => {
                const Icon = chart.icon
                return (
                  <div key={chart.name} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-md transition-all cursor-pointer text-center">
                    <Icon className={`w-8 h-8 ${chart.color} mx-auto mb-2`} />
                    <p className="font-medium text-xs">{chart.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{chart.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* AI Insights */}
            <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 p-6 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold">AI Business Insights</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-xs">Revenue Trend</p>
                  <p className="text-white font-bold">{formatKES(stats.revenueMTD)}</p>
                  <p className="text-white/60 text-xs mt-1">MTD revenue tracking</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-xs">Customer Base</p>
                  <p className="text-white font-bold">{stats.activeCustomers || 0} active</p>
                  <p className="text-white/60 text-xs mt-1">Growing customer base</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-xs">Inventory</p>
                  <p className="text-white font-bold">{stats.inventoryItems || 0} products</p>
                  <p className="text-white/60 text-xs mt-1">Products in stock</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}