import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, Target, FileText, ShoppingCart,
  TrendingUp, DollarSign, Activity, Plus, Search, Filter,
  Download, Phone, Mail, Calendar, ArrowUpRight, ArrowRight,
  BarChart3, Star, Clock, CheckCircle, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'CRM & Sales - WaveCore ERP | IntelliWavve',
  description: 'Manage leads, opportunities, customers, quotations, and sales orders.',
}

const crmKPIs = [
  { label: 'Total Leads', value: '0', icon: Users, color: 'text-blue-500', trend: 'up', change: '+0%' },
  { label: 'Open Opportunities', value: '0', icon: Target, color: 'text-purple-500', trend: 'up', change: 'KSh 0' },
  { label: 'Pipeline Value', value: 'KSh 0.00', icon: TrendingUp, color: 'text-green-500', trend: 'up', change: '+0%' },
  { label: 'Conversion Rate', value: '0%', icon: BarChart3, color: 'text-indigo-500', trend: 'neutral', change: '0 deals' },
  { label: 'Active Customers', value: '0', icon: Users, color: 'text-teal-500', trend: 'up', change: '+0' },
  { label: 'Quotations Sent', value: '0', icon: FileText, color: 'text-orange-500', trend: 'neutral', change: 'This month' },
  { label: 'Sales Orders', value: '0', icon: ShoppingCart, color: 'text-rose-500', trend: 'up', change: 'This month' },
  { label: 'Revenue (MTD)', value: 'KSh 0.00', icon: DollarSign, color: 'text-emerald-500', trend: 'up', change: '+0%' },
]

const quickActions = [
  { label: 'Add Lead', href: '/wavecore-erp/crm/leads/create', icon: Plus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'Add Customer', href: '/wavecore-erp/crm/customers/create', icon: Users, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'Create Quotation', href: '/wavecore-erp/crm/quotations/create', icon: FileText, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'New Opportunity', href: '/wavecore-erp/crm/opportunities/create', icon: Target, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Sales Order', href: '/wavecore-erp/crm/orders/create', icon: ShoppingCart, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'Record Activity', href: '/wavecore-erp/crm/activities/create', icon: Activity, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
]

const pipelineStages = [
  { name: 'Qualification', count: 0, color: 'bg-blue-500' },
  { name: 'Needs Analysis', count: 0, color: 'bg-purple-500' },
  { name: 'Proposal', count: 0, color: 'bg-orange-500' },
  { name: 'Negotiation', count: 0, color: 'bg-yellow-500' },
  { name: 'Closed Won', count: 0, color: 'bg-green-500' },
]

export default function CRMPage() {
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
            <span className="text-sm font-medium">CRM & Sales</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">← Back to Dashboard</Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">CRM & Sales</p>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/wavecore-erp/crm', active: true },
              { icon: Users, label: 'Leads', href: '/wavecore-erp/crm/leads' },
              { icon: Target, label: 'Opportunities', href: '/wavecore-erp/crm/opportunities' },
              { icon: Users, label: 'Customers', href: '/wavecore-erp/crm/customers' },
              { icon: FileText, label: 'Quotations', href: '/wavecore-erp/crm/quotations' },
              { icon: ShoppingCart, label: 'Sales Orders', href: '/wavecore-erp/crm/orders' },
              { icon: Activity, label: 'Activities', href: '/wavecore-erp/crm/activities' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    (item as any).active 
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm' 
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-muted'
                  }`}>
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">CRM & Sales</h1>
              <p className="text-muted-foreground mt-1">Manage your sales pipeline and customer relationships</p>
            </div>
            <Link href="/wavecore-erp/crm/leads/create">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Lead</Button>
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {crmKPIs.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                    <span className="text-xs text-green-500 font-medium">{kpi.change}</span>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Sales Pipeline */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Sales Pipeline</h3>
            <div className="p-6 rounded-2xl border bg-white dark:bg-neutral-900">
              <div className="grid grid-cols-5 gap-4">
                {pipelineStages.map((stage) => (
                  <div key={stage.name} className="text-center">
                    <div className={`h-2 rounded-full ${stage.color} mb-3`} />
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{stage.name}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stage.count}</p>
                    <p className="text-xs text-muted-foreground">deals</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Leads / Empty State */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold">Recent Leads</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search leads..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No leads yet</p>
              <p className="text-sm mt-1">Start capturing leads to build your sales pipeline.</p>
              <Link href="/wavecore-erp/crm/leads/create" className="inline-block mt-4">
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Your First Lead</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}