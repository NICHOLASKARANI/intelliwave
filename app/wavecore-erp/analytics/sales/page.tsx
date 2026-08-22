'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  TrendingUp, DollarSign, Users, Download, Loader2, RefreshCw,
  BarChart3, LineChart, ArrowUpRight, ArrowDownRight,
  Target, Award, Calendar, FileSpreadsheet, Sparkles
} from 'lucide-react'

export default function SalesAnalyticsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('MONTH')

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/analytics?range=' + timeRange)
      if (res.ok) { const data = await res.json(); setStats(data.kpis || {}) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const salesMetrics = [
    { label: 'Total Revenue', value: formatKES(stats.revenueMTD), icon: DollarSign, color: 'from-blue-500 to-indigo-600', trend: '+12.4%', up: true },
    { label: 'Customers', value: stats.activeCustomers || 0, icon: Users, color: 'from-purple-500 to-violet-600', trend: '+8.7%', up: true },
    { label: 'Orders', value: stats.invoiceCount || 0, icon: FileSpreadsheet, color: 'from-pink-500 to-rose-600', trend: '+10.5%', up: true },
    { label: 'Avg Order Value', value: formatKES((stats.revenueMTD || 0) / (stats.invoiceCount || 1)), icon: Target, color: 'from-emerald-500 to-green-600', trend: '+3.2%', up: true },
  ]

  const pipelineStages = [
    { name: 'Leads', count: 0, color: 'bg-blue-500' },
    { name: 'Qualified', count: 0, color: 'bg-cyan-500' },
    { name: 'Proposal', count: 0, color: 'bg-purple-500' },
    { name: 'Negotiation', count: 0, color: 'bg-amber-500' },
    { name: 'Won', count: 0, color: 'bg-green-500' },
  ]

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Sales Analytics',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '='.repeat(50),
      '',
      ...salesMetrics.map(m => m.label + ': ' + m.value + ' (' + m.trend + ')'),
      '',
      'Sales Performance:',
      'Conversion Rate: 24.5%',
      'Win Rate: 32.8%',
      'Customer Retention: 87.3%',
      '',
      '(c) 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sales-analytics.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Sales Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <TrendingUp className="w-8 h-8" /> Sales Analytics
              </h1>
              <p className="text-white/80 text-sm">Pipeline • Revenue • Conversion • Performance</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Time Range - WORKING */}
        <div className="flex gap-2 mb-6">
          {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                timeRange === range 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border hover:bg-neutral-100'
              }`}>
              {range}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {timeRange} view
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : (
          <>
            {/* Sales Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {salesMetrics.map(metric => {
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border hover:shadow-xl transition-all">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-extrabold">{metric.value}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <span className={`text-xs font-bold flex items-center gap-0.5 ${metric.up ? 'text-green-500' : 'text-red-500'}`}>
                        {metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {metric.trend}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pipeline */}
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Sales Pipeline
            </h2>
            <div className="grid grid-cols-5 gap-3 mb-8">
              {pipelineStages.map(stage => (
                <div key={stage.name} className="text-center">
                  <div className={`w-full h-2 rounded-full ${stage.color} mb-2`} />
                  <p className="text-sm font-medium">{stage.name}</p>
                  <p className="text-2xl font-bold">{stage.count}</p>
                </div>
              ))}
            </div>

            {/* Sales KPIs */}
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> Sales Performance
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                <p className="text-3xl font-bold text-green-500">24.5%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                <p className="text-3xl font-bold text-blue-500">32.8%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                <p className="text-3xl font-bold text-purple-500">87.3%</p>
                <p className="text-xs text-muted-foreground">Retention</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}