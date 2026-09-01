'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Loader2, TrendingUp, DollarSign, Package, ShoppingCart, Target, Printer, PieChart, Activity, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Insights {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  totalInventoryValue: number
  lowStock: number
  topProducts: any[]
  salesTrend: any[]
  products: any[]
  sales: any[]
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('overview')

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
        salesTrend: sales.slice(0, 10),
        products,
        sales
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
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : data && (
          <>
            {/* CLICKABLE KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <button onClick={() => setActiveView('products')}
                className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'products' ? 'ring-4 ring-blue-300' : ''}`}
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                <Package className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.totalProducts}</p>
                <p className="text-xs opacity-80">Products</p>
                <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
              </button>
              <button onClick={() => setActiveView('sales')}
                className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'sales' ? 'ring-4 ring-green-300' : ''}`}
                style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
                <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.totalSales}</p>
                <p className="text-xs opacity-80">Sales</p>
                <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
              </button>
              <button onClick={() => setActiveView('revenue')}
                className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'revenue' ? 'ring-4 ring-purple-300' : ''}`}
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">KSh {data.totalRevenue.toLocaleString()}</p>
                <p className="text-xs opacity-80">Revenue</p>
                <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
              </button>
              <button onClick={() => setActiveView('inventory')}
                className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'inventory' ? 'ring-4 ring-orange-300' : ''}`}
                style={{ background: 'linear-gradient(135deg, #ea580c, #d97706)' }}>
                <DollarSign className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">KSh {data.totalInventoryValue.toLocaleString()}</p>
                <p className="text-xs opacity-80">Inventory Value</p>
                <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
              </button>
              <button onClick={() => setActiveView('lowstock')}
                className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'lowstock' ? 'ring-4 ring-red-300' : ''}`}
                style={{ background: 'linear-gradient(135deg, #dc2626, #ea580c)' }}>
                <Zap className="w-6 h-6 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.lowStock}</p>
                <p className="text-xs opacity-80">Low Stock</p>
                <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
              </button>
            </div>

            {/* ACTIVE VIEW CONTENT */}
            {activeView === 'products' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">All Products ({data.products.length})</h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.products.map((p, i) => (
                    <div key={i} className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <span className="font-bold">{p.name}</span>
                      <span>Stock: {p.stock_level || 0} | KSh {Number(p.sellingPrice || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'sales' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">All Sales ({data.sales.length})</h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.sales.map((s, i) => (
                    <div key={i} className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <span className="font-mono">{s.number}</span>
                      <span className="text-green-600 font-bold">KSh {Number(s.total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeView === 'revenue' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 text-center">
                <h2 className="font-bold text-lg mb-4">Revenue Breakdown</h2>
                <p className="text-4xl font-bold text-green-600">KSh {data.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">Total from {data.totalSales} sales</p>
              </div>
            )}

            {activeView === 'inventory' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">Inventory Value</h2>
                <p className="text-4xl font-bold text-orange-600">KSh {data.totalInventoryValue.toLocaleString()}</p>
                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                  {data.topProducts.map((p, i) => {
                    const val = Number(p.sellingPrice || 0) * Number(p.stock_level || 0)
                    return (
                      <div key={i} className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                        <span className="font-bold">{p.name}</span>
                        <span>KSh {val.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeView === 'lowstock' && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">Low Stock Products ({data.lowStock})</h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {data.products.filter(p => Number(p.stock_level || 0) < 10).map((p, i) => (
                    <div key={i} className="flex justify-between p-3 rounded-xl bg-red-50">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-red-600 font-bold">Stock: {p.stock_level || 0}</span>
                    </div>
                  ))}
                  {data.products.filter(p => Number(p.stock_level || 0) < 10).length === 0 && (
                    <p className="text-center text-green-600 py-4">All products well stocked!</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}