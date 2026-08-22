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
  const [timeRange, setTimeRange] = useState('MONTH')
  const [autoRefresh, setAutoRefresh] = useState(true)
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

    const kpiHrefs: Record<string, string> = {
    'Revenue (MTD)': '/wavecore-erp/analytics/revenue',
    'Receivables': '/wavecore-erp/analytics/receivables',
    'Payables': '/wavecore-erp/analytics/payables',
    'Customers': '/wavecore-erp/analytics/customers',
    'Products': '/wavecore-erp/analytics/products',
    'Employees': '/wavecore-erp/analytics/employees',
    'Invoices': '/wavecore-erp/analytics/invoices',
    'Projects': '/wavecore-erp/analytics/projects',
  }
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

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Executive Analytics',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '='.repeat(50),
      '',
      ...kpiCards.map(k => k.label + ': ' + k.value + ' (' + k.trend + ')'),
      '',
      '(c) 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics.pdf'
    a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">BI & Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" /> Executive Analytics
              </h1>
              <p className="text-white/80 text-sm">Real-time business intelligence</p>
            </Link>
            <div className="flex gap-2">
              <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
                <Download className="w-4 h-4" /> PDF
              </button>
            </Link>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeRange === range 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border'
              }`}>
              {range}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-neutral-300'}`} />
            {autoRefresh ? 'Auto-refresh 30s' : 'Paused'}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpiCards.map(kpi => {
            const Icon = kpi.icon
            return (
              <Link key={kpi.label} href={`/wavecore-erp/analytics/${kpi.label.toLowerCase().split(" ")[0].replace("(", "").replace(")", "")}`} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all cursor-pointer block">
                <div className="flex justify-between items-start mb-3">
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${kpi.trend.startsWith('+') ? 'text-green-500' : kpi.trend.startsWith('-') ? 'text-red-500' : 'text-neutral-400'}`}>
                    {kpi.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : kpi.trend.startsWith('-') ? <ArrowDownRight className="w-3 h-3" /> : null}
                    {kpi.trend}
                  </span>
                </Link>
                <p className="text-xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </Link>
            )
          })}
        </div>

        {/* Sub-Modules */}
        <h2 className="text-lg font-bold mb-4">Analytics Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {subPages.map(page => {
            const Icon = page.icon
            return (
              <Link key={page.label} href={page.href}
                className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all group">
                <div className={`w-10 h-10 rounded-xl ${page.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${page.color}`} />
                </Link>
                <p className="font-bold text-sm">{page.label}</p>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}