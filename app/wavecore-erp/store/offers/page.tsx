'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Search, Download, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'

export default function StorePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/inventory/products').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  const totalValue = products.reduce((s: number, p: any) => s + (p.costPrice || 0) * (p.total_stock || 0), 0)
  const profitEstimate = products.reduce((s: number, p: any) => s + ((p.sellingPrice || 0) - (p.costPrice || 0)) * (p.total_stock || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Store Overview</h1>
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <p className="text-2xl font-bold">KSh {totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Stock Value</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
                <p className="text-2xl font-bold text-green-600">KSh {profitEstimate.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Profit Estimate</p>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search..." />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.slice(0, 20).map(p => (
                <div key={p.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Stock: {p.total_stock || 0} | Price: KSh {p.sellingPrice}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}