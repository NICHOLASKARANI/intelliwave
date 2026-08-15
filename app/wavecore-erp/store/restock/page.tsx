'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Package, Download, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LowStockProduct {
  id: string
  name: string
  sku: string
  category: string
  total_stock: number
  minStock: number
  maxStock: number
  costPrice: number
  sellingPrice: number
}

export default function RestockPage() {
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchLowStock() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/inventory/products')
      if (res.ok) {
        const data = await res.json()
        const products = data.products || []
        setLowStockItems(products.filter((p: any) => (p.total_stock || 0) <= (p.minStock || 0)))
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchLowStock() }, [])

  const formatKES = (amount: number) => 'KSh ' + (amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleExport = () => {
    const csv = 'Product,SKU,Category,Current Stock,Min Stock,Reorder Quantity\n' +
      lowStockItems.map(p => `${p.name},${p.sku},${p.category},${p.total_stock},${p.minStock},${Math.max(p.minStock * 2 - p.total_stock, 1)}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'restock-list.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Restock Alerts</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-500" /> Restock Alerts</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLowStock}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            {lowStockItems.length > 0 && <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div>
        ) : lowStockItems.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-amber-50 dark:bg-amber-950">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">SKU</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-center p-4">Current Stock</th>
                  <th className="text-center p-4">Min Stock</th>
                  <th className="text-center p-4">Reorder Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-amber-50/50 dark:hover:bg-amber-950/30">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4 font-mono text-xs">{item.sku}</td>
                    <td className="p-4">{item.category || '-'}</td>
                    <td className="p-4 text-center">
                      <span className="text-red-600 font-bold">{item.total_stock || 0}</span>
                    </td>
                    <td className="p-4 text-center">{item.minStock}</td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        {Math.max((item.minStock || 0) * 2 - (item.total_stock || 0), 1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-lg">No restock alerts</p>
            <p className="text-sm text-muted-foreground mt-1">All products are sufficiently stocked</p>
          </div>
        )}
      </main>
    </div>
  )
}