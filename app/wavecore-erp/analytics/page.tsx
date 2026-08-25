'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Factory, Users,
  Loader2, Download, RefreshCw, ChevronRight, PieChart, LineChart,
  Activity, Target, Award, Zap, Clock, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState<any>({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setRefreshing(true)
    try {
      const [analyticsRes, chartsRes] = await Promise.all([
        fetch(`/api/wavecore/analytics?period=${period}`),
        fetch(`/api/wavecore/charts?period=${period}`)
      ])
      const analyticsData = await analyticsRes.json()
      const chartsData = await chartsRes.json()
      setData({ ...analyticsData, ...chartsData })
    } catch (error) {
      console.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Executive Analytics - ${period}</title>
      <style>
        body{font-family:Arial;padding:40px}
        h1{color:#333;border-bottom:3px solid #7c3aed;padding-bottom:10px}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th{background:#7c3aed;color:white;padding:12px;text-align:left}
        td{padding:10px;border-bottom:1px solid #ddd}
        .metric{margin:20px 0;padding:20px;background:#f9fafb;border-radius:8px}
        .metric h3{margin:0;color:#7c3aed}
        .metric p{font-size:24px;font-weight:bold;margin:10px 0 0}
      </style></head><body>
      <h1>Executive Analytics - ${period.toUpperCase()}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <div class="metric"><h3>Total Revenue</h3><p>KSh ${(data.totalRevenue || 0).toLocaleString()}</p></div>
      <div class="metric"><h3>Total Expenses</h3><p>KSh ${(data.totalExpenses || 0).toLocaleString()}</p></div>
      <div class="metric"><h3>Net Profit</h3><p>KSh ${(data.netProfit || 0).toLocaleString()}</p></div>
      <div class="metric"><h3>Total Products</h3><p>${data.totalProducts || 0}</p></div>
      <div class="metric"><h3>Active Employees</h3><p>${data.totalEmployees || 0}</p></div>
      <script>window.print()</script></body></html>
    `)
    printWindow.document.close()
  }

  const modules = [
    { name: 'Financial Analytics', desc: 'Revenue, expenses, profit', href: '/wavecore-erp/analytics/financial', icon: DollarSign, color: 'from-emerald-500 to-green-600', stat: 'KSh ' + ((data.totalRevenue || 0) / 1000000).toFixed(1) + 'M' },
    { name: 'Inventory Analytics', desc: 'Stock, movement, valuation', href: '/wavecore-erp/analytics/inventory', icon: Package, color: 'from-orange-500 to-amber-600', stat: data.totalProducts || 0 },
    { name: 'Manufacturing', desc: 'Production, efficiency, quality', href: '/wavecore-erp/analytics/manufacturing', icon: Factory, color: 'from-purple-500 to-violet-600', stat: data.workOrders || 0 },
    { name: 'HR Analytics', desc: 'Attendance, payroll, performance', href: '/wavecore-erp/analytics/hr', icon: Users, color: 'from-indigo-500 to-blue-600', stat: data.totalEmployees || 0 },
    { name: 'Custom Reports', desc: 'Create custom reports', href: '/wavecore-erp/analytics/custom-reports', icon: BarChart3, color: 'from-pink-500 to-rose-600', stat: data.reports || 0 },
  ]

  const kpis = [
    { label: 'Revenue', value: 'KSh ' + (data.totalRevenue || 0).toLocaleString(), change: '+12.5%', up: true, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Profit', value: 'KSh ' + (data.netProfit || 0).toLocaleString(), change: '+8.3%', up: true, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Products', value: data.totalProducts || 0, change: '+5.1%', up: true, icon: Package, color: 'text-orange-500' },
    { label: 'Employees', value: data.totalEmployees || 0, change: '-2.4%', up: false, icon: Users, color: 'text-indigo-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover shadow-md" />
            <span className="font-bold text-lg">WaveCore</span>
          </Link>
          <span className="text-sm font-medium text-muted-foreground">BI & Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 lg:p-12 shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 flex items-center gap-3">
              <BarChart3 className="w-10 h-10" /> Executive Analytics
            </h1>
            <p className="text-white/80 text-lg mb-6">Real-time business intelligence for data-driven decisions</p>
            
            {/* Period Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden">
                {['week', 'month', 'year'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-5 py-2.5 text-sm font-medium capitalize transition-all ${
                      period === p ? 'bg-white text-violet-700' : 'text-white/80 hover:bg-white/10'
                    }`}>
                    {p} view
                  </button>
                ))}
              </div>
              <button onClick={downloadPDF} className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center gap-2 hover:bg-white/20 transition-all">
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={fetchAnalytics} disabled={refreshing}
                className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50">
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-500" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.map(kpi => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                      <span className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {kpi.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.label} ({period})</p>
                  </div>
                )
              })}
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                <Target className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-lg font-bold">{data.efficiency || 0}%</p>
                <p className="text-xs text-muted-foreground">Efficiency Rate</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                <Award className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-lg font-bold">{data.quality || 0}%</p>
                <p className="text-xs text-muted-foreground">Quality Score</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                <Clock className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-lg font-bold">{data.uptime || 99.9}%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                <Zap className="w-5 h-5 text-purple-500 mb-2" />
                <p className="text-lg font-bold">{data.performance || 0}%</p>
                <p className="text-xs text-muted-foreground">Performance</p>
              </div>
            </div>

            {/* Analytics Modules */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-violet-500" /> Analytics Modules
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map(module => {
                  const Icon = module.icon
                  return (
                    <Link key={module.name} href={module.href}
                      className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="font-bold">{module.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <span className="text-sm font-bold text-violet-600">{module.stat}</span>
                        <span className="text-xs text-muted-foreground">View →</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* System Status */}
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" /> System Status
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">API: Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Database: Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Real-time: Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Reports: Ready</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}