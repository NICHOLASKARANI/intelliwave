'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SessionContext } from '@/lib/wavecore/context/session-context'
import { PosShopProvider } from '@/lib/wavecore/context/pos-shop-context'

interface Session {
  authenticated: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  organization?: {
    id: string
    name: string
  } | null
  subscribed?: boolean
  subscriptionStatus?: string | null
  subscriptionEndDate?: string | null
  daysLeft?: number | null
}

// Paths that remain accessible even when subscription is expired
const PAYWALL_EXEMPT_PREFIXES = [
  '/wavecore-erp/auth',
  '/wavecore-erp/subscription',
]

function isPaywallExempt(pathname: string): boolean {
  return PAYWALL_EXEMPT_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function WaveCoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const res = await fetch('/api/wavecore/auth/session', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (cancelled) return
          setSession({
            authenticated: !!data.authenticated,
            user: data.user,
            organization: data.organization,
            subscribed: data.subscribed,
            subscriptionStatus: data.subscriptionStatus,
            subscriptionEndDate: data.subscriptionEndDate,
            daysLeft: data.daysLeft,
          })
        } else {
          if (!cancelled) setSession({ authenticated: false })
        }
      } catch {
        if (!cancelled) setSession({ authenticated: false })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkSession()
    return () => { cancelled = true }
  }, [])

  // ─── Hard paywall redirect ───
  // If we know the user is authenticated but NOT subscribed, and the current
  // page is not a paywall-exempt path (subscription, auth), redirect to
  // /wavecore-erp/subscription so they can pay and resume.
  useEffect(() => {
    if (loading) return
    if (!session) return
    if (!session.authenticated) return
    if (session.subscribed === true) return
    if (isPaywallExempt(pathname || '')) return

    // Expired or no subscription → redirect to subscription page
    router.replace('/wavecore-erp/subscription')
  }, [loading, session, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <SessionContext.Provider value={session || { authenticated: false }}>
      <PosShopProvider>
        {children}
      </PosShopProvider>
    </SessionContext.Provider>
  )
}