'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Settings, Bell, TrendingUp, DollarSign, CreditCard,
  Users, Package, Calculator, FileText, BarChart3, Bot, Workflow, Globe,
  Activity, Building2, Factory, Briefcase, FolderKanban, HeadphonesIcon,
  LogOut, Search as SearchIcon, ArrowUpRight, Menu, X, BellRing, CheckCheck
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

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
}

interface Notification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
}

const formatKES = (amount: number) => {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const modules = [
  { icon: Calculator, title: 'Finance & Accounting', desc: 'GL, AP/AR, Bank Rec, Budgets', href: '/wavecore-erp/finance', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { icon: Users, title: 'CRM & Sales', desc: 'Leads, Opportunities, Pipeline', href: '/wavecore-erp/crm', bg: 'bg-blue-50 dark:bg-blue-950' },
  { icon: Package, title: 'Inventory', desc: 'Warehouses, Stock, Serial Numbers', href: '/wavecore-erp/inventory', bg: 'bg-orange-50 dark:bg-orange-950' },
  { icon: Factory, title: 'Manufacturing', desc: 'BOM, Work Orders, Quality', href: '/wavecore-erp/manufacturing', bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: Briefcase, title: 'HR', desc: 'Employees, Payroll, Attendance', href: '/wavecore-erp/hr', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { icon: FolderKanban, title: 'Projects', desc: 'Tasks, Kanban, Gantt', href: '/wavecore-erp/projects', bg: 'bg-teal-50 dark:bg-teal-950' },
  { icon: HeadphonesIcon, title: 'Helpdesk', desc: 'Tickets, SLA, Knowledge', href: '/wavecore-erp/helpdesk', bg: 'bg-pink-50 dark:bg-pink-950' },
  { icon: FileText, title: 'Documents', desc: 'Storage, OCR, Signatures', href: '/wavecore-erp/documents', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { icon: BarChart3, title: 'BI & Analytics', desc: 'Dashboards, KPIs, Forecasts', href: '/wavecore-erp/analytics', bg: 'bg-violet-50 dark:bg-violet-950' },
  { icon: Bot, title: 'AI Copilot', desc: 'AI Assistant, Smart Search', href: '/wavecore-erp/ai', bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: Workflow, title: 'Automation', desc: 'Workflows, Approvals, Rules', href: '/wavecore-erp/automation', bg: 'bg-amber-50 dark:bg-amber-950' },
    { icon: Store, title: 'Point of Sale', desc: 'Products, Sales, Stock, Suppliers', href: '/wavecore-erp/store', bg: 'bg-pink-50 dark:bg-pink-950' },{ icon: Globe, title: 'Website', desc: 'Builder, CMS, E-Commerce', href: '/wavecore-erp/website', bg: 'bg-sky-50 dark:bg-sky-950' },
  { icon: Settings, title: 'Settings', desc: 'Users, Roles, Permissions', href: '/wavecore-erp/settings', bg: 'bg-gray-50 dark:bg-gray-950' },
]

const entityIcons: Record<string, any> = {
  customer: Users,
  product: Package,
  invoice: FileText,
  employee: Briefcase,
  project: FolderKanban,
  lead: Users,
}

export default function WaveCoreERPPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  // Fetch dashboard data
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
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [router])

  // Fetch notifications (poll every 30 seconds)
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/wavecore/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      } catch {}
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
        setSearchResults([])
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Debounced global search
  useEffect(() => {
    async function performSearch() {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/wavecore/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.results)
        }
      } catch {} finally {
        setSearchLoading(false)
      }
    }
    const debounce = setTimeout(performSearch, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleLogout = async () => {
    await fetch('/api/wavecore/auth/logout', { method: 'POST' })
    router.push('/wavecore-erp/auth/login')
  }

  const markAllRead = async () => {
    await fetch('/api/wavecore/notifications', { method: 'PUT' })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
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
      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border">
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              <SearchIcon className="w-5 h-5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers, invoices, products, employees..."
                className="flex-1 bg-transparent text-lg focus:outline-none"
              />
              <kbd className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-3">
              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => {
                  const EntityIcon = entityIcons[result.type] || FileText
                  return (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={`/wavecore-erp/${result.type === 'invoice' ? 'finance/invoices' : result.type === 'product' ? 'inventory/products' : result.type === 'employee' ? 'hr' : result.type === 'lead' ? 'crm/leads' : result.type === 'project' ? 'projects' : 'crm/customers'}/${result.id}`}
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                        <EntityIcon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle} â€¢ {result.type}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  )
                })
              ) : searchQuery.length >= 2 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-[90]" onClick={() => setNotificationsOpen(false)}>
          <div className="absolute top-16 right-4 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b last:border-0 ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">No notifications</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="object-cover" />
              </div>
              <span className="hidden md:inline font-bold text-lg text-neutral-900 dark:text-white">WaveCore</span>
              <span className="hidden md:inline px-2 py-0.5 text-[9px] bg-indigo-600 text-white rounded-full">ERP</span>
            </Link>
            <OrganizationSwitcher />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border bg-neutral-50 dark:bg-neutral-800 text-sm text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
              <SearchIcon className="w-4 h-4" />
              <span>Search...</span>
              <kbd className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 rounded">Ctrl K</kbd>
            </button>

            {/* Notifications bell */}
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

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

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[95] bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white dark:bg-neutral-900 p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold">WaveCore ERP</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {modules.map((mod) => {
                const Icon = mod.icon
                return (
                  <Link key={mod.title} href={mod.href} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span>{mod.title}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
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
                {data?.organization.name} â€¢ {data?.user?.role}
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

          {/* Charts */}
          <DashboardCharts organizationId={data?.organization?.id || ''} />

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
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all cursor-default">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}