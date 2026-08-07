import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Plus, Search, Filter, Download,
  Package, TrendingUp, DollarSign, AlertTriangle,
  Warehouse, ArrowUpRight, ArrowRight, Truck,
  Barcode, QrCode, Layers, Boxes, Clipboard,
  ArrowLeftRight, RotateCcw, Trash2, ClipboardList,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Inventory & Warehouse - WaveCore ERP | IntelliWavve',
  description: 'Manage warehouses, stock levels, barcode, serial numbers, batch tracking, and stock movements.',
}

const inventoryKPIs = [
  { label: 'Total Products', value: '0', icon: Package, color: 'text-blue-500', change: '0 active' },
  { label: 'Inventory Value', value: 'KSh 0.00', icon: DollarSign, color: 'text-green-500', change: 'At cost' },
  { label: 'Stock Movements', value: '0', icon: Truck, color: 'text-purple-500', change: 'This month' },
  { label: 'Low Stock Items', value: '0', icon: AlertTriangle, color: 'text-red-500', change: 'Requires reorder' },
  { label: 'Warehouses', value: '0', icon: Warehouse, color: 'text-teal-500', change: 'Active' },
  { label: 'Pending Receipts', value: '0', icon: ArrowLeftRight, color: 'text-orange-500', change: 'Awaiting' },
]

const quickActions = [
  { label: 'Add Product', href: '/wavecore-erp/inventory/products/create', icon: Plus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'Receive Stock', href: '/wavecore-erp/inventory/moves/create?type=receipt', icon: Truck, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'Transfer Stock', href: '/wavecore-erp/inventory/moves/create?type=transfer', icon: ArrowLeftRight, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Stock Adjustment', href: '/wavecore-erp/inventory/moves/create?type=adjustment', icon: RotateCcw, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Add Warehouse', href: '/wavecore-erp/inventory/warehouses/create', icon: Warehouse, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'Cycle Count', href: '/wavecore-erp/inventory/counts/create', icon: ClipboardList, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
]

export default function InventoryPage() {
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
            <span className="text-sm font-medium">Inventory & Warehouse</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">← Back to Dashboard</Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Inventory</p>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/wavecore-erp/inventory', active: true },
              { icon: Package, label: 'Products', href: '/wavecore-erp/inventory/products' },
              { icon: Warehouse, label: 'Warehouses', href: '/wavecore-erp/inventory/warehouses' },
              { icon: Truck, label: 'Stock Movements', href: '/wavecore-erp/inventory/moves' },
              { icon: Barcode, label: 'Serial Numbers', href: '/wavecore-erp/inventory/serials' },
              { icon: Layers, label: 'Batches', href: '/wavecore-erp/inventory/batches' },
              { icon: ClipboardList, label: 'Cycle Counts', href: '/wavecore-erp/inventory/counts' },
              { icon: BarChart3, label: 'Reports', href: '/wavecore-erp/inventory/reports' },
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
            <div><h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Inventory & Warehouse</h1><p className="text-muted-foreground mt-1">Manage your stock, warehouses, and movements</p></div>
            <Link href="/wavecore-erp/inventory/products/create"><Button className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button></Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {inventoryKPIs.map((kpi) => { const Icon = kpi.icon; return (
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
              <h2 className="font-bold">Recent Stock Movements</h2>
              <div className="flex gap-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" /></div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-12 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No stock movements yet</p>
              <p className="text-sm mt-1">Start by receiving stock or creating a transfer.</p>
              <Link href="/wavecore-erp/inventory/moves/create" className="inline-block mt-4"><Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Movement</Button></Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}