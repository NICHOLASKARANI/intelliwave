'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Factory, ClipboardList, Boxes, KeyRound, Wrench, Route,
  CheckCircle, AlertTriangle, Download, Loader2, TrendingUp,
  BarChart3, Cog, Hammer, Layers, Settings
} from 'lucide-react'

export default function ManufacturingPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wavecore/manufacturing')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Manufacturing Dashboard',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise Manufacturing',
      '='.repeat(50),
      '',
      'Active Work Orders: ' + (data.workOrders || 0),
      'Production Output: ' + (data.output || 0),
      'Quality Pass Rate: ' + (data.qualityRate || '100%'),
      'Efficiency: ' + (data.efficiency || '100%'),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'manufacturing-dashboard.pdf'; a.click()
  }

  const modules = [
    { name: 'Work Orders', href: '/wavecore-erp/manufacturing/orders', icon: ClipboardList, color: 'from-indigo-500 to-blue-600', desc: 'Production orders' },
    { name: 'BOM', href: '/wavecore-erp/manufacturing/bom', icon: Layers, color: 'from-purple-500 to-violet-600', desc: 'Bill of Materials' },
    { name: 'Work Centers', href: '/wavecore-erp/manufacturing/centers', icon: Cog, color: 'from-amber-500 to-orange-600', desc: 'Production centers' },
    { name: 'Quality', href: '/wavecore-erp/manufacturing/quality', icon: CheckCircle, color: 'from-green-500 to-emerald-600', desc: 'Quality control' },
    { name: 'Maintenance', href: '/wavecore-erp/manufacturing/maintenance', icon: Wrench, color: 'from-red-500 to-rose-600', desc: 'Equipment maintenance' },
    { name: 'Routing', href: '/wavecore-erp/manufacturing/routing', icon: Route, color: 'from-teal-500 to-cyan-600', desc: 'Production routing' },
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
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Factory className="w-8 h-8" /> Manufacturing
              </h1>
              <p className="text-white/80 text-sm">Work Orders • BOM • Quality • Maintenance</p>
            </div>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <ClipboardList className="w-8 h-8 text-indigo-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.workOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Work Orders</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <BarChart3 className="w-8 h-8 text-purple-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.output || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Production Output</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.qualityRate || '100%'}</p>
                <p className="text-xs text-muted-foreground mt-1">Quality Pass Rate</p>
              </div>
              <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
                <TrendingUp className="w-8 h-8 text-emerald-500 mb-3" />
                <p className="text-3xl font-extrabold">{data.efficiency || '100%'}</p>
                <p className="text-xs text-muted-foreground mt-1">Efficiency</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Manufacturing Modules</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-purple-300 hover:shadow-2xl transition-all group">
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