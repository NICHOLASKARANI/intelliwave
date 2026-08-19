'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Download, Loader2 } from 'lucide-react'

export default function RestockPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/store').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const lowStock = products.filter(p => (p.stock_level || 0) <= (p.minStock || 5))

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Restock', '='.repeat(50), `Low Stock Items: ${lowStock.length}`, '', ...lowStock.map((p, i) => `${i+1}. ${p.name} - Stock: ${p.stock_level || 0} - Min: ${p.minStock || 5}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'restock.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Restock</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-500" /> Restock ({lowStock.length})</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {lowStock.map(p => (
              <div key={p.id} className="flex justify-between p-4 border-b bg-amber-50/50 dark:bg-amber-950/20">
                <span className="font-medium">{p.name}</span>
                <span className="text-amber-600 font-bold">Stock: {p.stock_level || 0} / Min: {p.minStock || 5}</span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-center py-8 text-green-600 font-medium">All products well stocked ✓</p>}
          </div>
        )}
      </main>
    </div>
  )
}