'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Factory, Layers, ClipboardList, CheckCircle, Cog, Wrench,
  TrendingUp, Package, AlertTriangle, Plus, Search, Download,
  Loader2, BarChart3, Gauge, Timer, Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ManufacturingPage() {
  const [stats, setStats] = useState({
    activeWorkOrders: 0, productionOutput: 0, qualityPassRate: 0,
    efficiencyRate: 0, boms: 0, workCenters: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const quickActions = [
    { label: 'Work Orders', href: '/wavecore-erp/manufacturing/orders', icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Bill of Materials', href: '/wavecore-erp/manufacturing/bom', icon: Layers, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Quality Control', href: '/wavecore-erp/manufacturing/quality', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Work Centers', href: '/wavecore-erp/manufacturing/centers', icon: Cog, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
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
        {/* Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Factory className="w-8 h-8" /> Manufacturing (MRP)
            </h1>
            <p className="text-white/80 text-sm lg:text-base">
              Bill of Materials • Work Orders • Production Scheduling • Quality Control • Maintenance
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <KPICard label="Active Work Orders" value={stats.activeWorkOrders} icon={ClipboardList} color="text-blue-500" />
              <KPICard label="Production Output" value={stats.productionOutput} icon={Factory} color="text-green-500" />
              <KPICard label="Quality Pass Rate" value={stats.qualityPassRate + '%'} icon={CheckCircle} color="text-emerald-500" />
              <KPICard label="Efficiency" value={stats.efficiencyRate + '%'} icon={Gauge} color="text-purple-500" />
              <KPICard label="BOMs" value={stats.boms} icon={Layers} color="text-teal-500" />
              <KPICard label="Work Centers" value={stats.workCenters} icon={Cog} color="text-orange-500" />
            </div>

            {/* Quick Actions */}
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

            {/* Production Overview */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Work Order Status */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h3 className="font-bold mb-4">Work Order Status</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Draft', count: 0, color: 'bg-gray-400' },
                    { label: 'Confirmed', count: 0, color: 'bg-blue-500' },
                    { label: 'In Progress', count: 0, color: 'bg-purple-500' },
                    { label: 'Completed', count: 0, color: 'bg-green-500' },
                    { label: 'Cancelled', count: 0, color: 'bg-red-500' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${s.color}`} />
                      <span className="flex-1 text-sm">{s.label}</span>
                      <span className="font-bold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production Metrics */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h3 className="font-bold mb-4">Production Metrics</h3>
                <div className="space-y-3">
                  {[
                    { label: 'On-Time Delivery', value: '0%', icon: Truck },
                    { label: 'Scrap Rate', value: '0%', icon: AlertTriangle },
                    { label: 'Machine Utilization', value: '0%', icon: Cog },
                    { label: 'Cycle Time', value: '0 min', icon: Timer },
                  ].map(m => {
                    const Icon = m.icon
                    return (
                      <div key={m.label} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <Icon className="w-5 h-5 text-purple-500" />
                        <span className="flex-1 text-sm">{m.label}</span>
                        <span className="font-bold">{m.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
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