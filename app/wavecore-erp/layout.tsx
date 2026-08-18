'use client'

import { useEffect, useState, createContext, useContext } from 'react'

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
  }
  subscribed?: boolean
}

const SessionContext = createContext<Session>({ authenticated: false })

export const useSession = () => useContext(SessionContext)

export default function WaveCoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/wavecore/auth/session')
        if (res.ok) {
          const data = await res.json()
          setSession(data)
        } else {
          setSession(null)
        }
      } catch {
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Don't show loading spinner on every navigation - only first load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <SessionContext.Provider value={session || { authenticated: false }}>
      {children}
    </SessionContext.Provider>
  )
}