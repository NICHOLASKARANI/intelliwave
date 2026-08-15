'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Download, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProfitEstimatePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/wavecore/inventory/products').then(r => r.json()).then(d => setProducts(d.products || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const enriched = products.map(p => ({
    ...p,
    unitProfit: (p.sellingPrice || 0) - (p.costPrice || 0),
    margin: (p.costPrice || 0) > 0 ? (((p.sellingPrice || 0) - (p.costPrice || 0)) / (p.sellingPrice || 1)) * 100 : 0,
    totalProfit: ((p.sellingPrice || 0) - (p.costPrice || 0)) * (p.total_stock || 0),
  }))

  const filtered = enriched.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  const totalProfit = enriched.reduce((s, p) => s + p.totalProfit, 0)
  const totalCost = enriched.reduce((s, p) => s + (p.costPrice||0)*(p.total_stock||0), 0)
  const totalRevenue = enriched.reduce((s, p) => s + (p.sellingPrice||0)*(p.total_stock||0), 0)
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleExport = () => {
    const csv = 'Product,Cost,Selling,Unit Profit,Margin %,Stock,Total Profit\n' +
      filtered.map(p => `${p.name},${p.costPrice},${p.sellingPrice},${p.unitProfit},${p.margin.toFixed(1)},${p.total_stock},${p.totalProfit}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'profit-estimate.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Profit Estimate</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Profit Estimate</h1>
          <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-6 mb-6 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-white/70 text-xs">Revenue</p><p className="text-xl font-bold">{formatKES(totalRevenue)}</p></div>
            <div><p className="text-white/70 text-xs">Cost</p><p className="text-xl font-bold">{formatKES(totalCost)}</p></div>
            <div><p className="text-white/70 text-xs">Profit</p><p className="text-2xl font-bold">{formatKES(totalProfit)}</p></div>
            <div><p className="text-white/70 text-xs">Avg Margin</p><p className="text-2xl font-bold">{avgMargin.toFixed(1)}%</p></div>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search..." />
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div> :
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="text-left p-4">Product</th><th className="text-right p-4">Cost</th>
                <th className="text-right p-4">Selling</th><th className="text-right p-4">Unit Profit</th>
                <th className="text-center p-4">Margin</th><th className="text-right p-4">Stock</th>
                <th className="text-right p-4">Total Profit</th>
              </tr></thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-right">{formatKES(p.costPrice)}</td>
                  <td className="p-4 text-right">{formatKES(p.sellingPrice)}</td>
                  <td className={`p-4 text-right ${p.unitProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatKES(p.unitProfit)}</td>
                  <td className="p-4 text-center"><span className={`px-2 py-1 text-xs rounded-full ${p.margin >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.margin.toFixed(1)}%</span></td>
                  <td className="p-4 text-right">{p.total_stock || 0}</td>
                  <td className={`p-4 text-right font-bold ${p.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatKES(p.totalProfit)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        }
      </main>
    </div>
  )
}