'use client'
import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login'
  }, [])
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <p className="text-slate-400">Redirecting to login...</p>
    </div>
  )
}