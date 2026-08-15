'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DollarSign, Package, Download, Search, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StockValuePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/inventory/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
  const totalStockValue = products.reduce((s, p) => s + (p.costPrice || 0) * (p.total_stock || 0), 0)
  const totalRetailValue = products.reduce((s, p) => s + (p.sellingPrice || 0) * (p.total_stock || 0), 0)
  const profitPotential = totalRetailValue - totalStockValue

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleExport = () => {
    const csv = 'Product,SKU,Stock,Cost,Stock Value,Selling,Retail Value\n' +
      filtered.map(p => `${p.name},${p.sku},${p.total_stock},${p.costPrice},${(p.costPrice||0)*(p.total_stock||0)},${p.sellingPrice},${(p.sellingPrice||0)*(p.total_stock||0)}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'stock-value.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Stock Value</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Stock Value</h1>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><Package className="w-5 h-5 text-blue-500 mb-2" /><p className="text-xl font-bold">{products.length}</p><p className="text-xs">Products</p></div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><DollarSign className="w-5 h-5 text-emerald-500 mb-2" /><p className="text-xl font-bold text-emerald-600">{formatKES(totalStockValue)}</p><p className="text-xs">Stock Value (Cost)</p></div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><DollarSign className="w-5 h-5 text-green-500 mb-2" /><p className="text-xl font-bold text-green-600">{formatKES(totalRetailValue)}</p><p className="text-xs">Retail Value</p></div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900"><DollarSign className="w-5 h-5 text-purple-500 mb-2" /><p className="text-xl font-bold text-purple-600">{formatKES(profitPotential)}</p><p className="text-xs">Profit Potential</p></div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search..." />
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div> :
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="text-left p-4">Product</th><th className="text-left p-4">SKU</th>
                <th className="text-right p-4">Stock</th><th className="text-right p-4">Cost</th>
                <th className="text-right p-4">Stock Value</th><th className="text-right p-4">Selling</th>
                <th className="text-right p-4">Retail Value</th>
              </tr></thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="p-4 font-medium">{p.name}</td><td className="p-4">{p.sku}</td>
                  <td className="p-4 text-right">{p.total_stock || 0}</td>
                  <td className="p-4 text-right">{formatKES(p.costPrice)}</td>
                  <td className="p-4 text-right text-emerald-600">{formatKES((p.costPrice||0)*(p.total_stock||0))}</td>
                  <td className="p-4 text-right">{formatKES(p.sellingPrice)}</td>
                  <td className="p-4 text-right text-green-600">{formatKES((p.sellingPrice||0)*(p.total_stock||0))}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        }
      </main>
    </div>
  )
}