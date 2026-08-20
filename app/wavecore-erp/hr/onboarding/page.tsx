'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { UserPlus, Download, CheckCircle } from 'lucide-react'

export default function OnboardingPage() {
  const [steps] = useState([
    { step: 1, name: 'Offer Letter Sent', status: 'COMPLETED' },
    { step: 2, name: 'Document Collection', status: 'COMPLETED' },
    { step: 3, name: 'Equipment Setup', status: 'IN PROGRESS' },
    { step: 4, name: 'System Access', status: 'PENDING' },
    { step: 5, name: 'First Day Orientation', status: 'PENDING' },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Onboarding', '='.repeat(50), `Steps: ${steps.length}`, '', ...steps.map(s => `Step ${s.step}: ${s.name} - ${s.status}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'onboarding.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Onboarding</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6 text-green-500" /> Onboarding</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="space-y-3">
          {steps.map(s => (
            <div key={s.step} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s.status === 'COMPLETED' ? 'bg-green-500 text-white' : s.status === 'IN PROGRESS' ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-500'
              }`}>{s.step}</div>
              <div className="flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.status}</p>
              </div>
              {s.status === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}