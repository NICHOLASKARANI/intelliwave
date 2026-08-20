'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Download } from 'lucide-react'

export default function ScrapPage() {
  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Scrap & Rework', '='.repeat(50), 'Scrap Rate: 2.5%', 'Rework Rate: 1.8%', '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'scrap.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Scrap</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-500" /> Scrap & Rework</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <p className="text-3xl font-bold text-red-500">2.5%</p>
            <p className="text-sm text-muted-foreground">Scrap Rate</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <p className="text-3xl font-bold text-amber-500">1.8%</p>
            <p className="text-sm text-muted-foreground">Rework Rate</p>
          </div>
        </div>
      </main>
    </div>
  )
}