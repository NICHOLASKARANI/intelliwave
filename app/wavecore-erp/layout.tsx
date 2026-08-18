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
  const [session, setSession] = useState<Session>({ authenticated: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/wavecore/auth/session')
        if (res.ok) {
          const data = await res.json()
          setSession(data)
        } else {
          setSession({ authenticated: false })
        }
      } catch {
        setSession({ authenticated: false })
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}