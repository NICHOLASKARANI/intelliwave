'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Package, DollarSign, AlertTriangle, Boxes, Warehouse, Truck,
  Download, Loader2, TrendingUp, BarChart3, RefreshCw, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InventorySummaryPage() {
  const [summary, setSummary] = useState({
    totalProducts: 0, totalStockValue: 0, lowStockItems: 0,
    outOfStockItems: 0, warehouses: 0,
  })
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    try {
      const [summaryRes, movementsRes, productsRes] = await Promise.all([
        fetch('/api/wavecore/inventory/summary'),
        fetch('/api/wavecore/inventory/movements'),
        fetch('/api/wavecore/inventory/products'),
      ])
      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary || {})
        setRecentMovements(data.recentMovements || [])
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Summary error:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })
  const totalStockCount = products.reduce((s, p) => s + (p.total_stock || 0), 0)

  const handleExport = () => {
    const csv = 'Metric,Value\n' +
      `Total Products,${summary.totalProducts}\n` +
      `Total Stock,${totalStockCount}\n` +
      `Stock Value,${summary.totalStockValue}\n` +
      `Low Stock,${summary.lowStockItems}\n` +
      `Out of Stock,${summary.outOfStockItems}\n` +
      `Warehouses,${summary.warehouses}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'inventory-summary.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Inventory Summary</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-purple-500" /> Inventory Summary</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            <Button variant="outline" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <>
            {/* Premium Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-6 lg:p-8 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-white">
                <div>
                  <p className="text-white/70 text-xs mb-1">Total Products</p>
                  <p className="text-3xl font-bold">{summary.totalProducts}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs mb-1">Total Stock</p>
                  <p className="text-3xl font-bold">{totalStockCount}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs mb-1">Stock Value</p>
                  <p className="text-3xl font-bold">{formatKES(summary.totalStockValue)}</p>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Package className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-2xl font-bold">{summary.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Boxes className="w-6 h-6 text-teal-500 mb-3" />
                <p className="text-2xl font-bold">{totalStockCount}</p>
                <p className="text-xs text-muted-foreground">Total Stock</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <AlertTriangle className="w-6 h-6 text-amber-500 mb-3" />
                <p className="text-2xl font-bold text-amber-600">{summary.lowStockItems}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Warehouse className="w-6 h-6 text-purple-500 mb-3" />
                <p className="text-2xl font-bold">{summary.warehouses}</p>
                <p className="text-xs text-muted-foreground">Warehouses</p>
              </div>
            </div>

            {/* Recent Movements */}
            <h2 className="text-lg font-bold mb-4">Recent Movements</h2>
            {recentMovements.length > 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden mb-8">
                {recentMovements.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-4 border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="flex items-center gap-3">
                      <Truck className={`w-5 h-5 ${m.type === 'RECEIPT' ? 'text-green-500' : 'text-red-500'}`} />
                      <div>
                        <p className="font-medium">{m.product_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${m.type === 'RECEIPT' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.type === 'RECEIPT' ? '+' : '-'}{m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border mb-8">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No stock movements yet</p>
              </div>
            )}

            {/* Product Stock Overview */}
            <h2 className="text-lg font-bold mb-4">Product Stock Overview</h2>
            {products.length > 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                      <th className="text-left p-4">Product</th>
                      <th className="text-left p-4">SKU</th>
                      <th className="text-right p-4">Stock</th>
                      <th className="text-right p-4">Cost</th>
                      <th className="text-right p-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4 font-mono text-xs">{p.sku}</td>
                        <td className="p-4 text-right">{p.total_stock || 0}</td>
                        <td className="p-4 text-right">{formatKES(p.costPrice)}</td>
                        <td className="p-4 text-right font-medium text-emerald-600">{formatKES((p.costPrice || 0) * (p.total_stock || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No products yet</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}