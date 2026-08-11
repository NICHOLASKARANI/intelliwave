'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'

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
    trialEndsAt: string
    subscription: any
  }
  permissions?: string[]
}

const SessionContext = createContext<Session>({ authenticated: false })

export const useSession = () => useContext(SessionContext)

const PUBLIC_PATHS = ['/wavecore-erp/auth/login', '/wavecore-erp/auth/signup']

export default function WaveCoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<Session>({ authenticated: false })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/wavecore/auth/session')
        if (res.ok) {
          const data = await res.json()
          setSession(data)
          if (isPublicPath) {
            router.push('/wavecore-erp')
          }
        } else {
          setSession({ authenticated: false })
          if (!isPublicPath) {
            router.push('/wavecore-erp/auth/login')
          }
        }
      } catch {
        setSession({ authenticated: false })
        if (!isPublicPath) {
          router.push('/wavecore-erp/auth/login')
        }
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading WaveCore ERP...</p>
        </div>
      </div>
    )
  }

  if (!session.authenticated && !isPublicPath) {
    return null
  }

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}