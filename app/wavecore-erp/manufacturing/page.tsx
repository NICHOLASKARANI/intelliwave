'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Factory, Layers, ClipboardList, CheckCircle, Cog, Wrench,
  Plus, Loader2, Gauge, Package, TrendingUp, AlertTriangle, Timer, Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MfgStats {
  activeWorkOrders: number
  productionOutput: number
  qualityPassRate: number
  efficiencyRate: number
  boms: number
  workCenters: number
  maintenanceRequests: number
  totalRoutes: number
  qualityChecks: number
}

export default function ManufacturingPage() {
  const [stats, setStats] = useState<MfgStats>({
    activeWorkOrders: 0, productionOutput: 0, qualityPassRate: 0,
    efficiencyRate: 0, boms: 0, workCenters: 0, maintenanceRequests: 0, totalRoutes: 0, qualityChecks: 0,
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
      console.error('Failed:', err)
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
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><Factory className="w-8 h-8" /> Manufacturing (MRP)</h1>
              <p className="text-white/80 text-sm">Real-time production intelligence</p>
            </div>
            <div className="hidden lg:block text-white/80 text-right">
              <p className="text-3xl font-bold text-white">{stats.activeWorkOrders}</p>
              <p className="text-xs">Active Orders</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Active Work Orders" value={stats.activeWorkOrders} icon={ClipboardList} color="text-blue-500" />
              <StatCard label="Production Output" value={stats.productionOutput} icon={Factory} color="text-green-500" />
              <StatCard label="Quality Pass Rate" value={stats.qualityPassRate + '%'} icon={CheckCircle} color="text-emerald-500" />
              <StatCard label="Efficiency" value={stats.efficiencyRate + '%'} icon={Gauge} color="text-purple-500" />
              <StatCard label="BOMs" value={stats.boms} icon={Layers} color="text-teal-500" />
              <StatCard label="Work Centers" value={stats.workCenters} icon={Cog} color="text-orange-500" />
              <StatCard label="Maintenance" value={stats.maintenanceRequests} icon={Wrench} color="text-red-500" />
              <StatCard label="Quality Checks" value={stats.qualityChecks} icon={CheckCircle} color="text-cyan-500" />
            </div>

            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {quickActions.map(a => {
                const Icon = a.icon
                return (
                  <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-purple-300 hover:shadow-lg transition-all text-center group">
                    <div className={`w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${a.color}`} />
                    </div>
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

function StatCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all cursor-default">
      <Icon className={`w-6 h-6 ${color} mb-3`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}