'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, LogOut, Menu, X, Bell, ChevronDown, Building2, Shield, Zap } from 'lucide-react'

interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

interface SessionOrg {
  id: string
  name: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [org, setOrg] = useState<SessionOrg | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [subStatus, setSubStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/api/wavecore/auth/session', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('https://www.intelliwavve.com/wavecore-erp/auth/login')
          return
        }
        if (!data.subscribed && data.subscriptionStatus !== 'TRIAL') {
          router.push('https://www.intelliwavve.com/wavecore-erp/subscription')
          return
        }
        setUser(data.user)
        setOrg(data.organization)
        setSubscribed(data.subscribed)
        setSubStatus(data.subscriptionStatus)
        setLoading(false)
      })
      .catch(() => router.push('https://www.intelliwavve.com/wavecore-erp/auth/login'))
  }, [router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Verifying secure access...</p>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0a0e27]/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/wavve-si/dashboard" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-lg">Wavve SI</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {subscribed ? (
              <span className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/30">
                <Zap className="w-3 h-3" /> Active Subscription
              </span>
            ) : (
              <span className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/30">
                <Shield className="w-3 h-3" /> Trial
              </span>
            )}
            <button className="relative p-2 hover:bg-white/10 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-400 leading-tight">{org?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-[57px] left-0 z-30 w-64 h-[calc(100vh-57px)] bg-[#0a0e27] border-r border-white/10 overflow-y-auto transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-3 space-y-1">
            <Link href="/wavve-si/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/wavve-si/dashboard') && pathname === '/wavve-si/dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
              <Sparkles className="w-4 h-4" /> Dashboard
            </Link>

            <p className="px-3 pt-4 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Systems</p>
            <Link href="/wavve-si/dashboard/systems" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/wavve-si/dashboard/systems') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
              <Building2 className="w-4 h-4" /> All 100 Systems
            </Link>
            <Link href="/wavve-si/dashboard/billing" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/wavve-si/dashboard/billing') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
              <Zap className="w-4 h-4" /> Billing & Plan
            </Link>
            <Link href="/wavve-si/dashboard/settings" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive('/wavve-si/dashboard/settings') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
              <Shield className="w-4 h-4" /> Settings
            </Link>

            <p className="px-3 pt-4 pb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Account</p>
            <Link href="/wavve-si" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
              <ChevronDown className="w-4 h-4 rotate-90" /> Back to public site
            </Link>
            <button onClick={() => { window.location.href = '/api/wavecore/auth/logout' }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-57px)]">
          {children}
        </main>
      </div>
    </div>
  )
}