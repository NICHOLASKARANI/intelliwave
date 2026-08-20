'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Monitor, Download, PlayCircle, PauseCircle, CheckCircle } from 'lucide-react'

export default function ShopFloorPage() {
  const [running, setRunning] = useState(false)

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Shop Floor Report', '='.repeat(50), 'Status: ' + (running ? 'RUNNING' : 'STOPPED'), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'shop-floor.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Shop Floor</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Monitor className="w-6 h-6 text-emerald-500" /> Shop Floor Control</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8 text-center">
          <button onClick={() => setRunning(!running)}
            className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl transition-all ${
              running ? 'bg-green-500 text-white animate-pulse' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
            }`}>
            {running ? <PauseCircle className="w-16 h-16" /> : <PlayCircle className="w-16 h-16" />}
          </button>
          <p className="text-xl font-bold">{running ? 'PRODUCTION RUNNING' : 'PRODUCTION STOPPED'}</p>
        </div>
      </main>
    </div>
  )
}