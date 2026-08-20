'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Download, Loader2, Package, Warehouse, ArrowRight, TrendingUp } from 'lucide-react'

export default function SummaryPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/inventory/summary')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Inventory Summary',
      '='.repeat(50),
      'Products: ' + (data.products || 0),
      'Warehouses: ' + (data.warehouses || 0),
      'Movements: ' + (data.movements || 0),
      'Stock Value: KSh ' + (data.stockValue || 0).toLocaleString(),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'summary.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Summary</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-violet-500" /> Inventory Summary</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><Package className="w-8 h-8 text-orange-500 mb-3" /><p className="text-3xl font-extrabold">{data.products || 0}</p><p className="text-xs text-muted-foreground">Products</p></div>
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><Warehouse className="w-8 h-8 text-blue-500 mb-3" /><p className="text-3xl font-extrabold">{data.warehouses || 0}</p><p className="text-xs text-muted-foreground">Warehouses</p></div>
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><ArrowRight className="w-8 h-8 text-green-500 mb-3" /><p className="text-3xl font-extrabold">{data.movements || 0}</p><p className="text-xs text-muted-foreground">Movements</p></div>
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900"><TrendingUp className="w-8 h-8 text-emerald-500 mb-3" /><p className="text-3xl font-extrabold">KSh {(data.stockValue || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Stock Value</p></div>
          </div>
        )}
      </main>
    </div>
  )
}