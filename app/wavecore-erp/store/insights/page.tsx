'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, AlertTriangle, ArrowLeft, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InsightsPage() {
  const [stats, setStats] = useState<any>({
    totalSales: 0, totalStockIn: 0, totalProducts: 0, lowStock: 0,
    totalRevenue: 0, totalProfit: 0, totalOrders: 0, totalCustomers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const [prodRes, stockRes] = await Promise.all([
          fetch('/api/wavecore/inventory/products'),
          fetch('/api/wavecore/inventory/summary'),
        ])
        const prodData = await prodRes.json()
        const stockData = await stockRes.json()
        setStats({
          totalProducts: prodData.products?.length || 0,
          totalStockValue: stockData.summary?.totalStockValue || 0,
          lowStock: stockData.summary?.lowStockItems || 0,
          totalSales: 0, totalStockIn: 0, totalRevenue: 0, totalProfit: 0, totalOrders: 0, totalCustomers: 0,
        })
      } catch {} finally { setLoading(false) }
    }
    fetchInsights()
  }, [])

  const formatKES = (amount: number) => 'KSh ' + (amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const insightCards = [
    { label: 'Total Revenue', value: formatKES(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-500', trend: '+0%' },
    { label: 'Total Sales', value: String(stats.totalSales), icon: ShoppingCart, color: 'text-blue-500', trend: '0' },
    { label: 'Stock In', value: String(stats.totalStockIn), icon: TrendingUp, color: 'text-orange-500', trend: '0' },
    { label: 'Stock Value', value: formatKES(stats.totalStockValue), icon: Package, color: 'text-purple-500', trend: '0' },
    { label: 'Products', value: String(stats.totalProducts), icon: Package, color: 'text-teal-500', trend: '0' },
    { label: 'Low Stock', value: String(stats.lowStock), icon: AlertTriangle, color: 'text-red-500', trend: '0' },
  ]

  const handleExport = () => {
    const csv = 'Metric,Value\n' + insightCards.map(c => `${c.label},${c.value}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'store-insights.csv'
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
          <span className="text-sm">Insights</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Store Insights</h1>
          <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="w-4 h-4" /> Export</Button>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {insightCards.map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                    <Icon className={`w-5 h-5 ${card.color} mb-3`} />
                    <p className="text-xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Profit Estimate */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
              <h3 className="font-bold mb-4">Profit Estimate</h3>
              <p className="text-3xl font-bold text-green-600">{formatKES(stats.totalProfit)}</p>
              <p className="text-xs text-muted-foreground mt-2">Estimated profit = (Selling Price - Cost Price) × Quantity Sold</p>
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4">Top Products</h3>
              <p className="text-sm text-muted-foreground text-center py-8">Sales data will appear here as you make sales</p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}