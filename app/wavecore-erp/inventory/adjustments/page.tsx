'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCw, Search, Plus, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdjustmentsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adjustments, setAdjustments] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/wavecore/inventory/products').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  const addAdjustment = (product: any) => {
    setAdjustments([...adjustments, { ...product, newQuantity: product.total_stock || 0 }])
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Adjustments</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><RefreshCw className="w-6 h-6 text-amber-500" /> Stock Adjustments</h1>
        <p className="text-sm text-muted-foreground mb-4">Click products to adjust their stock levels</p>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search products..." />
        </div>
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div> :
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(p => (
              <button key={p.id} onClick={() => addAdjustment(p)} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 text-left hover:border-amber-300 hover:shadow-md">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">Current Stock: {p.total_stock || 0}</p>
              </button>
            ))}
          </div>
        }
        {adjustments.length > 0 && (
          <div className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl border p-4">
            <h3 className="font-bold mb-3">Pending Adjustments ({adjustments.length})</h3>
            {adjustments.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b">
                <span className="flex-1">{a.name}</span>
                <input type="number" value={a.newQuantity} onChange={(e) => {
                  const n = [...adjustments]; const idx = n.findIndex(x => x.id === a.id); n[idx].newQuantity = parseInt(e.target.value) || 0; setAdjustments(n)
                }} className="w-24 px-2 py-1 rounded-lg border text-sm" />
              </div>
            ))}
            <Button className="mt-4 w-full bg-amber-600"><Package className="w-4 h-4 mr-1" /> Apply Adjustments</Button>
          </div>
        )}
      </main>
    </div>
  )
}