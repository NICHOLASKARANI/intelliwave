'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, TrendingUp, DollarSign, Users, Loader2 } from 'lucide-react'

export default function StoreSalesPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(data => {
        setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })


  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Sales', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sales.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Store Sales</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-pink-500" /> Store Sales
        </h1>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <DollarSign className="w-6 h-6 text-green-500 mb-3" />
                <p className="text-xl font-bold">{stats.sales?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <TrendingUp className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-xl font-bold">{stats.products?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Users className="w-6 h-6 text-purple-500 mb-3" />
                <p className="text-xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Customers</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <ShoppingCart className="w-6 h-6 text-pink-500 mb-3" />
                <p className="text-xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Today's Sales</p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h2 className="font-bold mb-4">Recent Sales</h2>
              {stats.sales && stats.sales.length > 0 ? (
                <div className="space-y-3">
                  {stats.sales.map((sale: any) => (
                    <div key={sale.id} className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <div>
                        <p className="font-medium">{sale.customer_name || 'Customer'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="font-bold text-green-600">{formatKES(sale.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No sales yet</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}