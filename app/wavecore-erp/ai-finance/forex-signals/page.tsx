'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Deprecated — the forex-signals page moved to /wavecore-erp/wavve-si
 * as part of phase SI-1. This redirect preserves old bookmarks.
 */
export default function ForexSignalsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/wavecore-erp/wavve-si') }, [router])
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <p className="text-slate-400 text-sm">Redirecting to Wavve SI…</p>
    </div>
  )
}