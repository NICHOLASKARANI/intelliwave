'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Download, Loader2 } from 'lucide-react'

export default function ProfitPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const revenue = data.sales?.reduce((s: number, x: any) => s + (parseFloat(x.total) || 0), 0) || 0
  const cost = data.products?.reduce((s: number, p: any) => s + (parseFloat(p.costPrice) || 0) * (p.stock_level || 0), 0) || 0
  const profit = revenue - cost

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Profit Report', '='.repeat(50), `Revenue: KSh ${revenue.toLocaleString()}`, `Cost: KSh ${cost.toLocaleString()}`, `Profit: KSh ${profit.toLocaleString()}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'profit.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Profit</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-green-500" /> Profit</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <p className="text-sm opacity-80">Net Profit</p>
              <p className="text-4xl font-extrabold">KSh {profit.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-xl font-bold">KSh {revenue.toLocaleString()}</p></div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><p className="text-sm text-muted-foreground">Cost</p><p className="text-xl font-bold">KSh {cost.toLocaleString()}</p></div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}