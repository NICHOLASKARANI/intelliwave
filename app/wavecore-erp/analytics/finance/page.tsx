'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, TrendingDown, Download, Loader2, RefreshCw,
  PieChart, BarChart3, LineChart, ArrowUpRight, ArrowDownRight,
  Wallet, CreditCard, Receipt, Banknote, Calendar, Filter
} from 'lucide-react'

export default function FinancialAnalyticsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('MONTH')

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/analytics')
      if (res.ok) { const data = await res.json(); setStats(data.kpis || {}) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const metrics = [
    { label: 'Revenue', value: formatKES(stats.revenueMTD), icon: DollarSign, color: 'from-emerald-500 to-green-600', trend: '+12.4%', up: true },
    { label: 'Receivables', value: formatKES(stats.outstandingReceivables), icon: CreditCard, color: 'from-orange-500 to-amber-600', trend: '-3.2%', up: false },
    { label: 'Payables', value: formatKES(stats.accountsPayable), icon: Wallet, color: 'from-red-500 to-rose-600', trend: '+5.1%', up: false },
    { label: 'Invoices', value: stats.invoiceCount || 0, icon: Receipt, color: 'from-blue-500 to-indigo-600', trend: '+10.5%', up: true },
    { label: 'Payments', value: formatKES(stats.totalPayments || 0), icon: Banknote, color: 'from-teal-500 to-cyan-600', trend: '+8.3%', up: true },
    { label: 'Journal Entries', value: stats.journalEntries || 0, icon: BarChart3, color: 'from-purple-500 to-violet-600', trend: '+4.7%', up: true },
  ]

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Financial Analytics',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '='.repeat(50),
      '',
      ...metrics.map(m => m.label + ': ' + m.value + ' (' + m.trend + ')'),
      '',
      'Key Ratios:',
      'Gross Margin: 38.2%',
      'Net Profit Margin: 11.8%',
      'Current Ratio: 1.85',
      'Quick Ratio: 1.42',
      'Debt to Equity: 0.35',
      '',
      '(c) 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'financial-analytics.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Financial Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <DollarSign className="w-8 h-8" /> Financial Analytics
              </h1>
              <p className="text-white/80 text-sm">Revenue • Profitability • Cash Flow • Financial Health</p>
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

        {/* Time Range */}
        <div className="flex gap-2 mb-6">
          {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeRange === range ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900 text-neutral-500 border'
              }`}>
              {range}
            </button>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {metrics.map(metric => {
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

        {/* Financial Ratios */}
        <h2 className="text-lg font-bold mb-4">Financial Health Ratios</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { name: 'Gross Margin', value: '38.2%', color: 'text-emerald-500' },
            { name: 'Net Margin', value: '11.8%', color: 'text-green-500' },
            { name: 'Current Ratio', value: '1.85', color: 'text-blue-500' },
            { name: 'Quick Ratio', value: '1.42', color: 'text-indigo-500' },
            { name: 'Debt/Equity', value: '0.35', color: 'text-purple-500' },
          ].map(ratio => (
            <div key={ratio.name} className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
              <p className={`text-2xl font-bold ${ratio.color}`}>{ratio.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{ratio.name}</p>
            </div>
          ))}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-8">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-emerald-500" /> Revenue Trend
          </h3>
          <div className="h-40 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
            <p className="text-2xl font-bold text-emerald-600">{formatKES(stats.revenueMTD)}</p>
          </div>
        </div>
      </main>
    </div>
  )
}