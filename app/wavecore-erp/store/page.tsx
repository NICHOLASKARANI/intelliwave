'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Package, DollarSign, TrendingUp, ShoppingCart, Download, Loader2,
  Store, ArrowRight, AlertTriangle, BarChart3, Wallet
} from 'lucide-react'

export default function StorePage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const revenue = data.sales?.reduce((s: number, x: any) => s + (parseFloat(x.total) || 0), 0) || 0
  const lowStock = data.products?.filter((p: any) => (p.stock_level || 0) <= (p.minStock || 5)).length || 0

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Point of Sale Dashboard',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise POS',
      '='.repeat(50),
      '',
      'Total Products: ' + (data.totalProducts || 0),
      'Total Sales: ' + (data.totalSales || 0),
      'Revenue: KSh ' + revenue.toLocaleString(),
      'Low Stock Items: ' + lowStock,
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'store-dashboard.pdf'; a.click()
  }

  const modules = [
    { name: 'Products', href: '/wavecore-erp/store/products', icon: Package, color: 'from-orange-500 to-amber-600', desc: 'Manage products' },
    { name: 'Sales', href: '/wavecore-erp/store/sales/create', icon: ShoppingCart, color: 'from-blue-500 to-indigo-600', desc: 'Create sale' },
    { name: 'Stock In', href: '/wavecore-erp/store/stock-in', icon: ArrowRight, color: 'from-green-500 to-emerald-600', desc: 'Receive stock' },
    { name: 'Insights', href: '/wavecore-erp/store/insights', icon: BarChart3, color: 'from-violet-500 to-purple-600', desc: 'Analytics' },
    { name: 'Settlements', href: '/wavecore-erp/store/settlements', icon: Wallet, color: 'from-teal-500 to-cyan-600', desc: 'Payments' },
    { name: 'Categories', href: '/wavecore-erp/store/categories', icon: Store, color: 'from-pink-500 to-rose-600', desc: 'Categories' },
    { name: 'Stock Value', href: '/wavecore-erp/store/stock-value', icon: DollarSign, color: 'from-emerald-500 to-green-600', desc: 'Valuation' },
    { name: 'Profit', href: '/wavecore-erp/store/profit', icon: TrendingUp, color: 'from-lime-500 to-green-600', desc: 'Profit report' },
    { name: 'Transfer', href: '/wavecore-erp/store/transfer', icon: ArrowRight, color: 'from-sky-500 to-blue-600', desc: 'Transfer stock' },
    { name: 'Stock', href: '/wavecore-erp/store/stock', icon: Package, color: 'from-orange-500 to-red-600', desc: 'Stock levels' },
    { name: 'Restock', href: '/wavecore-erp/store/restock', icon: AlertTriangle, color: 'from-amber-500 to-orange-600', desc: 'Low stock' },
    { name: 'Offers', href: '/wavecore-erp/store/offers', icon: Store, color: 'from-purple-500 to-pink-600', desc: 'Promotions' },
    { name: 'Counts', href: '/wavecore-erp/store/counts', icon: Package, color: 'from-cyan-500 to-teal-600', desc: 'Stock counts' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Point of Sale</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-pink-500 to-rose-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Point of Sale</h1>
              <p className="text-white/80">Manage products, sales, stock, and profit</p>
            </div>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-500" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Package className="w-6 h-6 text-orange-500 mb-3" />
                <p className="text-2xl font-bold">{data.totalProducts || 0}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <ShoppingCart className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-2xl font-bold">{data.totalSales || 0}</p>
                <p className="text-xs text-muted-foreground">Sales</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <DollarSign className="w-6 h-6 text-green-500 mb-3" />
                <p className="text-2xl font-bold">KSh {revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <AlertTriangle className="w-6 h-6 text-amber-500 mb-3" />
                <p className="text-2xl font-bold">{lowStock}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>

            {/* Modules */}
            <h2 className="text-lg font-bold mb-4">Store Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-bold text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}