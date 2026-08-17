'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Factory, Layers, ClipboardList, CheckCircle, Cog, Wrench,
  Plus, Loader2, Gauge, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ManufacturingPage() {
  const [stats, setStats] = useState({
    activeWorkOrders: 0, productionOutput: 0, qualityPassRate: 0,
    efficiencyRate: 0, boms: 0, workCenters: 0,
  })
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || {})
      }
    } catch (err) {
      console.error('Failed to load manufacturing:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  const quickActions = [
    { label: 'Work Orders', href: '/wavecore-erp/manufacturing/orders', icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'BOM', href: '/wavecore-erp/manufacturing/bom', icon: Layers, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Quality', href: '/wavecore-erp/manufacturing/quality', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Centers', href: '/wavecore-erp/manufacturing/centers', icon: Cog, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Maintenance', href: '/wavecore-erp/manufacturing/maintenance', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'Routing', href: '/wavecore-erp/manufacturing/routing', icon: Gauge, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Manufacturing</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-6 lg:p-8 mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><Factory className="w-8 h-8" /> Manufacturing (MRP)</h1>
          <p className="text-white/80 text-sm">Real-time production data</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <KPICard label="Active Work Orders" value={stats.activeWorkOrders} icon={ClipboardList} color="text-blue-500" />
              <KPICard label="Production Output" value={stats.productionOutput} icon={Factory} color="text-green-500" />
              <KPICard label="Quality Pass" value={stats.qualityPassRate + '%'} icon={CheckCircle} color="text-emerald-500" />
              <KPICard label="Efficiency" value={stats.efficiencyRate + '%'} icon={Gauge} color="text-purple-500" />
              <KPICard label="BOMs" value={stats.boms} icon={Layers} color="text-teal-500" />
              <KPICard label="Work Centers" value={stats.workCenters} icon={Cog} color="text-orange-500" />
            </div>

            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {quickActions.map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-purple-300 hover:shadow-lg transition-all text-center">
                    <div className={`w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${a.color}`} /></div>
                    <span className="text-xs font-medium">{a.label}</span>
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

function KPICard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}