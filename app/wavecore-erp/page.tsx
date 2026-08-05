import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Calculator, Users, Package, Factory, Briefcase, FolderKanban,
  HeadphonesIcon, FileText, BarChart3, Bot, Workflow, Globe,
  ArrowRight, Sparkles, LayoutDashboard, Settings, Search,
  Bell, ChevronDown, Plus, TrendingUp, DollarSign, Receipt,
  CreditCard, Building2, Shield, Zap, Activity, Clock, Target,
  Layers, ChevronRight, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'WaveCore ERP - Enterprise Business Operating System | IntelliWavve',
  description: 'WaveCore ERP — Complete enterprise business operating system. Finance, CRM, Inventory, HR, Manufacturing, and AI-powered automation.',
}

const kpiCards = [
  { icon: DollarSign, label: 'Revenue (MTD)', value: 'KSh 0.00', change: '+0%', trend: 'up', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: Receipt, label: 'Invoices Due', value: '0', change: '0 pending', trend: 'neutral', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { icon: CreditCard, label: 'Expenses (MTD)', value: 'KSh 0.00', change: '+0%', trend: 'up', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { icon: TrendingUp, label: 'Bank Balance', value: 'KSh 0.00', change: 'Updated', trend: 'up', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: Users, label: 'Active Customers', value: '0', change: '0 new', trend: 'neutral', color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { icon: Package, label: 'Stock Items', value: '0', change: 'In stock', trend: 'neutral', color: 'from-teal-500 to-green-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { icon: Activity, label: 'Open Tasks', value: '0', change: '0 due today', trend: 'neutral', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: Zap, label: 'System Status', value: 'Online', change: '99.9% uptime', trend: 'up', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950' },
]

const modules = [
  { icon: Calculator, title: 'Finance & Accounting', desc: 'General Ledger, AP/AR, Bank Reconciliation, Budgets, Financial Reports', href: '/wavecore-erp/finance', status: 'active', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: Users, title: 'CRM & Sales', desc: 'Leads, Opportunities, Pipeline, Quotations, Sales Orders, Customer Portal', href: '/wavecore-erp/crm', status: 'coming', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { icon: Package, title: 'Inventory & Warehouse', desc: 'Multi-Warehouse, Stock, Barcode, Serial Numbers, Transfers', href: '/wavecore-erp/inventory', status: 'coming', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { icon: Factory, title: 'Manufacturing (MRP)', desc: 'Bill of Materials, Work Orders, Production, Quality Control', href: '/wavecore-erp/manufacturing', status: 'coming', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: Briefcase, title: 'Human Resources', desc: 'Employees, Recruitment, Payroll, Attendance, Leave, Performance', href: '/wavecore-erp/hr', status: 'coming', color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { icon: FolderKanban, title: 'Projects', desc: 'Tasks, Kanban, Gantt, Time Tracking, Resource Planning', href: '/wavecore-erp/projects', status: 'coming', color: 'from-teal-500 to-green-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { icon: HeadphonesIcon, title: 'Helpdesk', desc: 'Tickets, SLA, Knowledge Base, Live Chat, Escalations', href: '/wavecore-erp/helpdesk', status: 'coming', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50 dark:bg-pink-950' },
  { icon: FileText, title: 'Documents', desc: 'OCR, Version Control, Digital Signatures, Approval Workflows', href: '/wavecore-erp/documents', status: 'coming', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { icon: BarChart3, title: 'Business Intelligence', desc: 'Executive Dashboards, KPIs, Reports, AI Forecasting', href: '/wavecore-erp/analytics', status: 'coming', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950' },
  { icon: Bot, title: 'AI Copilot', desc: 'Natural Language Queries, AI Assistant, Smart Insights', href: '/wavecore-erp/ai', status: 'coming', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: Workflow, title: 'Workflow Automation', desc: 'Visual Workflow Builder, Approvals, Business Rules', href: '/wavecore-erp/automation', status: 'coming', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950' },
  { icon: Globe, title: 'Website & Commerce', desc: 'Website Builder, CMS, E-Commerce, Customer Accounts', href: '/wavecore-erp/website', status: 'coming', color: 'from-sky-500 to-blue-500', bg: 'bg-sky-50 dark:bg-sky-950' },
]

const quickActions = [
  { label: 'Create Invoice', href: '/wavecore-erp/finance/invoices/create', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'Record Payment', href: '/wavecore-erp/finance/payments/create', icon: CreditCard, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'New Journal Entry', href: '/wavecore-erp/finance/journal/create', icon: Calculator, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Bank Reconciliation', href: '/wavecore-erp/finance/reconciliation', icon: Building2, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Add Customer', href: '/wavecore-erp/crm/customers/create', icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
  { label: 'Add Product', href: '/wavecore-erp/inventory/products/create', icon: Package, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
]

const recentActivity = [
  { action: 'System initialized', time: 'Just now', type: 'system' },
  { action: 'Chart of Accounts configured', time: 'Just now', type: 'setup' },
  { action: 'Welcome to WaveCore ERP', time: 'Just now', type: 'info' },
]

export default function WaveCoreERPPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* ========================================== TOP NAVIGATION ========================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            {/* WaveCore Logo */}
            <Link href="/wavecore-erp" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg group-hover:shadow-xl transition-all">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <div>
                <span className="font-bold text-xl text-neutral-900 dark:text-white tracking-tight">WaveCore</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search anything... (Ctrl+K)" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-muted transition-colors">
              <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">IW</div>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
        </div>
      </header>

      {/* ========================================== MAIN LAYOUT ========================================== */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <div className="mb-6">
            <Link href="/wavecore-erp" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-semibold shadow-sm">
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Main Modules</p>
            {modules.map((mod) => {
              const Icon = mod.icon
              const isActive = mod.status === 'active'
              return (
                <Link
                  key={mod.title}
                  href={isActive ? mod.href : '#'}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    isActive 
                      ? 'text-neutral-700 dark:text-neutral-300 hover:bg-muted cursor-pointer' 
                      : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-70'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{mod.title}</span>
                  {!isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-medium">Soon</span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </Link>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t">
            <Link href="/" className="flex items-center gap-2 px-4 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="w-4 h-4" /> Back to IntelliWavve
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Welcome Banner */}
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Welcome to WaveCore </h2>
                <p className="text-white/80 text-sm lg:text-base max-w-lg">
                  Your enterprise business operating system is ready. Start by configuring your Chart of Accounts, adding customers, or creating your first invoice.
                </p>
                <div className="flex gap-3 mt-4">
                  <Link href="/wavecore-erp/finance">
                    <Button size="sm" className="bg-white text-indigo-700 hover:bg-gray-100 font-medium">
                      Go to Finance <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${kpi.color.split(' ')[0].replace('from-', 'text-')}`} />
                    </div>
                    <span className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-500' : 'text-neutral-500'}`}>
                      {kpi.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Module Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">All Modules</h3>
              <span className="text-xs text-muted-foreground">{modules.filter(m => m.status === 'active').length} active • {modules.filter(m => m.status === 'coming').length} coming soon</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => {
                const Icon = mod.icon
                const isActive = mod.status === 'active'
                return (
                  <Link key={mod.title} href={isActive ? mod.href : '#'}
                    className={`p-5 rounded-2xl border bg-white dark:bg-neutral-900 transition-all ${
                      isActive 
                        ? 'hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg cursor-pointer' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${mod.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-neutral-900 dark:text-white">{mod.title}</h3>
                          {isActive ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium">Active</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-medium">Coming</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-5">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'system' ? 'bg-blue-500' : 
                    activity.type === 'setup' ? 'bg-green-500' : 'bg-neutral-400'
                  }`} />
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300">{activity.action}</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}