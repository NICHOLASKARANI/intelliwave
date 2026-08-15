'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Settings, Bell, TrendingUp, DollarSign, CreditCard,
  Users, Package, Calculator, FileText, BarChart3, Bot, Workflow, Globe,
  Activity, Building2, Factory, Briefcase, FolderKanban, HeadphonesIcon,
  LogOut, Search as SearchIcon, ArrowUpRight, Menu, X, BellRing,
  ShoppingCart, Store
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { OrganizationSwitcher } from '@/components/wavecore/organization-switcher'
import { DashboardCharts } from '@/components/wavecore/dashboard-charts'

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

const modules = [
  { icon: Calculator, title: 'Finance & Accounting', desc: 'GL, AP/AR, Bank Rec, Budgets', href: '/wavecore-erp/finance', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: Users, title: 'CRM & Sales', desc: 'Leads, Opportunities, Pipeline', href: '/wavecore-erp/crm', bg: 'bg-blue-50 dark:bg-blue-950' },
  { icon: Store, title: 'Point of Sale', desc: 'Products, Sales, Stock, Suppliers', href: '/wavecore-erp/store', bg: 'bg-pink-50 dark:bg-pink-950' },
  { icon: Package, title: 'Inventory', desc: 'Warehouses, Stock, Serial', href: '/wavecore-erp/inventory', bg: 'bg-orange-50 dark:bg-orange-950' },
  { icon: Factory, title: 'Manufacturing', desc: 'BOM, Work Orders, Quality', href: '/wavecore-erp/manufacturing', bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: Briefcase, title: 'HR', desc: 'Employees, Payroll, Attendance', href: '/wavecore-erp/hr', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { icon: FolderKanban, title: 'Projects', desc: 'Tasks, Kanban, Gantt', href: '/wavecore-erp/projects', bg: 'bg-teal-50 dark:bg-teal-950' },
  { icon: HeadphonesIcon, title: 'Helpdesk', desc: 'Tickets, SLA, Knowledge', href: '/wavecore-erp/helpdesk', bg: 'bg-pink-50 dark:bg-pink-950' },
  { icon: FileText, title: 'Documents', desc: 'Storage, OCR, Signatures', href: '/wavecore-erp/documents', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { icon: BarChart3, title: 'BI & Analytics', desc: 'Dashboards, KPIs, Forecasts', href: '/wavecore-erp/analytics', bg: 'bg-violet-50 dark:bg-violet-950' },
  { icon: Bot, title: 'AI Copilot', desc: 'AI Assistant, Smart Search', href: '/wavecore-erp/ai', bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: Workflow, title: 'Automation', desc: 'Workflows, Approvals, Rules', href: '/wavecore-erp/automation', bg: 'bg-amber-50 dark:bg-amber-950' },
  { icon: Globe, title: 'Website', desc: 'Builder, CMS, E-Commerce', href: '/wavecore-erp/website', bg: 'bg-sky-50 dark:bg-sky-950' },
  { icon: Settings, title: 'Settings', desc: 'Users, Roles, Permissions', href: '/wavecore-erp/settings', bg: 'bg-gray-50 dark:bg-gray-950' },
]

export default function WaveCoreERPPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/wavecore/dashboard')
        if (res.status === 401) { router.push('/wavecore-erp/auth/login'); return }
        if (res.ok) setData(await res.json())
      } catch {} finally { setLoading(false) }
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
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const k = data?.kpis

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="hidden md:inline font-bold text-lg">WaveCore</span>
            </Link>
            <OrganizationSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block overflow-y-auto">
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

        <main className="flex-1 p-4 lg:p-8">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Welcome, {data?.user?.name}</h1>
            <p className="text-white/80 text-sm">{data?.organization?.name}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard label="Revenue" value={`KSh ${(k?.revenueMTD || 0).toLocaleString()}`} icon={TrendingUp} color="text-emerald-500" />
            <KPICard label="Customers" value={String(k?.activeCustomers || 0)} icon={Users} color="text-blue-500" />
            <KPICard label="Products" value={String(k?.inventoryItems || 0)} icon={Package} color="text-orange-500" />
            <KPICard label="Invoices" value={String(k?.invoiceCount || 0)} icon={FileText} color="text-purple-500" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.title} href={mod.href}
                  className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${mod.bg} flex items-center justify-center`}>
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
        </main>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}