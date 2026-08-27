'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Settings, Bell, TrendingUp, DollarSign, CreditCard,
  Users, Package, Calculator, FileText, BarChart3, Bot, Workflow, Globe,
  Activity, Factory, Scan, Camera, HeartPulse, Brain, Shield, Leaf, Barcode, Languages, GraduationCap, Home, Facebook, Instagram, MessageCircle, Music2, Twitter, Eye, Fence, Moon, PawPrint, HardHat, Crosshair, Flag, Briefcase, FolderKanban, HeadphonesIcon, Truck,
  LogOut, Search as SearchIcon, ArrowUpRight, Menu, X, BellRing,
  CheckCheck, Store, ShoppingCart, Bike, Loader2, CalendarDays, Wallet,
  Sparkles, ChevronRight, PieChart, LineChart, Download, Filter
} from 'lucide-react'

const modules = [
  { icon: Calculator, title: 'Finance & Accounting', desc: 'GL, AP/AR, Bank Rec, Budgets', href: '/wavecore-erp/finance', bg: 'from-emerald-500 to-green-600', color: 'text-emerald-500' },
  { icon: Users, title: 'CRM & Sales', desc: 'Leads, Opportunities, Pipeline', href: '/wavecore-erp/crm', bg: 'from-blue-500 to-indigo-600', color: 'text-blue-500' },
  { icon: Store, title: 'Point of Sale', desc: 'Products, Sales, Stock', href: '/wavecore-erp/store', bg: 'from-pink-500 to-rose-600', color: 'text-pink-500' },
  { icon: Package, title: 'Inventory', desc: 'Warehouses, Stock, Serial', href: '/wavecore-erp/inventory', bg: 'from-orange-500 to-amber-600', color: 'text-orange-500' },
  { icon: Factory, title: 'Manufacturing', desc: 'BOM, Work Orders, Quality', href: '/wavecore-erp/manufacturing', bg: 'from-purple-500 to-violet-600', color: 'text-purple-500' },
  { icon: Briefcase, title: 'HR', desc: 'Employees, Payroll, Attendance', href: '/wavecore-erp/hr', bg: 'from-indigo-500 to-blue-600', color: 'text-indigo-500' },
  { icon: FolderKanban, title: 'Projects', desc: 'Tasks, Kanban, Gantt', href: '/wavecore-erp/projects', bg: 'from-teal-500 to-cyan-600', color: 'text-teal-500' },
  { icon: HeadphonesIcon, title: 'Helpdesk', desc: 'Tickets, SLA, Knowledge', href: '/wavecore-erp/helpdesk', bg: 'from-rose-500 to-pink-600', color: 'text-rose-500' },
  { icon: FileText, title: 'Documents', desc: 'Storage, OCR, Signatures', href: '/wavecore-erp/documents', bg: 'from-cyan-500 to-sky-600', color: 'text-cyan-500' },
  { icon: BarChart3, title: 'BI & Analytics', desc: 'Dashboards, KPIs, Forecasts', href: '/wavecore-erp/analytics', bg: 'from-violet-500 to-purple-600', color: 'text-violet-500' },
  { icon: Bot, title: 'AI Copilot', desc: 'AI Assistant, Smart Search', href: '/wavecore-erp/ai', bg: 'from-rose-500 to-red-600', color: 'text-rose-500' },
  { icon: Workflow, title: 'Automation', desc: 'Workflows, Approvals', href: '/wavecore-erp/automation', bg: 'from-amber-500 to-orange-600', color: 'text-amber-500' },
  { icon: Truck, title: 'Procurement', desc: 'Suppliers, RFQs, Purchase Orders', href: '/wavecore-erp/procurement', bg: 'from-sky-500 to-blue-600', color: 'text-sky-500' },
  { icon: Settings, title: 'Settings', desc: 'Users, Roles, Permissions', href: '/wavecore-erp/settings', bg: 'from-gray-500 to-slate-600', color: 'text-gray-500' },
  { icon: Store, title: 'WavveMarket', desc: 'Buy & Sell Marketplace', href: '/marketplace', bg: 'from-pink-500 to-rose-600', color: 'text-pink-500' },
  { icon: Bike, title: 'WavveRide', desc: 'Rides & Delivery', href: '/ride', bg: 'from-green-500 to-emerald-600', color: 'text-green-500' },
  { icon: Scan, title: 'AI Vision Suite', desc: 'License, PPE, Fall, Drowsiness, Vehicle', href: '/wavecore-erp/ai-vision/license-plates', bg: 'from-blue-500 to-indigo-600', color: 'text-blue-500' },
  { icon: HeartPulse, title: 'AI Health Suite', desc: 'ECG, Vitals, Cardiac, Pulse', href: '/wavecore-erp/ai-health/ecg-arrhythmia', bg: 'from-red-500 to-rose-600', color: 'text-red-500' },
  { icon: Shield, title: 'AI Security Suite', desc: 'Lie, Anger, Red Flag, Night', href: '/wavecore-erp/ai-security/lie-detection', bg: 'from-purple-500 to-violet-600', color: 'text-purple-500' },
  { icon: Leaf, title: 'AI Agriculture', desc: 'Greenhouse, Cattle, Ranch', href: '/wavecore-erp/ai-vision/greenhouse', bg: 'from-green-500 to-emerald-600', color: 'text-green-500' },
  { icon: DollarSign, title: 'AI Finance', desc: 'Forex Signals', href: '/wavecore-erp/ai-finance/forex-signals', bg: 'from-amber-500 to-yellow-600', color: 'text-amber-500' },
  { icon: GraduationCap, title: 'AI Education', desc: 'Student Performance', href: '/wavecore-erp/ai-education/student-performance', bg: 'from-cyan-500 to-sky-600', color: 'text-cyan-500' },
  { icon: Languages, title: 'AI Language', desc: 'Arabic Detection', href: '/wavecore-erp/ai-language/arabic-detection', bg: 'from-teal-500 to-emerald-600', color: 'text-teal-500' },
  { icon: Facebook, title: 'Social Media AI', desc: 'FB, IG, WA, TikTok, X', href: '/wavecore-erp/social-media', bg: 'from-blue-600 to-pink-600', color: 'text-pink-500' },
]

