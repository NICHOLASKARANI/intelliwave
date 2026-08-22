'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Download, Loader2, RefreshCw, BarChart3,
  Calendar, Briefcase, TrendingUp, Wallet, Clock
} from 'lucide-react'

export default function HRAnalyticsPage() {
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

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - HR Analytics',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '='.repeat(50),
      '',
      'Employees: ' + (stats.employees || 0),
      'Revenue: ' + formatKES(stats.revenueMTD),
      'Customers: ' + (stats.activeCustomers || 0),
      'Projects: ' + (stats.projects || 0),
      'Invoices: ' + (stats.invoiceCount || 0),
      '',
      '(c) 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'hr-analytics.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">HR Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-8 h-8" /> HR Analytics
              </h1>
              <p className="text-white/80 text-sm">Workforce Intelligence • Real-time Data</p>
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
                  ? 'bg-purple-600 text-white shadow-lg scale-105' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border'
              }`}>
              {range}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {timeRange}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Employees - REAL */}
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border hover:shadow-xl transition-all">
              <Users className="w-8 h-8 text-purple-500 mb-3" />
              <p className="text-3xl font-extrabold">{stats.employees || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Employees</p>
            </div>

            {/* Projects - REAL */}
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border hover:shadow-xl transition-all">
              <Briefcase className="w-8 h-8 text-blue-500 mb-3" />
              <p className="text-3xl font-extrabold">{stats.projects || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Projects</p>
            </div>

            {/* Revenue - REAL */}
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border hover:shadow-xl transition-all">
              <TrendingUp className="w-8 h-8 text-emerald-500 mb-3" />
              <p className="text-3xl font-extrabold">{formatKES(stats.revenueMTD)}</p>
              <p className="text-xs text-muted-foreground mt-1">Revenue</p>
            </div>

            {/* Customers - REAL */}
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border hover:shadow-xl transition-all">
              <Wallet className="w-8 h-8 text-amber-500 mb-3" />
              <p className="text-3xl font-extrabold">{stats.activeCustomers || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Customers</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}