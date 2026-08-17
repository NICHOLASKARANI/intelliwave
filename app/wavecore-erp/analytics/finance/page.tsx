'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  DollarSign, TrendingUp, TrendingDown, Loader2, Download,
  BarChart3, PieChart, LineChart, RefreshCw, Filter, Printer, Share2, FileText
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
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <DollarSign className="w-8 h-8" /> Financial Analytics
          </h1>
          <p className="text-white/80 text-sm">Revenue • Expenses • Cash Flow</p>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <TrendingUp className="w-6 h-6 text-emerald-500 mb-3" />
                <p className="text-xl font-bold">{formatKES(stats.revenueMTD)}</p>
                <p className="text-xs text-muted-foreground">Revenue (MTD)</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <DollarSign className="w-6 h-6 text-orange-500 mb-3" />
                <p className="text-xl font-bold">{formatKES(stats.outstandingReceivables)}</p>
                <p className="text-xs text-muted-foreground">Receivables</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <TrendingDown className="w-6 h-6 text-red-500 mb-3" />
                <p className="text-xl font-bold">{formatKES(stats.accountsPayable)}</p>
                <p className="text-xs text-muted-foreground">Payables</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <BarChart3 className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-xl font-bold">{stats.invoiceCount || 0}</p>
                <p className="text-xs text-muted-foreground">Invoices</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <FileText className="w-6 h-6 text-purple-500 mb-3" />
                <p className="text-xl font-bold">{stats.journalEntries || 0}</p>
                <p className="text-xs text-muted-foreground">Journal Entries</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <PieChart className="w-6 h-6 text-teal-500 mb-3" />
                <p className="text-xl font-bold">{formatKES((stats.revenueMTD || 0) - (stats.accountsPayable || 0))}</p>
                <p className="text-xs text-muted-foreground">Net Position</p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-8">
              <h3 className="font-bold mb-4">Revenue Chart</h3>
              <div className="h-48 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
                <p className="text-3xl font-bold text-emerald-600">{formatKES(stats.revenueMTD)}</p>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-4">Reports</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {['Income Statement', 'Balance Sheet', 'Cash Flow', 'Trial Balance', 'AR Aging', 'AP Aging'].map(r => (
                <div key={r} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center cursor-pointer hover:border-emerald-300">
                  <span className="text-sm">{r}</span>
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