'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Users, Target, Loader2, Download, BarChart3, PieChart, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SalesAnalyticsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/analytics').then(r => r.json()).then(d => setStats(d.kpis || {})).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const formatKES = (a: number) => 'KSh ' + (a || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const salesMetrics = [
    { label: 'Total Customers', value: stats.activeCustomers || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Total Revenue', value: formatKES(stats.revenueMTD), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Total Invoices', value: stats.invoiceCount || 0, icon: BarChart3, color: 'text-purple-500' },
    { label: 'Conversion Rate', value: '0%', icon: Target, color: 'text-orange-500' },
  ]

  const pipelineStages = [
    { name: 'Qualification', count: 0, color: 'bg-blue-500' },
    { name: 'Proposal', count: 0, color: 'bg-purple-500' },
    { name: 'Negotiation', count: 0, color: 'bg-amber-500' },
    { name: 'Closed Won', count: 0, color: 'bg-green-500' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/analytics" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Sales Analytics</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-7 h-7" /> Sales Analytics</h1>
        </div>

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {salesMetrics.map(m => {
                const Icon = m.icon
                return (
                  <div key={m.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                    <Icon className={`w-6 h-6 ${m.color} mb-3`} />
                    <p className="text-xl font-bold">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                )
              })}
            </div>

            <h2 className="text-lg font-bold mb-4">Sales Pipeline</h2>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="grid grid-cols-4 gap-4">
                {pipelineStages.map(stage => (
                  <div key={stage.name} className="text-center">
                    <div className={`w-full h-2 rounded-full ${stage.color} mb-3`} />
                    <p className="text-sm font-medium">{stage.name}</p>
                    <p className="text-2xl font-bold mt-1">{stage.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}