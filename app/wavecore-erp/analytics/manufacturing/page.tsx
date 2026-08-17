'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AnalyticsSubPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/analytics').then(r => r.json()).then(d => setStats(d.kpis || {})).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Analytics</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-7 h-7" /> Analytics Module</h1>
        </div>
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><p className="text-xl font-bold">{stats.inventoryItems || 0}</p><p className="text-xs">Inventory Items</p></div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><p className="text-xl font-bold">{stats.employees || 0}</p><p className="text-xs">Employees</p></div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><p className="text-xl font-bold">{stats.projects || 0}</p><p className="text-xs">Projects</p></div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><p className="text-xl font-bold">{stats.tickets || 0}</p><p className="text-xs">Tickets</p></div>
          </div>
        )}
      </main>
    </div>
  )
}