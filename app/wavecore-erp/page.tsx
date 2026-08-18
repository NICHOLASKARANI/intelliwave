'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Settings, Bell, TrendingUp, DollarSign, CreditCard,
  Users, Package, Calculator, FileText, BarChart3, Bot, Workflow, Globe,
  Activity, Building2, Factory, Briefcase, FolderKanban, HeadphonesIcon,
  LogOut, Search as SearchIcon, ArrowUpRight, Menu, X, BellRing,
  CheckCheck, Store, ShoppingCart, Loader2
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
  const [subscribed, setSubscribed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  async function checkAuthAndFetch() {
    try {
      const sessionRes = await fetch('/api/wavecore/auth/session')
      if (!sessionRes.ok) {
        setLoading(false)
        return
      }
      
      const sessionData = await sessionRes.json()
      if (!sessionData.authenticated) {
        setLoading(false)
        return
      }

      if (!sessionData.subscribed) {
        setSubscribed(false)
        setLoading(false)
        return
      }

      setSubscribed(true)

      // Fetch dashboard data
      const dashRes = await fetch('/api/wavecore/dashboard')
      if (dashRes.ok) {
        const dashData = await dashRes.json()
        setData(dashData)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  // Not authenticated - show landing
  if (!subscribed && !data) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={80} height={80} className="rounded-xl mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">WaveCore ERP</h1>
          <p className="text-muted-foreground mb-8">
            Complete business management for Kenyan businesses
          </p>
          <div className="space-y-3">
            <Link href="/wavecore-erp/auth/login" className="block w-full py-3 rounded-xl bg-blue-600 text-white text-center font-medium hover:bg-blue-700">
              Sign In
            </Link>
            <Link href="/wavecore-erp/auth/signup" className="block w-full py-3 rounded-xl border text-center font-medium hover:bg-neutral-100">
              Create Account - KSh 500/month
            </Link>
            <Link href="/marketplace" className="block w-full py-3 rounded-xl border text-center font-medium hover:bg-neutral-100">
              Browse Marketplace
            </Link>
            <Link href="/ride" className="block w-full py-3 rounded-xl border text-center font-medium hover:bg-neutral-100">
              Wavve Ride
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Need subscription
  if (!subscribed) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CreditCard className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
          <p className="text-muted-foreground mb-6">
            Pay KSh 500/month to access WaveCore ERP
          </p>
          <Link href="/wavecore-erp/subscription" className="block w-full py-3 rounded-xl bg-green-600 text-white text-center font-medium hover:bg-green-700">
            Pay KSh 500 - Activate Now
          </Link>
        </div>
      </div>
    )
  }

  // Full dashboard
  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold hidden sm:block">WaveCore</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher />
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-xl hover:bg-neutral-100">
              <SearchIcon className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl hover:bg-neutral-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Welcome */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Welcome back, {data?.user?.name || 'User'}!
          </h1>
          <p className="text-white/80">
            {data?.organization?.name || 'Your Business'} • {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <TrendingUp className="w-6 h-6 text-emerald-500 mb-3" />
            <p className="text-xl font-bold">{formatKES(data?.kpis?.revenueMTD)}</p>
            <p className="text-xs text-muted-foreground">Revenue (MTD)</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <Users className="w-6 h-6 text-blue-500 mb-3" />
            <p className="text-xl font-bold">{data?.kpis?.activeCustomers || 0}</p>
            <p className="text-xs text-muted-foreground">Active Customers</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <DollarSign className="w-6 h-6 text-orange-500 mb-3" />
            <p className="text-xl font-bold">{formatKES(data?.kpis?.outstandingReceivables)}</p>
            <p className="text-xs text-muted-foreground">Receivables</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <Package className="w-6 h-6 text-purple-500 mb-3" />
            <p className="text-xl font-bold">{data?.kpis?.inventoryItems || 0}</p>
            <p className="text-xs text-muted-foreground">Inventory Items</p>
          </div>
        </div>

        {/* Modules */}
        <h2 className="text-lg font-bold mb-4">Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {modules.map(module => {
            const Icon = module.icon
            return (
              <Link key={module.title} href={module.href}
                className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all group">
                <div className={`w-10 h-10 rounded-xl ${module.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm">{module.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
              </Link>
            )
          })}
        </div>

        {/* Charts */}
        <DashboardCharts data={data} />
      </main>
    </div>
  )
}