'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Receipt, Download, TrendingDown } from 'lucide-react'

export default function ExpensesPage() {
  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Expenses', '='.repeat(50), 'Total Expenses: KSh 0', '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'expenses.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Expenses</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Receipt className="w-7 h-7" /> Expense Management</h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8 text-center">
          <TrendingDown className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-2xl font-bold">KSh 0</p>
          <p className="text-sm text-muted-foreground">Total Expenses</p>
        </div>
      </main>
    </div>
  )
}