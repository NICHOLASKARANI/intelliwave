'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Plus, Download, Loader2, ArrowDown, Search } from 'lucide-react'

export default function StockInPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Stock In Report',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Point of Sale',
      '='.repeat(50),
      '',
      ...filtered.map((p, i) => 
        'Item #' + (i + 1) + '\n  Product: ' + p.name + '\n  SKU: ' + (p.sku || '-') + '\n  Current Stock: ' + (p.stock_level || 0) + '\n' + '-'.repeat(30)
      ),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'stock-in.pdf'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock In</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowDown className="w-6 h-6 text-green-500" /> Stock In</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search products..." />
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500" /></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="p-3 text-left">Product</th><th className="p-3">SKU</th><th className="p-3 text-right">Current Stock</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-neutral-50">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.sku || '-'}</td>
                    <td className="p-3 text-right">{p.stock_level || 0}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No products</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}