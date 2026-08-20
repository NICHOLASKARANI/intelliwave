'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Timer, Download, PlayCircle, PauseCircle } from 'lucide-react'

export default function TimeTrackingPage() {
  const [tracking, setTracking] = useState(false)
  const [hours, setHours] = useState(0)

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Time Tracking', '='.repeat(50), `Hours Tracked: ${hours}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'time-tracking.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Time Tracking</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Timer className="w-6 h-6 text-green-500" /> Time Tracking</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8 text-center">
          <button onClick={() => setTracking(!tracking)}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl transition-all ${tracking ? 'bg-green-500 text-white animate-pulse' : 'bg-neutral-200 text-neutral-500'}`}>
            {tracking ? <PauseCircle className="w-12 h-12" /> : <PlayCircle className="w-12 h-12" />}
          </button>
          <p className="text-2xl font-bold">{tracking ? 'TRACKING...' : 'START TRACKING'}</p>
          <p className="text-sm text-muted-foreground mt-2">{hours} hours logged</p>
        </div>
      </main>
    </div>
  )
}