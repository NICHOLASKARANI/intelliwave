'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Download, Loader2, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react'

export default function InsightsPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Store Insights',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Point of Sale',
      '='.repeat(50),
      '',
      'Total Products: ' + (data.totalProducts || 0),
      'Total Sales: ' + (data.totalSales || 0),
      'Revenue: KSh ' + (data.sales?.reduce((sum: number, s: any) => sum + (s.total || 0), 0) || 0),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'insights.pdf'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalRevenue = data.sales?.reduce((sum: number, s: any) => sum + (parseFloat(s.total) || 0), 0) || 0

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Insights</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-violet-500" /> Store Insights</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>

        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Package className="w-6 h-6 text-orange-500 mb-3" />
              <p className="text-2xl font-bold">{data.totalProducts || 0}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <DollarSign className="w-6 h-6 text-green-500 mb-3" />
              <p className="text-2xl font-bold">KSh {totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <TrendingUp className="w-6 h-6 text-emerald-500 mb-3" />
              <p className="text-2xl font-bold">{data.totalSales || 0}</p>
              <p className="text-xs text-muted-foreground">Sales</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <TrendingDown className="w-6 h-6 text-red-500 mb-3" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Returns</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}