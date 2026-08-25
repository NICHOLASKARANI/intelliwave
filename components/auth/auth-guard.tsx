'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/wavecore/auth/session')
        const data = await res.json()
        
        if (data.session) {
          setAuthenticated(true)
        } else {
          window.location.href = '/wavecore-erp/auth/login'
        }
      } catch (error) {
        window.location.href = '/wavecore-erp/auth/login'
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}