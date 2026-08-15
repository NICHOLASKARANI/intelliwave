'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Target, FileText, ShoppingCart, Activity, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CRMPage() {
  const [stats, setStats] = useState({ customers: 0, leads: 0, opportunities: 0, quotations: 0, orders: 0, activities: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [custRes, leadRes, oppRes] = await Promise.all([
          fetch('/api/wavecore/crm/customers'),
          fetch('/api/wavecore/crm/leads'),
          fetch('/api/wavecore/crm/opportunities'),
        ])
        const custData = await custRes.json()
        const leadData = await leadRes.json()
        const oppData = await oppRes.json()
        setStats({
          customers: custData.customers?.length || 0,
          leads: leadData.leads?.length || 0,
          opportunities: oppData.opportunities?.length || 0,
          quotations: 0,
          orders: 0,
          activities: 0,
        })
      } catch {} finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const quickActions = [
    { label: 'Add Customer', href: '/wavecore-erp/crm/customers/create', icon: Users, color: 'text-blue-500' },
    { label: 'Add Lead', href: '/wavecore-erp/crm/leads/create', icon: Target, color: 'text-green-500' },
    { label: 'Create Quotation', href: '/wavecore-erp/crm/quotations/create', icon: FileText, color: 'text-purple-500' },
    { label: 'New Opportunity', href: '/wavecore-erp/crm/opportunities/create', icon: Target, color: 'text-orange-500' },
    { label: 'Sales Order', href: '/wavecore-erp/crm/orders/create', icon: ShoppingCart, color: 'text-teal-500' },
    { label: 'Record Activity', href: '/wavecore-erp/crm/activities/create', icon: Activity, color: 'text-indigo-500' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">CRM & Sales</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">CRM & Sales</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Customers" value={stats.customers} icon={Users} color="text-blue-500" href="/wavecore-erp/crm/customers" />
          <StatCard label="Leads" value={stats.leads} icon={Target} color="text-green-500" href="/wavecore-erp/crm/leads" />
          <StatCard label="Opportunities" value={stats.opportunities} icon={Target} color="text-orange-500" href="/wavecore-erp/crm/opportunities" />
          <StatCard label="Quotations" value={stats.quotations} icon={FileText} color="text-purple-500" href="/wavecore-erp/crm/quotations" />
          <StatCard label="Sales Orders" value={stats.orders} icon={ShoppingCart} color="text-teal-500" href="/wavecore-erp/crm/orders" />
          <StatCard label="Activities" value={stats.activities} icon={Activity} color="text-indigo-500" href="/wavecore-erp/crm/activities" />
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, href }: { label: string; value: number; icon: any; color: string; href: string }) {
  return (
    <Link href={href} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
      <Icon className={`w-5 h-5 ${color} mb-3`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Link>
  )
}