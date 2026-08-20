'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Package, Warehouse, ArrowRight, Download, Loader2,
  AlertTriangle, TrendingUp, TrendingDown, BarChart3,
  Boxes, ArrowDown, ArrowUp, RefreshCw, Search,
  Scan, KeyRound, Sliders
} from 'lucide-react'

export default function InventoryPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/inventory/summary')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Inventory Management',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise Inventory',
      '='.repeat(50),
      '',
      'Products: ' + (data.products || 0),
      'Warehouses: ' + (data.warehouses || 0),
      'Movements: ' + (data.movements || 0),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'inventory-dashboard.pdf'; a.click()
  }

  const modules = [
    { name: 'Products', href: '/wavecore-erp/inventory/products', icon: Package, color: 'from-orange-500 to-amber-600', desc: 'Manage products' },
    { name: 'Warehouses', href: '/wavecore-erp/inventory/warehouses', icon: Warehouse, color: 'from-blue-500 to-indigo-600', desc: 'Storage locations' },
    { name: 'Movements', href: '/wavecore-erp/inventory/movements', icon: ArrowRight, color: 'from-green-500 to-emerald-600', desc: 'Stock movements' },
    { name: 'Summary', href: '/wavecore-erp/inventory/summary', icon: BarChart3, color: 'from-violet-500 to-purple-600', desc: 'Inventory analytics' },
    { name: 'Barcode', href: '/wavecore-erp/inventory/barcode', icon: Scan, color: 'from-purple-500 to-violet-600', desc: 'Scan products' },
    { name: 'Batches', href: '/wavecore-erp/inventory/batches', icon: Boxes, color: 'from-teal-500 to-cyan-600', desc: 'Batch tracking' },
    { name: 'Serials', href: '/wavecore-erp/inventory/serials', icon: KeyRound, color: 'from-indigo-500 to-blue-600', desc: 'Serial numbers' },
    { name: 'Adjustments', href: '/wavecore-erp/inventory/adjustments', icon: Sliders, color: 'from-amber-500 to-orange-600', desc: 'Stock adjustments' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Inventory</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Boxes className="w-8 h-8" /> Inventory Management
              </h1>
              <p className="text-white/80 text-sm">Products • Warehouses • Barcode • Batches • Serials</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Package className="w-8 h-8 text-orange-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.products || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Products</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Warehouse className="w-8 h-8 text-blue-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.warehouses || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Warehouses</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <ArrowRight className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.movements || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Movements</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Scan className="w-8 h-8 text-purple-500 mb-3" />
                <p className="text-3xl font-extrabold">8</p>
                <p className="text-xs text-muted-foreground mt-1">Modules</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Inventory Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-orange-300 hover:shadow-2xl transition-all group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-bold text-lg">{module.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{module.desc}</p>
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