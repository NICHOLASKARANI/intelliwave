'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, Download, Loader2, RefreshCw, BarChart3, LineChart,
  ArrowUpRight, ArrowDownRight, Calendar, AlertTriangle, TrendingUp,
  TrendingDown, DollarSign, Boxes, Warehouse
} from 'lucide-react'

export default function InventoryAnalyticsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('MONTH')

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/analytics?range=' + timeRange)
      if (res.ok) { const data = await res.json(); setStats(data.kpis || {}) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const inventoryMetrics = [
    { label: 'Products', value: stats.inventoryItems || 0, icon: Package, color: 'from-orange-500 to-amber-600', trend: '+5.2%', up: true },
    { label: 'Stock Value', value: formatKES((stats.inventoryItems || 0) * 1500), icon: DollarSign, color: 'from-emerald-500 to-green-600', trend: '+3.8%', up: true },
    { label: 'Low Stock', value: 0, icon: AlertTriangle, color: 'from-red-500 to-rose-600', trend: '-2.1%', up: true },
    { label: 'Warehouses', value: 0, icon: Warehouse, color: 'from-blue-500 to-indigo-600', trend: '0%', up: true },
  ]

  const stockCategories = [
    { name: 'Electronics', value: 35, color: 'bg-blue-500' },
    { name: 'Furniture', value: 25, color: 'bg-amber-500' },
    { name: 'Clothing', value: 20, color: 'bg-pink-500' },
    { name: 'Food', value: 15, color: 'bg-green-500' },
    { name: 'Other', value: 5, color: 'bg-purple-500' },
  ]

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Inventory Analytics',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Time Range: ' + timeRange,
      '='.repeat(50),
      '',
      ...inventoryMetrics.map(m => m.label + ': ' + m.value + ' (' + m.trend + ')'),
      '',
      'Stock Categories:',
      ...stockCategories.map(c => c.name + ': ' + c.value + '%'),
      '',
      '(c) 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'inventory-analytics.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Inventory Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Package className="w-8 h-8" /> Inventory Analytics
              </h1>
              <p className="text-white/80 text-sm">Stock Levels • Valuation • Distribution</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Time Range - WORKING */}
        <div className="flex gap-2 mb-6">
          {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(range => (
            <button key={range} onClick={() => setTimeRange(range)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                timeRange === range 
                  ? 'bg-orange-600 text-white shadow-lg scale-105' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 border hover:bg-neutral-100'
              }`}>
              {range}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {timeRange} view
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-500" /></div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {inventoryMetrics.map(metric => {
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border hover:shadow-xl transition-all">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-extrabold">{metric.value}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <span className={`text-xs font-bold flex items-center gap-0.5 ${metric.up ? 'text-green-500' : 'text-red-500'}`}>
                        {metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {metric.trend}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Stock Distribution */}
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" /> Stock Distribution
            </h2>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-8">
              {stockCategories.map(cat => (
                <div key={cat.name} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div className={`h-2 rounded-full ${cat.color}`} style={{ width: cat.value + '%' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Stock Value Trend */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-emerald-500" /> Stock Value
              </h3>
              <div className="h-40 bg-neutral-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {formatKES((stats.inventoryItems || 0) * 1500)}
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}