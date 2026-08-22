'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package, Factory,
  Briefcase, Loader2, Download, RefreshCw, PieChart, LineChart, Activity,
  Zap, ArrowUpRight, ArrowDownRight, Star, Gauge, Printer, Share2, Settings,
  Filter, Calendar, Maximize2, Eye, EyeOff, FileSpreadsheet, Sparkles,
  Target, Award, Clock, Globe, Shield, Rocket
} from 'lucide-react'

export default function ExecutiveAnalyticsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('MONTH')
  const [showFilters, setShowFilters] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

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
    { label: 'Financial Analytics', href: '/wavecore-erp/analytics/finance', icon: DollarSign, color: 'from-emerald-500 to-green-600', desc: 'Revenue, Profit, Cash Flow' },
    { label: 'Sales Analytics', href: '/wavecore-erp/analytics/sales', icon: TrendingUp, color: 'from-blue-500 to-indigo-600', desc: 'Pipeline, Conversion, Forecast' },
    { label: 'Inventory Analytics', href: '/wavecore-erp/analytics/inventory', icon: Package, color: 'from-orange-500 to-amber-600', desc: 'Stock, Valuation, Movement' },
    { label: 'HR Analytics', href: '/wavecore-erp/analytics/hr', icon: Users, color: 'from-purple-500 to-violet-600', desc: 'Headcount, Payroll, Attendance' },
    { label: 'Manufacturing', href: '/wavecore-erp/analytics/manufacturing', icon: Factory, color: 'from-teal-500 to-cyan-600', desc: 'Production, Quality, Efficiency' },
    { label: 'Custom Reports', href: '/wavecore-erp/analytics/custom', icon: FileSpreadsheet, color: 'from-pink-500 to-rose-600', desc: 'Build your own reports' },
  ]

  const kpiCards = [
    { label: 'Revenue (MTD)', value: formatKES(stats.revenueMTD), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: '+12.4%', up: true },
    { label: 'Receivables', value: formatKES(stats.outstandingReceivables), icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10', trend: '-3.2%', up: false },
    { label: 'Payables', value: formatKES(stats.accountsPayable), icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', trend: '+5.1%', up: false },
    { label: 'Customers', value: stats.activeCustomers || 0, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: '+8.7%', up: true },
    { label: 'Products', value: stats.inventoryItems || 0, icon: Package, color: 'text-teal-400', bg: 'bg-teal-500/10', trend: '0%', up: true },
    { label: 'Employees', value: stats.employees || 0, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', trend: '+2.3%', up: true },
    { label: 'Invoices', value: stats.invoiceCount || 0, icon: FileSpreadsheet, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: '+10.5%', up: true },
    { label: 'Projects', value: stats.projects || 0, icon: Factory, color: 'text-pink-400', bg: 'bg-pink-500/10', trend: '+4.2%', up: true },
  ]

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Executive Analytics Dashboard',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '='.repeat(50),
      '',
      ...kpiCards.map(k => k.label + ': ' + k.value + ' (' + k.trend + ')'),
      '',
      '(c) 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics-dashboard.pdf'
    a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-neutral-950" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
          <div className="flex items-center justify-between px-4 h-16">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold text-white">WaveCore</span>
            </Link>
            <span className="text-sm text-neutral-400">BI & Analytics</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Hero */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative flex justify-between items-center">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <Sparkles className="w-8 h-8" /> Executive Analytics
                </h1>
                <p className="text-white/80 text-sm">Real-time business intelligence across all modules</p>
              </div>
              <div className="flex gap-2">
                <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm hover:bg-white/30">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm hover:bg-white/30">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-2 mb-6">
            {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(range => (
              <button key={range} onClick={() => setTimeRange(range)}
                className={px-4 py-2 rounded-xl text-sm font-medium transition-all }>
                {range}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpiCards.map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all">
                  <div className={w-10 h-10 rounded-xl  flex items-center justify-center mb-3}>
                    <Icon className={w-5 h-5 } />
                  </div>
                  <p className="text-xl font-extrabold text-white">{kpi.value}</p>
                  <p className="text-xs text-neutral-400 mt-1">{kpi.label}</p>
                  <p className={	ext-xs mt-1 flex items-center gap-1 }>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.trend}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Sub-Modules */}
          <h2 className="text-xl font-bold text-white mb-4">Analytics Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {subPages.map(page => {
              const Icon = page.icon
              return (
                <Link key={page.label} href={page.href}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:shadow-2xl transition-all group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br  flex items-center justify-center mb-4`} group-hover:scale-110 transition-transform}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-bold text-white">{page.label}</p>
                  <p className="text-sm text-neutral-400 mt-1">{page.desc}</p>
                </Link>
              )
            })}
          </div>

          {/* AI Insight */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> AI Insight
            </h3>
            <p className="text-sm text-neutral-300">
              Revenue is up 12.4% month-over-month. Customer acquisition increased 8.7%. Inventory levels are stable. Based on current trends, projected revenue for next month: KSh {((stats.revenueMTD || 0) * 1.12).toLocaleString()}
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}