'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Search, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/inventory/products').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))

  const handleExport = () => {
    const csv = 'Product,SKU,Stock,Cost,Selling\n' + filtered.map(p => `${p.name},${p.sku},${p.total_stock},${p.costPrice},${p.sellingPrice}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'my-stock.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">My Stock</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">My Stock</h1>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search stock..." />
        </div>
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div> :
          filtered.length > 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th>
                  <th className="text-right p-4">Stock</th><th className="text-right p-4">Cost</th><th className="text-right p-4">Selling</th>
                </tr></thead>
                <tbody>{filtered.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-4 font-medium">{p.name}</td><td className="p-4">{p.sku}</td>
                    <td className="p-4 text-right">{p.total_stock || 0}</td>
                    <td className="p-4 text-right">{p.costPrice}</td><td className="p-4 text-right">{p.sellingPrice}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="text-center py-12 text-muted-foreground">No stock items</p>
        }
      </main>
    </div>
  )
}