'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package, Factory,
  Briefcase, Loader2, Download, RefreshCw, FileSpreadsheet
} from 'lucide-react'

export default function ExecutiveAnalyticsPage() {
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

  const kpiCards = [
    { label: 'Revenue (MTD)', value: formatKES(stats.revenueMTD), icon: DollarSign, color: 'text-emerald-500', href: '/wavecore-erp/analytics/revenue' },
    { label: 'Receivables', value: formatKES(stats.outstandingReceivables), icon: TrendingUp, color: 'text-orange-500', href: '/wavecore-erp/analytics/receivables' },
    { label: 'Payables', value: formatKES(stats.accountsPayable), icon: TrendingDown, color: 'text-red-500', href: '/wavecore-erp/analytics/payables' },
    { label: 'Customers', value: stats.activeCustomers || 0, icon: Users, color: 'text-purple-500', href: '/wavecore-erp/analytics/customers' },
    { label: 'Products', value: stats.inventoryItems || 0, icon: Package, color: 'text-teal-500', href: '/wavecore-erp/analytics/products' },
    { label: 'Employees', value: stats.employees || 0, icon: Briefcase, color: 'text-indigo-500', href: '/wavecore-erp/analytics/employees' },
    { label: 'Invoices', value: stats.invoiceCount || 0, icon: FileSpreadsheet, color: 'text-blue-500', href: '/wavecore-erp/analytics/invoices' },
    { label: 'Projects', value: stats.projects || 0, icon: Factory, color: 'text-pink-500', href: '/wavecore-erp/analytics/projects' },
  ]

  const subPages = [
    { label: 'Financial Analytics', href: '/wavecore-erp/analytics/finance', icon: DollarSign },
    { label: 'Sales Analytics', href: '/wavecore-erp/analytics/sales', icon: TrendingUp },
    { label: 'Inventory Analytics', href: '/wavecore-erp/analytics/inventory', icon: Package },
    { label: 'HR Analytics', href: '/wavecore-erp/analytics/hr', icon: Users },
    { label: 'Manufacturing', href: '/wavecore-erp/analytics/manufacturing', icon: Factory },
    { label: 'Custom Reports', href: '/wavecore-erp/analytics/custom', icon: FileSpreadsheet },
  ]

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
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" /> Executive Analytics
              </h1>
              <p className="text-white/80 text-sm">Real-time business intelligence</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards - CLICKABLE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpiCards.map(kpi => {
            const Icon = kpi.icon
            return (
              <Link key={kpi.label} href={kpi.href}
                className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg hover:border-indigo-500 cursor-pointer transition-all">
                <Icon className={`w-6 h-6 ${kpi.color} mb-3`} />
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
                className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                <Icon className="w-6 h-6 text-indigo-500 mb-3" />
                <p className="font-bold text-sm">{page.label}</p>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}