export default function ExecutiveDashboard() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<any>({})
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    // Check session on mount
    fetch('/api/wavecore/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.session) {
          window.location.href = '/wavecore-erp/auth/login'
        }
      })
      .catch(() => {
        window.location.href = '/wavecore-erp/auth/login'
      })
    // Check session on mount
    fetch('/api/wavecore/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.session) {
          window.location.href = '/wavecore-erp/auth/login'
        }
      })
      .catch(() => {
        window.location.href = '/wavecore-erp/auth/login'
      })
    fetchAllData()
  }, [])

  async function fetchAllData() {
    try {
      const sessionRes = await fetch('/api/wavecore/auth/session')
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        setSession(sessionData)
      }

      const subRes = await fetch('/api/wavecore/subscription')
      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData)
      }

      const dashRes = await fetch('/api/wavecore/dashboard')
      if (dashRes.ok) {
        const dashData = await dashRes.json()
        setKpis(dashData.kpis || {})
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading Executive Dashboard...</p>
        </div>
      </div>
    )
  }

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link prefetch={true} href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <div>
              <span className="font-bold text-lg">WaveCore ERP</span>
              <p className="text-xs text-slate-400">{session?.organization?.name || 'Executive Dashboard'}</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Subscription Badge */}
            {subscription?.subscribed ? (
              <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Active until {new Date(subscription.expiresAt).toLocaleDateString()}
              </span>
            ) : (
              <Link prefetch={true} href="/wavecore-erp/subscription" className="px-3 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-full flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Subscribe KSh 500
              </Link>
            )}

            <button className="p-2 rounded-xl hover:bg-slate-800 relative">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-sm font-bold">{session?.user?.name?.[0] || 'U'}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{session?.user?.role || 'Role'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Welcome Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Executive'}
            </h1>
            <p className="text-white/80 text-sm">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-all">
            <TrendingUp className="w-6 h-6 text-emerald-400 mb-3" />
            <p className="text-2xl font-bold">{formatKES(kpis.revenueMTD)}</p>
            <p className="text-xs text-slate-400">Revenue (MTD)</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition-all">
            <Users className="w-6 h-6 text-blue-400 mb-3" />
            <p className="text-2xl font-bold">{kpis.activeCustomers || 0}</p>
            <p className="text-xs text-slate-400">Active Customers</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500 transition-all">
            <DollarSign className="w-6 h-6 text-orange-400 mb-3" />
            <p className="text-2xl font-bold">{formatKES(kpis.outstandingReceivables)}</p>
            <p className="text-xs text-slate-400">Receivables</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500 transition-all">
            <Package className="w-6 h-6 text-purple-400 mb-3" />
            <p className="text-2xl font-bold">{kpis.inventoryItems || 0}</p>
            <p className="text-xs text-slate-400">Inventory Items</p>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-amber-400" />
              <div>
                <p className="font-bold">Subscription Status</p>
                <p className="text-sm text-slate-400">
                  {subscription?.subscribed 
                    ? `Active until ${new Date(subscription.expiresAt).toLocaleDateString()} (${subscription.daysRemaining} days remaining)`
                    : 'No active subscription'}
                </p>
              </div>
            </div>
            {subscription?.subscribed ? (
              <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">ACTIVE</span>
            ) : (
              <Link prefetch={true} href="/wavecore-erp/subscription" className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
                Subscribe Now
              </Link>
            )}
          </div>
        </div>

        {/* Modules Grid */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> ERP Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {modules.map(module => {
            const Icon = module.icon
            return (
              <Link key={module.title} href={module.href}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-sm">{module.title}</p>
                <p className="text-xs text-slate-400 mt-1">{module.desc}</p>
                <ChevronRight className="w-4 h-4 text-slate-600 mt-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}