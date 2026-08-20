'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Download, Loader2, Clock } from 'lucide-react'

export default function SchedulingPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => { setTimeout(() => setLoading(false), 500) }, [])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Production Schedule', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', 'Production slots optimized', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'schedule.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Scheduling</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-blue-500" /> Production Scheduling</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 text-center">
            <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-xl font-bold">Production Schedule Ready</p>
            <p className="text-sm text-muted-foreground">Optimized for maximum efficiency</p>
          </div>
        )}
      </main>
    </div>
  )
}