'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, LayoutDashboard, Users, DollarSign, Package, Factory, TrendingUp } from 'lucide-react'

export default function WaveCoreERPPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const res = await fetch('/api/wavecore/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data.authenticated) {
          setSession(data)
        } else {
          // Not authenticated - show login link instead of redirect
          setSession(null)
        }
      }
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  // If not authenticated, show welcome/landing with login option
  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={80} height={80} className="rounded-xl mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">WaveCore ERP</h1>
          <p className="text-muted-foreground mb-8">
            Complete business management suite for Kenyan businesses
          </p>
          <div className="space-y-3">
            <Link href="/wavecore-erp/auth/login" className="block w-full py-3 rounded-xl bg-blue-600 text-white text-center font-medium hover:bg-blue-700">
              Sign In
            </Link>
            <Link href="/wavecore-erp/auth/signup" className="block w-full py-3 rounded-xl border text-center font-medium hover:bg-neutral-100">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated - show dashboard
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.user?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Welcome back, {session.user?.name}!</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Dashboard', href: '/wavecore-erp', icon: LayoutDashboard, color: 'text-blue-500' },
            { label: 'CRM', href: '/wavecore-erp/crm', icon: Users, color: 'text-green-500' },
            { label: 'Finance', href: '/wavecore-erp/finance', icon: DollarSign, color: 'text-emerald-500' },
            { label: 'Inventory', href: '/wavecore-erp/inventory', icon: Package, color: 'text-orange-500' },
            { label: 'Manufacturing', href: '/wavecore-erp/manufacturing', icon: Factory, color: 'text-purple-500' },
            { label: 'Analytics', href: '/wavecore-erp/analytics', icon: TrendingUp, color: 'text-red-500' },
          ].map(module => {
            const Icon = module.icon
            return (
              <Link key={module.label} href={module.href}
                className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all text-center">
                <Icon className={`w-8 h-8 ${module.color} mx-auto mb-3`} />
                <p className="text-sm font-medium">{module.label}</p>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}