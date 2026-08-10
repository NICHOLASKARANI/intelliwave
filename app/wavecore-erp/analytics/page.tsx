import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign,
  Users, Package, Factory, Briefcase, BarChart3, PieChart,
  Activity, Zap, Download, Filter, Calendar, RefreshCw,
  Target, ArrowUpRight, ArrowDownRight, Eye, EyeOff,
  Maximize2, ChevronDown, LineChart, AreaChart, CandlestickChart,
  BarChart4, ScatterChart, Gauge, Clock, AlertCircle,
  CheckCircle, Globe, Smartphone, Monitor, Tablet,
  FileSpreadsheet, Share2, Printer, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Business Intelligence - WaveCore ERP | IntelliWavve',
  description: 'Executive dashboards, KPIs, interactive charts, and AI-powered forecasting.',
}

const kpiCards = [
  { label: 'Revenue (MTD)', value: 'KSh 0.00', change: '+0%', trend: 'up', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', sparkline: true },
  { label: 'Expenses (MTD)', value: 'KSh 0.00', change: '+0%', trend: 'up', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', sparkline: true },
  { label: 'Net Profit', value: 'KSh 0.00', change: '+0%', trend: 'up', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', sparkline: true },
  { label: 'Active Customers', value: '0', change: '+0', trend: 'up', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', sparkline: true },
  { label: 'Inventory Value', value: 'KSh 0.00', change: '0 items', trend: 'neutral', icon: Package, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', sparkline: true },
  { label: 'Production Orders', value: '0', change: '0 active', trend: 'neutral', icon: Factory, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950', sparkline: true },
  { label: 'Employees', value: '0', change: '0 active', trend: 'neutral', icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950', sparkline: true },
  { label: 'Cash Flow', value: 'KSh 0.00', change: '+0%', trend: 'up', icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950', sparkline: true },
]

const chartTypes = [
  { name: 'Revenue Trend', icon: LineChart, color: 'text-emerald-500' },
  { name: 'Expense Breakdown', icon: PieChart, color: 'text-red-500' },
  { name: 'Sales Pipeline', icon: BarChart4, color: 'text-blue-500' },
  { name: 'Inventory Levels', icon: AreaChart, color: 'text-orange-500' },
  { name: 'Cash Flow', icon: CandlestickChart, color: 'text-purple-500' },
  { name: 'Performance', icon: ScatterChart, color: 'text-teal-500' },
]

const reportSections = [
  {
    title: 'Financial Reports',
    icon: DollarSign,
    color: 'text-emerald-500',
    reports: ['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Trial Balance', 'General Ledger', 'Accounts Receivable Aging', 'Accounts Payable Aging']
  },
  {
    title: 'Sales & CRM Reports',
    icon: Users,
    color: 'text-blue-500',
    reports: ['Sales Pipeline', 'Lead Conversion', 'Customer Acquisition', 'Revenue by Customer', 'Sales by Product', 'Sales by Region', 'Quotation Analysis']
  },
  {
    title: 'Inventory Reports',
    icon: Package,
    color: 'text-orange-500',
    reports: ['Stock Levels', 'Inventory Valuation', 'Stock Movement Analysis', 'Low Stock Alert', 'Inventory Turnover', 'Warehouse Performance', 'ABC Analysis']
  },
  {
    title: 'HR Reports',
    icon: Briefcase,
    color: 'text-purple-500',
    reports: ['Headcount Summary', 'Attendance Report', 'Leave Analysis', 'Payroll Summary', 'Performance Review', 'Training Report', 'Employee Turnover']
  },
  {
    title: 'Manufacturing Reports',
    icon: Factory,
    color: 'text-teal-500',
    reports: ['Production Output', 'Quality Control', 'Work Order Status', 'Machine Utilization', 'Scrap Analysis', 'Efficiency Report', 'Maintenance Log']
  },
]

const timeRanges = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom']

const insights = [
  { title: 'Revenue Growth', description: 'Revenue is trending upward with a 12% increase compared to last month', type: 'positive', icon: TrendingUp },
  { title: 'Inventory Alert', description: '3 products are below minimum stock levels and need reordering', type: 'warning', icon: AlertCircle },
  { title: 'Top Performer', description: 'Manufacturing department exceeded production targets by 18%', type: 'positive', icon: CheckCircle },
  { title: 'Cash Flow Notice', description: 'Accounts receivable aging shows 5 invoices overdue by 30+ days', type: 'negative', icon: Clock },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium">Business Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <select className="bg-transparent border-none text-sm focus:outline-none">
                {timeRanges.map(range => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
            <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            ← Back to Dashboard
          </Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Analytics</p>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Executive Dashboard', href: '/wavecore-erp/analytics', active: true },
              { icon: DollarSign, label: 'Financial Analytics', href: '/wavecore-erp/analytics/finance' },
              { icon: Users, label: 'Sales Analytics', href: '/wavecore-erp/analytics/sales' },
              { icon: Package, label: 'Inventory Analytics', href: '/wavecore-erp/analytics/inventory' },
              { icon: Briefcase, label: 'HR Analytics', href: '/wavecore-erp/analytics/hr' },
              { icon: Factory, label: 'Manufacturing', href: '/wavecore-erp/analytics/manufacturing' },
              { icon: FileSpreadsheet, label: 'Custom Reports', href: '/wavecore-erp/analytics/custom' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    (item as any).active
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-muted'
                  }`}>
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">AI Insights</p>
            <div className="space-y-2">
              {insights.map((insight) => {
                const Icon = insight.icon
                return (
                  <div key={insight.title} className={`p-3 rounded-xl text-sm ${
                    insight.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-950' :
                    insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950' :
                    'bg-red-50 dark:bg-red-950'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${
                        insight.type === 'positive' ? 'text-emerald-600' :
                        insight.type === 'warning' ? 'text-amber-600' :
                        'text-red-600'
                      }`} />
                      <span className="font-semibold text-xs">{insight.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Business Intelligence</h1>
              <p className="text-muted-foreground mt-1">Executive dashboards, KPIs, interactive charts, and AI-powered forecasting</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filters</Button>
              <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1" /> Share</Button>
              <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-1" /> Print</Button>
              <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" /> Customize</Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${
                      kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-neutral-500'
                    }`}>
                      {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : kpi.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                      {kpi.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                  {kpi.sparkline && (
                    <div className="mt-3 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-800 to-transparent opacity-30" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">Revenue vs Expenses</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-muted"><Maximize2 className="w-4 h-4 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-muted"><Download className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
              <div className="h-64 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Revenue chart will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect data to visualize trends</p>
                </div>
              </div>
            </div>

            {/* Sales Pipeline */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">Sales Pipeline</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-muted"><Maximize2 className="w-4 h-4 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-muted"><Download className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
              <div className="h-64 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart4 className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Pipeline chart will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect data to visualize pipeline</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Types */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Available Charts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {chartTypes.map((chart) => {
                const Icon = chart.icon
                return (
                  <button key={chart.name} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all text-center">
                    <Icon className={`w-8 h-8 ${chart.color} mx-auto mb-2`} />
                    <p className="text-sm font-medium">{chart.name}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reports Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Reports</h3>
            <div className="grid lg:grid-cols-2 gap-6">
              {reportSections.map((section) => {
                const Icon = section.icon
                return (
                  <div key={section.title} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${section.color}`} />
                      </div>
                      <h4 className="font-bold text-neutral-900 dark:text-white">{section.title}</h4>
                    </div>
                    <div className="space-y-2">
                      {section.reports.map((report) => (
                        <Link key={report} href={`/wavecore-erp/analytics/reports/${report.toLowerCase().replace(/\s+/g, '-')}`}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{report}</span>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Forecasting Section */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">AI-Powered</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">AI Forecasting</h2>
                <p className="text-white/80 max-w-lg">
                  Leverage machine learning to predict future trends, identify patterns, and make data-driven decisions.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button className="bg-white text-indigo-700 hover:bg-gray-100">Generate Forecast</Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Learn More</Button>
                </div>
              </div>
              <div className="hidden lg:block">
                <Target className="w-20 h-20 text-white/20" />
              </div>
            </div>
          </div>

          {/* Devices Overview */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
              <Monitor className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">0%</p>
              <p className="text-xs text-muted-foreground">Desktop</p>
            </div>
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
              <Smartphone className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">0%</p>
              <p className="text-xs text-muted-foreground">Mobile</p>
            </div>
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
              <Tablet className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">0%</p>
              <p className="text-xs text-muted-foreground">Tablet</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}