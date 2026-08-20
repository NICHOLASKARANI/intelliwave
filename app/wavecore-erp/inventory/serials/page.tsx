'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { KeyRound, Download, Loader2 } from 'lucide-react'

export default function SerialsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/inventory/products')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const trackable = products.filter((p: any) => p.trackSerial)

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Serial Numbers', '='.repeat(50), `Trackable: ${trackable.length}`, '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'serials.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Serials</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><KeyRound className="w-6 h-6 text-purple-500" /> Serial Numbers</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 text-center">
            <p className="text-2xl font-bold">{trackable.length}</p>
            <p className="text-sm text-muted-foreground">Products with serial tracking</p>
          </div>
        )}
      </main>
    </div>
  )
}