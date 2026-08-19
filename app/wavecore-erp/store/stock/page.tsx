'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Download, Loader2, Search } from 'lucide-react'

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/store').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  const totalStock = filtered.reduce((s, p) => s + (p.stock_level || 0), 0)

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Stock', '='.repeat(50), `Total Stock: ${totalStock}`, '', ...filtered.map((p, i) => `${i+1}. ${p.name} - Qty: ${p.stock_level || 0}`), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'stock.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-orange-500" /> Stock ({totalStock})</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search stock..." />
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {filtered.map(p => (
              <div key={p.id} className="flex justify-between p-4 border-b">
                <span className="font-medium">{p.name}</span>
                <span className={`font-bold ${p.stock_level > 0 ? 'text-green-600' : 'text-red-500'}`}>{p.stock_level || 0}</span>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No stock</p>}
          </div>
        )}
      </main>
    </div>
  )
}