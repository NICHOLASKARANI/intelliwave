'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Download, FileText, TrendingUp, PieChart, LineChart } from 'lucide-react'

export default function ReportsPage() {
  const reports = [
    { name: 'Financial Reports', icon: FileText, desc: 'Balance Sheet, Income Statement' },
    { name: 'Sales Reports', icon: TrendingUp, desc: 'Revenue, Pipeline, Forecast' },
    { name: 'Inventory Reports', icon: BarChart3, desc: 'Stock levels, Valuation' },
    { name: 'HR Reports', icon: PieChart, desc: 'Payroll, Attendance' },
    { name: 'Manufacturing Reports', icon: LineChart, desc: 'Production, Quality' },
  ]

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Reports Center', '='.repeat(50), `${reports.length} Report Categories`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'reports.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Reports</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-7 h-7" /> Reports Center</h1>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => {
            const Icon = r.icon
            return (
              <div key={r.name} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Icon className="w-8 h-8 text-indigo-500 mb-3" />
                <p className="font-bold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}