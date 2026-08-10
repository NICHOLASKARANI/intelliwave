import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Plus, Search, Filter, Factory,
  TrendingUp, Package, AlertTriangle, CheckCircle,
  ClipboardList, Wrench, Activity, ArrowRight,
  BarChart3, Layers, Cog, Timer, Gauge
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Manufacturing (MRP) - WaveCore ERP | IntelliWavve',
  description: 'Bill of Materials, Work Orders, Production Scheduling, Capacity Planning, Quality Control.',
}

const manufacturingKPIs = [
  { label: 'Active Work Orders', value: '0', icon: ClipboardList, color: 'text-blue-500', change: '0 in progress' },
  { label: 'Production Output', value: '0', icon: Factory, color: 'text-green-500', change: 'This month' },
  { label: 'Quality Pass Rate', value: '0%', icon: CheckCircle, color: 'text-emerald-500', change: '0 inspections' },
  { label: 'Efficiency Rate', value: '0%', icon: Gauge, color: 'text-purple-500', change: 'Overall' },
  { label: 'Bill of Materials', value: '0', icon: Layers, color: 'text-teal-500', change: 'Active BOMs' },
  { label: 'Work Centers', value: '0', icon: Cog, color: 'text-orange-500', change: 'Active' },
]

const quickActions = [
  { label: 'Create Work Order', href: '/wavecore-erp/manufacturing/orders/create', icon: Plus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'New BOM', href: '/wavecore-erp/manufacturing/bom/create', icon: Layers, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'Quality Check', href: '/wavecore-erp/manufacturing/quality/create', icon: CheckCircle, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Add Work Center', href: '/wavecore-erp/manufacturing/centers/create', icon: Cog, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Maintenance Request', href: '/wavecore-erp/manufacturing/maintenance/create', icon: Wrench, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'View Reports', href: '/wavecore-erp/manufacturing/reports', icon: BarChart3, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
]

export default function ManufacturingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm font-medium">Manufacturing</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">← Back to Dashboard</Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Manufacturing</p>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/wavecore-erp/manufacturing', active: true },
              { icon: Layers, label: 'Bill of Materials', href: '/wavecore-erp/manufacturing/bom' },
              { icon: Cog, label: 'Work Centers', href: '/wavecore-erp/manufacturing/centers' },
              { icon: ClipboardList, label: 'Work Orders', href: '/wavecore-erp/manufacturing/orders' },
              { icon: CheckCircle, label: 'Quality Control', href: '/wavecore-erp/manufacturing/quality' },
              { icon: Wrench, label: 'Maintenance', href: '/wavecore-erp/manufacturing/maintenance' },
              { icon: BarChart3, label: 'Reports', href: '/wavecore-erp/manufacturing/reports' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    (item as any).active ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm' : 'text-neutral-700 dark:text-neutral-300 hover:bg-muted'
                  }`}><Icon className="w-4 h-4" /> {item.label}</Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Manufacturing (MRP)</h1><p className="text-muted-foreground mt-1">Bill of Materials, Work Orders, Production, Quality Control</p></div>
            <Link href="/wavecore-erp/manufacturing/orders/create"><Button className="gap-2"><Plus className="w-4 h-4" /> Create Work Order</Button></Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {manufacturingKPIs.map((kpi) => { const Icon = kpi.icon; return (
              <div key={kpi.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                <Icon className={`w-5 h-5 ${kpi.color} mb-3`} />
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                <div className="text-[10px] text-neutral-400 mt-1">{kpi.change}</div>
              </div>
            )})}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map((action) => { const Icon = action.icon; return (
                <Link key={action.label} href={action.href} className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}><Icon className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              )})}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold">Active Work Orders</h2>
              <div className="flex gap-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" /></div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-12 text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No work orders yet</p>
              <p className="text-sm mt-1">Create your first work order to begin production.</p>
              <Link href="/wavecore-erp/manufacturing/orders/create" className="inline-block mt-4"><Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create Work Order</Button></Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}