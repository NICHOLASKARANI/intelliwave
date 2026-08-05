import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Calculator, Users, Package, Factory, Briefcase, FolderKanban,
  HeadphonesIcon, FileText, BarChart3, Bot, Workflow, Globe,
  ArrowRight, Sparkles, LayoutDashboard, Settings, Search,
  Bell, ChevronDown, Plus, TrendingUp, DollarSign, Receipt,
  CreditCard, Building2, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'WaveCore ERP - Enterprise Business Operating System | IntelliWavve',
  description: 'WaveCore ERP — Complete enterprise business operating system. Finance, CRM, Inventory, HR, Manufacturing, and AI-powered automation.',
}

const kpiCards = [
  { icon: DollarSign, label: 'Revenue (MTD)', value: 'KSh 0.00', change: '+0%', color: 'from-green-500 to-emerald-500' },
  { icon: Receipt, label: 'Invoices Due', value: '0', change: '0 pending', color: 'from-blue-500 to-cyan-500' },
  { icon: CreditCard, label: 'Expenses (MTD)', value: 'KSh 0.00', change: '+0%', color: 'from-orange-500 to-red-500' },
  { icon: TrendingUp, label: 'Bank Balance', value: 'KSh 0.00', change: 'Updated', color: 'from-purple-500 to-pink-500' },
]

const modules = [
  { icon: Calculator, title: 'Finance', desc: 'GL, AP/AR, Bank Rec, Budgets', href: '/wavecore-erp/finance', status: 'active', color: 'from-green-500 to-emerald-500' },
  { icon: Users, title: 'CRM & Sales', desc: 'Leads, Pipeline, Orders', href: '/wavecore-erp/crm', status: 'coming', color: 'from-blue-500 to-cyan-500' },
  { icon: Package, title: 'Inventory', desc: 'Warehouses, Stock, Barcode', href: '/wavecore-erp/inventory', status: 'coming', color: 'from-orange-500 to-red-500' },
  { icon: Factory, title: 'Manufacturing', desc: 'BOM, Work Orders, QC', href: '/wavecore-erp/manufacturing', status: 'coming', color: 'from-purple-500 to-pink-500' },
  { icon: Briefcase, title: 'HR', desc: 'Employees, Payroll, Leave', href: '/wavecore-erp/hr', status: 'coming', color: 'from-indigo-500 to-blue-500' },
  { icon: FolderKanban, title: 'Projects', desc: 'Tasks, Gantt, Time', href: '/wavecore-erp/projects', status: 'coming', color: 'from-teal-500 to-green-500' },
  { icon: HeadphonesIcon, title: 'Helpdesk', desc: 'Tickets, SLA, KB', href: '/wavecore-erp/helpdesk', status: 'coming', color: 'from-pink-500 to-rose-500' },
  { icon: BarChart3, title: 'Analytics', desc: 'KPIs, Reports, Forecasts', href: '/wavecore-erp/analytics', status: 'coming', color: 'from-cyan-500 to-blue-500' },
  { icon: Bot, title: 'AI Copilot', desc: 'AI Assistant & Insights', href: '/wavecore-erp/ai', status: 'coming', color: 'from-violet-500 to-purple-500' },
  { icon: Workflow, title: 'Automation', desc: 'Workflows & Approvals', href: '/wavecore-erp/automation', status: 'coming', color: 'from-rose-500 to-pink-500' },
  { icon: Globe, title: 'Website', desc: 'CMS & E-Commerce', href: '/wavecore-erp/website', status: 'coming', color: 'from-amber-500 to-orange-500' },
  { icon: Settings, title: 'Settings', desc: 'Admin & Configuration', href: '/wavecore-erp/settings', status: 'coming', color: 'from-gray-500 to-slate-500' },
]

const quickActions = [
  { label: 'Create Invoice', href: '/wavecore-erp/finance/invoices/create', icon: Plus },
  { label: 'Record Payment', href: '/wavecore-erp/finance/payments/create', icon: CreditCard },
  { label: 'New Journal Entry', href: '/wavecore-erp/finance/journal/create', icon: FileText },
  { label: 'Bank Reconciliation', href: '/wavecore-erp/finance/reconciliation', icon: Building2 },
]

export default function WaveCoreERPPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* ========================================== TOP NAV ========================================== */}
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-2">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-lg text-neutral-900 dark:text-white">WaveCore</span>
            </Link>
            <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search anything... (Ctrl+K)" className="w-64 pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">IW</div>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* ========================================== MAIN CONTENT ========================================== */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-56px)] p-4 hidden lg:block">
          <nav className="space-y-1">
            <Link href="/wavecore-erp" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.title} href={mod.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    mod.status === 'active' 
                      ? 'text-neutral-700 dark:text-neutral-300 hover:bg-muted' 
                      : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span>{mod.title}</span>
                  {mod.status === 'coming' && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-500">Soon</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.color} p-2`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <span className="text-xs text-green-500 font-medium">{kpi.change}</span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.label} href={action.href}
                  className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
                  <Icon className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Module Grid */}
          <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white">All Modules</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.title} href={mod.status === 'active' ? mod.href : '#'}
                  className={`p-5 rounded-2xl border bg-white dark:bg-neutral-900 transition-all ${
                    mod.status === 'active' 
                      ? 'hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} p-2 mb-3`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="font-bold text-neutral-900 dark:text-white">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                  {mod.status === 'active' && (
                    <span className="inline-block mt-2 text-xs text-green-600 font-medium">● Active</span>
                  )}
                </Link>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}