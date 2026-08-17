'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  DollarSign, TrendingUp, TrendingDown, Loader2, Download, ArrowLeft,
  BarChart3, PieChart, LineChart, RefreshCw, Filter, Printer, Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FinancialAnalyticsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/analytics')
      if (res.ok) { const data = await res.json(); setStats(data.kpis || {}) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const financialMetrics = [
    { label: 'Revenue (MTD)', value: formatKES(stats.revenueMTD), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Outstanding Receivables', value: formatKES(stats.outstandingReceivables), icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'Accounts Payable', value: formatKES(stats.accountsPayable), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
    { label: 'Total Invoices', value: stats.invoiceCount || 0, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Journal Entries', value: stats.journalEntries || 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Net Position', value: formatKES((stats.revenueMTD || 0) - (stats.accountsPayable || 0)), icon: PieChart, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  ]

  const reports = [
    'Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Trial Balance',
    'General Ledger', 'AR Aging', 'AP Aging', 'Tax Summary', 'Budget vs Actual',
  ]

  const handleExport = () => {
    const csv = 'Metric,Value\n' + financialMetrics.map(m => `${m.label},${typeof m.value === 'string' ? m.value.replace('KSh ', '') : m.value}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'financial-analytics.csv'; a.click()
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
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <DollarSign className="w-8 h-8" /> Financial Analytics
              </h1>
              <p className="text-white/80 text-sm">Revenue • Expenses • Cash Flow • Profitability</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="border-white/30 text-white hover:bg-white/10"><Download className="w-4 h-4 mr-1" /> Export</Button>
              <Button variant="outline" onClick={fetchStats} className="border-white/30 text-white hover:bg-white/10"><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></div>
        ) : (
          <>
            {/* Financial KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {financialMetrics.map(metric => {
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                    <div className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <div className="text-xl font-bold">{metric.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2"><LineChart className="w-5 h-5 text-emerald-500" /> Revenue Trend</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Filter className="w-3 h-3 mr-1" /> Filter</Button>
                  <Button variant="outline" size="sm"><Printer className="w-3 h-3 mr-1" /> Print</Button>
                </div>
              </div>
              <div className="h-64 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatKES(stats.revenueMTD)}</p>
                  <p className="text-xs text-muted-foreground">Month-to-Date Revenue</p>
                </div>
              </div>
            </div>

            {/* Financial Reports */}
            <h2 className="text-lg font-bold mb-4">Financial Reports</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {reports.map(report => (
                <div key={report} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center hover:border-emerald-300 cursor-pointer">
                  <span className="text-sm font-medium">{report}</span>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}