'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DollarSign, Download, Loader2 } from 'lucide-react'

export default function StockValuePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.sellingPrice) || 0) * (p.stock_level || 0), 0)
  const totalCost = products.reduce((sum, p) => sum + (parseFloat(p.costPrice) || 0) * (p.stock_level || 0), 0)

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Stock Value',
      '='.repeat(50),
      'Total Products: ' + products.length,
      'Total Stock Value: KSh ' + totalValue.toLocaleString(),
      'Total Cost: KSh ' + totalCost.toLocaleString(),
      '',
      ...products.map((p, i) => `${i+1}. ${p.name} - Qty: ${p.stock_level || 0} - Value: KSh ${((parseFloat(p.sellingPrice)||0) * (p.stock_level||0)).toLocaleString()}`),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'stock-value.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Value</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-emerald-500" /> Stock Value</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                <p className="text-sm opacity-80">Total Stock Value</p>
                <p className="text-3xl font-extrabold">KSh {totalValue.toLocaleString()}</p>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <p className="text-sm opacity-80">Total Cost</p>
                <p className="text-3xl font-extrabold">KSh {totalCost.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">{products.length} products in stock</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}