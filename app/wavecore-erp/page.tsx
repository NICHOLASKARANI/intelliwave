'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Settings, Search, Bell, ChevronDown, Plus,
  TrendingUp, DollarSign, Receipt, CreditCard, Users, Package,
  Calculator, FileText, BarChart3, Bot, Workflow, Globe,
  ArrowRight, Sparkles, Activity, Clock, Target, Zap, Shield,
  Building2, Factory, Briefcase, FolderKanban, HeadphonesIcon,
  ArrowUpRight, ArrowDownRight, Filter, Download,
  ChevronRight, Wrench, Truck, Store, Plane,
  Ship, HardHat, Stethoscope, GraduationCap, Heart, Landmark,
  Scale, ShoppingCart, Dumbbell, Scissors, CheckCircle,
  Cloud, Server, Database, HardDrive, Layers, LogOut, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface DashboardData {
  organization: { id: string; name: string }
  user: { id: string; name: string; email: string; role: string }
  kpis: {
    revenueMTD: number
    outstandingReceivables: number
    accountsPayable: number
    activeCustomers: number
    inventoryItems: number
    employees: number
    invoiceCount: number
    journalEntries: number
  }
  recentActivity: Array<{ action: string; entityType: string; createdAt: string }>
}

const formatKES = (amount: number) => {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const modules = [
  { icon: Calculator, title: 'Finance & Accounting', desc: 'GL, AP/AR, Bank Rec, Budgets, Reports', href: '/wavecore-erp/finance', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: Users, title: 'CRM & Sales', desc: 'Leads, Opportunities, Pipeline, Quotations', href: '/wavecore-erp/crm', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { icon: Package, title: 'Inventory', desc: 'Multi-Warehouse, Stock, Serial Numbers', href: '/wavecore-erp/inventory', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { icon: Factory, title: 'Manufacturing', desc: 'BOM, Work Orders, Quality Control', href: '/wavecore-erp/manufacturing', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: Briefcase, title: 'HR', desc: 'Employees, Payroll, Attendance, Leave', href: '/wavecore-erp/hr', color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { icon: FolderKanban, title: 'Projects', desc: 'Tasks, Kanban, Gantt Charts', href: '/wavecore-erp/projects', color: 'from-teal-500 to-green-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { icon: HeadphonesIcon, title: 'Helpdesk', desc: 'Tickets, SLA, Knowledge Base', href: '/wavecore-erp/helpdesk', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50 dark:bg-pink-950' },
  { icon: FileText, title: 'Documents', desc: 'Storage, OCR, E-Signatures', href: '/wavecore-erp/documents', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { icon: BarChart3, title: 'BI & Analytics', desc: 'Dashboards, KPIs, AI Forecasting', href: '/wavecore-erp/analytics', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950' },
  { icon: Bot, title: 'AI Copilot', desc: 'Natural Language, AI Assistant', href: '/wavecore-erp/ai', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: Workflow, title: 'Automation', desc: 'Workflows, Approvals, Rules', href: '/wavecore-erp/automation', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950' },
  { icon: Globe, title: 'Website', desc: 'Builder, CMS, E-Commerce', href: '/wavecore-erp/website', color: 'from-sky-500 to-blue-500', bg: 'bg-sky-50 dark:bg-sky-950' },
  { icon: Settings, title: 'Settings', desc: 'Users, Roles, Permissions', href: '/wavecore-erp/settings', color: 'from-gray-500 to-slate-500', bg: 'bg-gray-50 dark:bg-gray-950' },
]

export default function WaveCoreERPPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/wavecore/dashboard')
        if (res.status === 401) {
          router.push('/wavecore-erp/auth/login')
          return
        }
        if (!res.ok) throw new Error('Failed to load dashboard')
        const dashboardData = await res.json()
        setData(dashboardData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/wavecore/auth/logout', { method: 'POST' })
    router.push('/wavecore-erp/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const k = data?.kpis

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="object-cover" />
              </div>
              <span className="font-bold text-lg text-neutral-900 dark:text-white">WaveCore</span>
              <span className="px-2 py-0.5 text-[9px] bg-indigo-600 text-white rounded-full">ERP</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Organization name */}
            <span className="hidden md:inline text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {data?.organization.name}
            </span>
            <button className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            {/* User menu */}
            <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 dark:border-neutral-700">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                {data?.user?.name?.[0] || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{data?.user?.name}</p>
                <p className="text-[10px] text-muted-foreground">{data?.user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block overflow-y-auto">
          <Link href="/wavecore-erp" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold mb-6">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <nav className="space-y-1">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.title} href={mod.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${mod.bg} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span>{mod.title}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Welcome Banner */}
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8 overflow-hidden">
            <div className="relative">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                Welcome back, {data?.user?.name}
              </h1>
              <p className="text-white/80 text-sm">
                {data?.organization.name} • {data?.user?.role}
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard label="Revenue (MTD)" value={formatKES(k?.revenueMTD || 0)} icon={TrendingUp} color="text-emerald-500" />
            <KPICard label="Receivables" value={formatKES(k?.outstandingReceivables || 0)} icon={DollarSign} color="text-orange-500" />
            <KPICard label="Payables" value={formatKES(k?.accountsPayable || 0)} icon={CreditCard} color="text-blue-500" />
            <KPICard label="Customers" value={(k?.activeCustomers || 0).toString()} icon={Users} color="text-teal-500" />
            <KPICard label="Products" value={(k?.inventoryItems || 0).toString()} icon={Package} color="text-rose-500" />
            <KPICard label="Employees" value={(k?.employees || 0).toString()} icon={Briefcase} color="text-indigo-500" />
            <KPICard label="Invoices" value={(k?.invoiceCount || 0).toString()} icon={FileText} color="text-purple-500" />
            <KPICard label="Journal Entries" value={(k?.journalEntries || 0).toString()} icon={Calculator} color="text-violet-500" />
          </div>

          {/* Modules Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.title} href={mod.href}
                  className="group p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${mod.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{mod.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <h3 className="font-bold mb-4">Recent Activity</h3>
            {data?.recentActivity?.length ? (
              <div className="space-y-3">
                {data.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    <span className="flex-1">{activity.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet. Start using WaveCore to see your activity here.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}