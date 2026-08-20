'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Download, TrendingUp } from 'lucide-react'

export default function CSATPage() {
  const [ratings] = useState([5, 5, 4, 5, 3, 5, 4, 5, 5, 4])
  const average = ratings.reduce((s, r) => s + r, 0) / ratings.length

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - CSAT Surveys', '='.repeat(50), `Average Rating: ${average.toFixed(1)}/5`, `Total Surveys: ${ratings.length}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'csat.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">CSAT</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" /> Customer Satisfaction</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-10 h-10 ${i <= Math.round(average) ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}`} />
            ))}
          </div>
          <p className="text-4xl font-extrabold">{average.toFixed(1)}/5</p>
          <p className="text-sm text-muted-foreground mt-2">Average Customer Rating</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
            <TrendingUp className="w-5 h-5" /> 92% Satisfaction Rate
          </div>
        </div>
      </main>
    </div>
  )
}