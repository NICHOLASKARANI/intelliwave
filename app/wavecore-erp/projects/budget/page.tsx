'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DollarSign, Download, TrendingUp, TrendingDown } from 'lucide-react'

export default function BudgetPage() {
  const [budget] = useState({ total: 5000000, spent: 2750000, remaining: 2250000 })

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Project Budget', '='.repeat(50), `Total: KSh ${budget.total.toLocaleString()}`, `Spent: KSh ${budget.spent.toLocaleString()}`, `Remaining: KSh ${budget.remaining.toLocaleString()}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'budget.pdf'; a.click()
  }

  const spentPercent = (budget.spent / budget.total) * 100

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Budget</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-emerald-500" /> Project Budget</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div className="w-full h-6 rounded-full bg-neutral-200 mb-4">
            <div className="h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${spentPercent}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold">KSh {budget.total.toLocaleString()}</p></div>
            <div><p className="text-sm text-muted-foreground">Spent</p><p className="text-xl font-bold text-amber-600">KSh {budget.spent.toLocaleString()}</p></div>
            <div><p className="text-sm text-muted-foreground">Remaining</p><p className="text-xl font-bold text-green-600">KSh {budget.remaining.toLocaleString()}</p></div>
          </div>
        </div>
      </main>
    </div>
  )
}