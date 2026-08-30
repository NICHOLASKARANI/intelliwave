'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Users, Target, FileText, ShoppingCart, Activity, Plus, 
  TrendingUp, DollarSign, Phone, Mail, ArrowRight, Loader2,
  CheckCircle, Clock, AlertCircle, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  customers: number
  leads: number
  opportunities: number
  quotations: number
  orders: number
  activities: number
  totalPipelineValue: number
  winRate: number
}

export default function CRMPage() {
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0, leads: 0, opportunities: 0, quotations: 0, orders: 0, activities: 0, totalPipelineValue: 0, winRate: 0,
  })
  const [recentCustomers, setRecentCustomers] = useState<any[]>([])
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [pipeline, setPipeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [custRes, leadRes, oppRes, quoteRes, orderRes, pipelineRes] = await Promise.all([
          fetch('/api/wavecore/crm/customers'),
          fetch('/api/wavecore/crm/leads'),
          fetch('/api/wavecore/crm/opportunities'),
          fetch('/api/wavecore/crm/quotations'),
          fetch('/api/wavecore/crm/orders'),
          fetch('/api/wavecore/crm/pipeline'),
        ])
        const cust = await custRes.json()
        const lead = await leadRes.json()
        const opp = await oppRes.json()
        const quote = await quoteRes.json()
        const order = await orderRes.json()
        const pipe = await pipelineRes.json()

        const opportunities = opp.opportunities || []
        const wonOpps = opportunities.filter((o: any) => o.stage === 'CLOSED_WON')
        const totalValue = opportunities.reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

        setStats({
          customers: cust.customers?.length || 0,
          leads: lead.leads?.length || 0,
          opportunities: opportunities.length,
          quotations: quote.quotations?.length || 0,
          orders: order.orders?.length || 0,
          activities: 0,
          totalPipelineValue: totalValue,
          winRate: opportunities.length > 0 ? Math.round((wonOpps.length / opportunities.length) * 100) : 0,
        })
        setRecentCustomers((cust.customers || []).slice(0, 5))
        setRecentLeads((lead.leads || []).slice(0, 5))
        setPipeline(pipe.pipeline || [])
      } catch (err) {
        console.error('CRM dashboard error:', err)
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const formatKES = (amount: number) => 'KSh ' + (amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const quickActions = [
    { label: 'Add Customer', href: '/wavecore-erp/crm/customers/create', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Add Lead', href: '/wavecore-erp/crm/leads/create', icon: Target, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'New Quotation', href: '/wavecore-erp/crm/quotations/create', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'New Opportunity', href: '/wavecore-erp/crm/opportunities/create', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'Sales Order', href: '/wavecore-erp/crm/orders/create', icon: ShoppingCart, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
    { label: 'Record Activity', href: '/wavecore-erp/crm/activities/create', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  ]


  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - CRM Dashboard', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'crm.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold text-lg">WaveCore</span>
            </Link>
            <span className="text-sm text-muted-foreground">CRM & Sales</span>
          </div>
          <Link href="/wavecore-erp/crm/customers/create">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Customer
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* Welcome Banner */}
            <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 lg:p-8 mb-8 overflow-hidden">
              <div className="relative">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">CRM & Sales</h1>
                <p className="text-white/80 text-sm lg:text-base">Pipeline Value: {formatKES(stats.totalPipelineValue)} • Win Rate: {stats.winRate}%</p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <KPICard label="Customers" value={stats.customers} icon={Users} color="text-blue-500" href="/wavecore-erp/crm/customers" />
              <KPICard label="Leads" value={stats.leads} icon={Target} color="text-green-500" href="/wavecore-erp/crm/leads" />
              <KPICard label="Opportunities" value={stats.opportunities} icon={TrendingUp} color="text-orange-500" href="/wavecore-erp/crm/pipeline" />
              <KPICard label="Quotations" value={stats.quotations} icon={FileText} color="text-purple-500" href="/wavecore-erp/crm/quotations" />
              <KPICard label="Sales Orders" value={stats.orders} icon={ShoppingCart} color="text-teal-500" href="/wavecore-erp/crm/orders" />
              <KPICard label="Win Rate" value={stats.winRate + '%'} icon={Star} color="text-amber-500" href="/wavecore-erp/crm/pipeline" />
            </div>

            {/* Quick Actions */}
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {quickActions.map((action) => {
                const Icon = action.icon
              
  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - CRM Dashboard', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'crm.pdf'; a.click()
  }

  return (
                  <Link key={action.label} href={action.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-lg transition-all text-center">
                    <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Pipeline Overview */}
            {pipeline.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Sales Pipeline</h2>
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {pipeline.map((stage: any) => (
                      <div key={stage.id} className="text-center">
                        <div className="w-full h-2 rounded-full mb-3" style={{ backgroundColor: stage.color || '#6366f1' }} />
                        <p className="text-sm font-medium">{stage.name}</p>
                        <p className="text-2xl font-bold mt-1">{stage.opportunities?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">{formatKES(stage.totalValue || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Customers & Leads */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Customers */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Recent Customers</h3>
                  <Link href="/wavecore-erp/crm/customers" className="text-xs text-indigo-500 hover:text-indigo-600">View All →</Link>
                </div>
                {recentCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {recentCustomers.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                          {c.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email || c.phone || 'No contact'}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No customers yet</p>
                )}
              </div>

              {/* Recent Leads */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Recent Leads</h3>
                  <Link href="/wavecore-erp/crm/leads" className="text-xs text-indigo-500 hover:text-indigo-600">View All →</Link>
                </div>
                {recentLeads.length > 0 ? (
                  <div className="space-y-3">
                    {recentLeads.map((l: any) => (
                      <div key={l.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-600">
                          {l.name?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{l.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{l.company || l.email || 'No details'}</p>
                        </div>
                        <span className={`px-2 py-1 text-[10px] rounded-full ${
                          l.status === 'NEW' ? 'bg-blue-50 text-blue-600' :
                          l.status === 'QUALIFIED' ? 'bg-green-50 text-green-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No leads yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, color, href }: { label: string; value: number | string; icon: any; color: string; href: string }) {

  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - CRM Dashboard', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'crm.pdf'; a.click()
  }

  return (
    <Link href={href} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all cursor-pointer">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Link>
  )
}