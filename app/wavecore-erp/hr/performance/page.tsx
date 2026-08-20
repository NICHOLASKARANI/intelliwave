'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Download, TrendingUp, Award, Target } from 'lucide-react'

export default function PerformancePage() {
  const [reviews] = useState([
    { id: 1, employee: 'John Doe', rating: 4.5, goals: '5/7 achieved', status: 'COMPLETED' },
    { id: 2, employee: 'Jane Smith', rating: 4.8, goals: '6/6 achieved', status: 'COMPLETED' },
    { id: 3, employee: 'Bob Johnson', rating: 3.9, goals: '4/6 achieved', status: 'IN PROGRESS' },
  ])

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Performance Reviews', '='.repeat(50), `Reviews: ${reviews.length}`, '', ...reviews.map((r, i) => `${i+1}. ${r.employee} - Rating: ${r.rating} - ${r.goals}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'performance.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Performance</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" /> Performance Reviews</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {reviews.map(review => (
            <div key={review.id} className="flex justify-between p-5 border-b">
              <div>
                <p className="font-bold">{review.employee}</p>
                <p className="text-sm text-muted-foreground">{review.goals}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-500 flex items-center gap-1"><Star className="w-4 h-4 fill-amber-500" /> {review.rating}</p>
                <p className="text-xs">{review.status}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}