'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Loader2, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Target, Printer, PieChart, Activity, Zap } from 'lucide-react'

interface Insights {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  totalInventoryValue: number
  lowStock: number
  topProducts: any[]
  salesTrend: any[]
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const [productsRes, salesRes] = await Promise.all([
        fetch('/api/wavecore/store'),
        fetch('/api/wavecore/store/sales')
      ])
      const productsData = await productsRes.json()
      const salesData = await salesRes.json()

      const products = productsData.products || []
      const sales = salesData.sales || []

      const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0)
      const totalInventoryValue = products.reduce((sum, p) => sum + Number(p.sellingPrice || 0) * Number(p.stock_level || 0), 0)
      const lowStock = products.filter(p => Number(p.stock_level || 0) < 10).length

      // Top products by stock value
      const topProducts = [...products]
        .sort((a, b) => Number(b.sellingPrice || 0) * Number(b.stock_level || 0) - Number(a.sellingPrice || 0) * Number(a.stock_level || 0))
        .slice(0, 5)

      setData({
        totalProducts: products.length,
        totalSales: sales.length,
        totalRevenue,
        totalInventoryValue,
        lowStock,
        topProducts,
        salesTrend: sales.slice(0, 10)
      })
    } catch (err) {
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const printReport = () => window.print()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Store Insights</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" /> Store Insights
          </h1>
          <button onClick={printReport}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-center">
                <Package className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.totalProducts}</p>
                <p className="text-xs opacity-80">Products</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white text-center">
                <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.totalSales}</p>
                <p className="text-xs opacity-80">Sales</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 text-white text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">KSh {data.totalRevenue.toLocaleString()}</p>
                <p className="text-xs opacity-80">Revenue</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">KSh {data.totalInventoryValue.toLocaleString()}</p>
                <p className="text-xs opacity-80">Inventory Value</p>
              </div>
              <div className={`p-5 rounded-2xl text-white text-center ${data.lowStock > 0 ? 'bg-gradient-to-br from-red-600 to-rose-600' : 'bg-gradient-to-br from-teal-600 to-cyan-600'}`}>
                <Zap className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.lowStock}</p>
                <p className="text-xs opacity-80">Low Stock</p>
              </div>
            </div>

            {/* Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" /> Top Products by Value
                </h2>
                <div className="space-y-3">
                  {data.topProducts.map((product, i) => {
                    const value = Number(product.sellingPrice || 0) * Number(product.stock_level || 0)
                    return (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          <span className="font-bold">{product.name}</span>
                        </div>
                        <span className="text-green-600 font-bold">KSh {value.toLocaleString()}</span>
                      </div>
                    )
                  })}
                  {data.topProducts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No products</p>
                  )}
                </div>
              </div>

              {/* Recent Sales */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" /> Recent Sales
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.salesTrend.map((sale, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <div>
                        <span className="font-mono text-sm">{sale.number}</span>
                        <span className="text-sm text-muted-foreground ml-2">{sale.customerName || 'Walk-in'}</span>
                      </div>
                      <span className="text-green-600 font-bold">KSh {Number(sale.total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {data.salesTrend.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No sales yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}