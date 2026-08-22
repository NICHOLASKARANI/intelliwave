'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DollarSign, Download, Loader2, TrendingUp, Calendar } from 'lucide-react'

export default function RevenuePage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/analytics')
      .then(r => r.json())
      .then(d => setStats(d.kpis || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Revenue Analytics', '='.repeat(50), `Revenue MTD: ${formatKES(stats.revenueMTD)}`, '', '(c) 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'revenue.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Revenue Analytics</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign className="w-7 h-7" /> Revenue Analytics</h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><DollarSign className="w-8 h-8 text-emerald-500 mb-3" /><p className="text-3xl font-extrabold">{formatKES(stats.revenueMTD)}</p><p className="text-xs">Revenue (Month to Date)</p></div>
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><TrendingUp className="w-8 h-8 text-green-500 mb-3" /><p className="text-3xl font-extrabold">+12%</p><p className="text-xs">Growth Rate</p></div>
          </div>
        )}
      </main>
    </div>
  )
}