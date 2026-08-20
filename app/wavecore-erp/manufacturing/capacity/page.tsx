'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Gauge, Download, TrendingUp } from 'lucide-react'

export default function CapacityPage() {
  const [capacity] = useState(75)

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Capacity Planning', '='.repeat(50), `Current Utilization: ${capacity}%`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'capacity.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Capacity</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gauge className="w-6 h-6 text-purple-500" /> Capacity Planning</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8">
          <div className="w-full h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 mb-4">
            <div className="h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${capacity}%` }} />
          </div>
          <p className="text-2xl font-bold text-center">{capacity}% Utilization</p>
          <p className="text-sm text-muted-foreground text-center mt-2">Optimal capacity range</p>
        </div>
      </main>
    </div>
  )
}