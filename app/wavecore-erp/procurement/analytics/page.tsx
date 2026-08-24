'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Download, Loader2, TrendingUp, DollarSign, Package, Users } from 'lucide-react'

export default function ProcurementAnalyticsPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [suppliersRes, ordersRes, quotesRes] = await Promise.all([
        fetch('/api/wavecore/suppliers'),
        fetch('/api/wavecore/purchase-orders'),
        fetch('/api/wavecore/quotes')
      ])
      const suppliers = await suppliersRes.json()
      const orders = await ordersRes.json()
      const quotes = await quotesRes.json()
      setData({ suppliers: suppliers.suppliers || [], orders: orders.orders || [], quotes: quotes.quotes || [] })
    } catch (error) {
      console.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const totalSpend = (data.orders || []).reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0)

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Procurement Analytics</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 3px solid #059669; padding-bottom: 10px; }
            .metric { margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .metric h3 { margin: 0; color: #059669; }
            .metric p { font-size: 24px; font-weight: bold; margin: 10px 0 0; }
            .header { display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Procurement Analytics</h1>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          <div class="metric"><h3>Total Suppliers</h3><p>${(data.suppliers || []).length}</p></div>
          <div class="metric"><h3>Purchase Orders</h3><p>${(data.orders || []).length}</p></div>
          <div class="metric"><h3>Total Spend</h3><p>KSh ${totalSpend.toLocaleString()}</p></div>
          <div class="metric"><h3>Quotes Received</h3><p>${(data.quotes || []).length}</p></div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Analytics</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-500" /> Procurement Analytics
          </h1>
          <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700">
            <Download className="w-4 h-4" /> PDF Report
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Users className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-3xl font-bold">{(data.suppliers || []).length}</p>
                <p className="text-sm text-muted-foreground mt-1">Suppliers</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <Package className="w-6 h-6 text-green-500 mb-3" />
                <p className="text-3xl font-bold">{(data.orders || []).length}</p>
                <p className="text-sm text-muted-foreground mt-1">Purchase Orders</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <DollarSign className="w-6 h-6 text-emerald-500 mb-3" />
                <p className="text-3xl font-bold">KSh {totalSpend.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Spend</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <TrendingUp className="w-6 h-6 text-purple-500 mb-3" />
                <p className="text-3xl font-bold">{(data.quotes || []).length}</p>
                <p className="text-sm text-muted-foreground mt-1">Quotes</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <h3 className="font-bold text-lg">Procurement Overview</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Track your procurement performance with real-time analytics.
                Monitor supplier relationships, purchase orders, and spending patterns.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}