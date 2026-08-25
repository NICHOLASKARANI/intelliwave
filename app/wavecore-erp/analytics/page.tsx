'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, TrendingUp, DollarSign, Package, Factory, Users, Loader2, Download, RefreshCw } from 'lucide-react'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState<any>({})

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/wavecore/analytics?period=${period}`)
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    { name: 'Financial Analytics', desc: 'Revenue, expenses, profit', href: '/wavecore-erp/analytics/financial', icon: DollarSign, color: 'from-emerald-500 to-green-600' },
    { name: 'Inventory Analytics', desc: 'Stock, movement, valuation', href: '/wavecore-erp/analytics/inventory', icon: Package, color: 'from-orange-500 to-amber-600' },
    { name: 'Manufacturing', desc: 'Production, efficiency, quality', href: '/wavecore-erp/analytics/manufacturing', icon: Factory, color: 'from-purple-500 to-violet-600' },
    { name: 'HR Analytics', desc: 'Attendance, payroll, performance', href: '/wavecore-erp/analytics/hr', icon: Users, color: 'from-indigo-500 to-blue-600' },
    { name: 'Custom Reports', desc: 'Create custom reports', href: '/wavecore-erp/analytics/custom-reports', icon: BarChart3, color: 'from-pink-500 to-rose-600' },
  ]

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Executive Analytics - ${period}</title>
      <style>body{font-family:Arial;padding:40px}h1{color:#333;border-bottom:3px solid #059669}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#059669;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}</style>
      </head><body>
      <h1>Executive Analytics - ${period.toUpperCase()}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
      <tr><td>Revenue</td><td>KSh ${(data.totalRevenue || 0).toLocaleString()}</td></tr>
      <tr><td>Profit</td><td>KSh ${(data.netProfit || 0).toLocaleString()}</td></tr>
      </tbody></table>
      <script>window.print()</script></body></html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Executive Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8" /> Executive Analytics
          </h1>
          <p className="text-white/80 text-sm">BI & Analytics Dashboard</p>
        </div>

        {/* Period Selector */}
        <div className="flex justify-end mb-6 gap-2">
          <div className="flex rounded-xl border overflow-hidden">
            {['week', 'month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm capitalize ${period === p ? 'bg-violet-600 text-white' : 'bg-white dark:bg-neutral-900'}`}>
                {p} view
              </button>
            ))}
          </div>
          <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={fetchAnalytics} className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-violet-500" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <DollarSign className="w-6 h-6 text-emerald-500 mb-3" />
                <p className="text-2xl font-bold">KSh {(data.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue ({period})</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <TrendingUp className="w-6 h-6 text-green-500 mb-3" />
                <p className="text-2xl font-bold">KSh {(data.netProfit || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Profit ({period})</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Package className="w-6 h-6 text-orange-500 mb-3" />
                <p className="text-2xl font-bold">{data.totalProducts || 0}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
            </div>

            {/* Modules */}
            <h2 className="text-xl font-bold mb-4">Analytics Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-xl transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}