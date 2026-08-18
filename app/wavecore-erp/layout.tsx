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
  }
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
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check session without redirecting
    fetch('/api/wavecore/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // IMPORTANT: Do NOT redirect here!
  // Let pages handle their own auth logic
  // This prevents infinite loops

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}