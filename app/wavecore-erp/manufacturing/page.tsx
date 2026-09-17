'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Factory, ClipboardList, Boxes, Wrench, Route,
  CheckCircle, AlertTriangle, Download, Loader2, TrendingUp,
  BarChart3, Cog, Layers, Calculator, Calendar, Monitor, Gauge,
  Activity, DollarSign, RefreshCw, PlayCircle,
} from 'lucide-react'

export default function ManufacturingPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = () => {
    setLoading(true)
    setError('')
    fetch('/api/wavecore/manufacturing')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchAll() }, [])

  const summary = data.summary || {}

  const handleDownloadPDF = () => {
    const lines = [
      'WaveCore ERP - Manufacturing Dashboard',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      '='.repeat(50),
      '',
      'WORK ORDERS',
      '  Total: ' + (summary.totalWorkOrders || 0),
      '  Open: ' + (summary.openWorkOrders || 0),
      '  Running: ' + (summary.runningWorkOrders || 0),
      '  Completed: ' + (summary.completedWorkOrders || 0),
      '  Overdue: ' + (summary.overdueWorkOrders || 0),
      '',
      'PRODUCTION',
      '  Output: ' + (summary.output || 0) + ' units',
      '  Efficiency: ' + (summary.efficiency || '100%'),
      '',
      'QUALITY',
      '  Checks: ' + (summary.qualityChecks || 0),
      '  Pass Rate: ' + (summary.qualityRate || '100%'),
      '',
      'BILL OF MATERIALS',
      '  Total BOMs: ' + (summary.boms || 0),
      '  Active: ' + (summary.activeBoms || 0),
      '',
      'WORK CENTERS',
      '  Total: ' + (summary.workCenters || 0),
      '  Avg Efficiency: ' + (summary.avgEfficiency || '100%'),
      '',
      'ROUTING',
      '  Total Routings: ' + (summary.routings || 0),
      '',
      'MAINTENANCE',
      '  Total: ' + (summary.maintenanceTotal || 0),
      '  Open: ' + (summary.openMaintenance || 0),
      '  Overdue: ' + (summary.overdueMaintenance || 0),
      '',
      'SCRAP',
      '  Records: ' + (summary.scrapRecords || 0),
      '  Total Qty: ' + (summary.totalScrapQty || 0),
      '  Total Value: ' + (summary.totalScrapValue || 0),
      '',
      'CAPACITY',
      '  Utilization: ' + (summary.utilization || '0%'),
      '',
      '='.repeat(50),
      '© 2026 IntelliWavve - All Rights Reserved',
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'manufacturing-dashboard.txt'; a.click()
  }

  const modules = [
    { name: 'Work Orders', href: '/wavecore-erp/manufacturing/work-orders', icon: ClipboardList, color: 'from-indigo-500 to-blue-600', desc: 'Production orders', stat: summary.totalWorkOrders || 0, sub: (summary.openWorkOrders || 0) + ' open' },
    { name: 'BOM', href: '/wavecore-erp/manufacturing/bom', icon: Layers, color: 'from-purple-500 to-violet-600', desc: 'Bill of Materials', stat: summary.boms || 0, sub: (summary.activeBoms || 0) + ' active' },
    { name: 'Work Centers', href: '/wavecore-erp/manufacturing/centers', icon: Cog, color: 'from-amber-500 to-orange-600', desc: 'Production centers', stat: summary.workCenters || 0, sub: (summary.avgEfficiency || '100%') + ' avg' },
    { name: 'Quality', href: '/wavecore-erp/manufacturing/quality', icon: CheckCircle, color: 'from-green-500 to-emerald-600', desc: 'Quality control', stat: summary.qualityChecks || 0, sub: (summary.qualityRate || '100%') + ' pass' },
    { name: 'Maintenance', href: '/wavecore-erp/manufacturing/maintenance', icon: Wrench, color: 'from-red-500 to-rose-600', desc: 'Equipment maintenance', stat: summary.openMaintenance || 0, sub: (summary.overdueMaintenance || 0) + ' overdue' },
    { name: 'Routing', href: '/wavecore-erp/manufacturing/routing', icon: Route, color: 'from-teal-500 to-cyan-600', desc: 'Production routing', stat: summary.routings || 0, sub: 'sequences' },
    { name: 'MRP', href: '/wavecore-erp/manufacturing/mrp', icon: Calculator, color: 'from-sky-500 to-blue-600', desc: 'Material planning', stat: 'Run', sub: 'analyze stock' },
    { name: 'Scheduling', href: '/wavecore-erp/manufacturing/scheduling', icon: Calendar, color: 'from-cyan-500 to-teal-600', desc: 'Production schedule', stat: summary.openWorkOrders || 0, sub: 'scheduled' },
    { name: 'Shop Floor', href: '/wavecore-erp/manufacturing/shop-floor', icon: Monitor, color: 'from-emerald-500 to-green-600', desc: 'Real-time control', stat: summary.runningWorkOrders || 0, sub: 'running' },
    { name: 'Capacity', href: '/wavecore-erp/manufacturing/capacity', icon: Gauge, color: 'from-violet-500 to-purple-600', desc: 'Capacity planning', stat: summary.utilization || '0%', sub: 'utilization' },
    { name: 'Scrap', href: '/wavecore-erp/manufacturing/scrap', icon: AlertTriangle, color: 'from-pink-500 to-rose-600', desc: 'Scrap & rework', stat: summary.scrapRecords || 0, sub: (summary.totalScrapValue || 0) + ' value' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Manufacturing</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-6 lg:p-8 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Factory className="w-8 h-8" /> Manufacturing
              </h1>
              <p className="text-white/80 text-sm">11 modules · Live production data · AI-powered insights</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : (
          <>
            {/* KPI CARDS — real data from all modules */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <ClipboardList className="w-7 h-7 text-indigo-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.totalWorkOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Work Orders</p>
                <p className="text-xs text-indigo-500 mt-1">{(summary.openWorkOrders || 0)} open · {summary.overdueWorkOrders || 0} overdue</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <BarChart3 className="w-7 h-7 text-purple-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.output || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Units Output</p>
                <p className="text-xs text-purple-500 mt-1">of {summary.totalQty || 0} total · {summary.efficiency || '100%'}</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <CheckCircle className="w-7 h-7 text-green-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.qualityRate || '100%'}</p>
                <p className="text-xs text-muted-foreground mt-1">Quality Pass Rate</p>
                <p className="text-xs text-green-500 mt-1">{summary.qualityChecks || 0} checks</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Gauge className="w-7 h-7 text-violet-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.utilization || '0%'}</p>
                <p className="text-xs text-muted-foreground mt-1">Capacity Used</p>
                <p className="text-xs text-violet-500 mt-1">{summary.workCenters || 0} centers</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Activity className="w-7 h-7 text-yellow-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.runningWorkOrders || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Running Now</p>
                <p className="text-xs text-yellow-500 mt-1">{summary.completedToday || 0} done today</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Wrench className="w-7 h-7 text-red-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.openMaintenance || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Open Maintenance</p>
                <p className="text-xs text-red-500 mt-1">{summary.overdueMaintenance || 0} overdue</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <Layers className="w-7 h-7 text-fuchsia-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.boms || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">BOMs</p>
                <p className="text-xs text-fuchsia-500 mt-1">{summary.activeBoms || 0} active · {summary.routings || 0} routings</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
                <AlertTriangle className="w-7 h-7 text-pink-500 mb-2" />
                <p className="text-3xl font-extrabold">{summary.totalScrapValue || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Scrap Value</p>
                <p className="text-xs text-pink-500 mt-1">{summary.scrapRecords || 0} records · {summary.totalScrapQty || 0} units</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Manufacturing Modules (11)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {modules.map(module => {
                const Icon = module.icon
                return (
                  <Link key={module.name} href={module.href}
                    className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-purple-300 hover:shadow-2xl transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm">{module.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{module.desc}</p>
                    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                      <span className="text-lg font-extrabold">{module.stat}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{module.sub}</span>
                    </div>
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