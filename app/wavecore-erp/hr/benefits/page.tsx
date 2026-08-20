'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Download } from 'lucide-react'

export default function BenefitsPage() {
  const [benefits] = useState([
    { name: 'Health Insurance', provider: 'AAR Insurance', employees: 105 },
    { name: 'Pension Scheme', provider: 'NSSF', employees: 105 },
    { name: 'Gym Membership', provider: 'Various', employees: 45 },
    { name: 'Professional Development', provider: 'Internal', employees: 80 },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Benefits', '='.repeat(50), `Programs: ${benefits.length}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'benefits.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Benefits</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="w-6 h-6 text-pink-500" /> Benefits Administration</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {benefits.map(b => (
            <div key={b.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Heart className="w-6 h-6 text-pink-500 mb-3" />
              <p className="font-bold">{b.name}</p>
              <p className="text-sm text-muted-foreground">{b.provider}</p>
              <p className="text-xs mt-1">{b.employees} employees enrolled</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}