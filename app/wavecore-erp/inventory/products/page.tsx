'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Plus, Search, Download, Loader2, Edit3, Trash2 } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/inventory/products')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Inventory Products',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Total Products: ' + filtered.length,
      '='.repeat(50),
      '',
      ...filtered.map((p, i) => `${i+1}. ${p.name} (SKU: ${p.sku || '-'}) - Selling: KSh ${p.sellingPrice || 0} - Stock: ${p.stock_level || 0}`),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'products.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Products</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-orange-500" /> Products ({filtered.length})</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"><Download className="w-4 h-4" /> PDF</button>
            <Link href="/wavecore-erp/inventory/products/create" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium"><Plus className="w-4 h-4" /> Add</Link>
          </div>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search products..." />
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="p-3 text-left">Product</th><th className="p-3">SKU</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th>
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-neutral-50">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.sku || '-'}</td>
                    <td className="p-3 text-right">KSh {p.sellingPrice || 0}</td>
                    <td className={`p-3 text-right font-bold ${p.stock_level > 0 ? 'text-green-600' : 'text-red-500'}`}>{p.stock_level || 0}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No products found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}