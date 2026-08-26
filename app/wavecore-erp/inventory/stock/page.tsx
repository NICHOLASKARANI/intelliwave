'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Loader2, Search, AlertTriangle, CheckCircle } from 'lucide-react'

interface StockItem {
  id: string
  productName: string
  quantity: number
  warehouse: string
  status: string
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/wavecore/inventory/products')
      const data = await res.json()
      setItems(data.products || [])
    } catch (error) {
      console.error('Failed to fetch stock')
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(item => 
    (item.productName || item.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = items.filter(item => (item.quantity || 0) < 10)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Levels</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" /> Stock Levels ({items.length})
          </h1>
          {lowStock.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {lowStock.length} low stock
            </span>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search stock..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No stock items</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Product</th>
                  <th className="text-left p-4 text-sm">Quantity</th>
                  <th className="text-left p-4 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="p-4 font-medium">{item.productName || item.name || 'N/A'}</td>
                    <td className="p-4">{item.quantity || 0}</td>
                    <td className="p-4">
                      {(item.quantity || 0) < 10 ? (
                        <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}