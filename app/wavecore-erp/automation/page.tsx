'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Workflow, Plus, Search, Play, Pause, CheckCircle, AlertCircle,
  Clock, Zap, Settings, Trash2, Eye, ArrowRight, Webhook,
  Layers, Activity, BarChart3, Loader2, RefreshCw, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setTimeout(() => {
      setWorkflows([
        { id: '1', name: 'Invoice Approval', trigger: 'On Invoice Created', status: 'ACTIVE', runs: 0, successRate: 0 },
        { id: '2', name: 'Low Stock Alert', trigger: 'On Stock Update', status: 'ACTIVE', runs: 0, successRate: 0 },
        { id: '3', name: 'Welcome Email', trigger: 'On Customer Created', status: 'PAUSED', runs: 0, successRate: 0 },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const filtered = workflows.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()))
  const activeCount = workflows.filter(w => w.status === 'ACTIVE').length
  const pausedCount = workflows.filter(w => w.status === 'PAUSED').length

  const subPages = [
    { label: 'All Workflows', href: '/wavecore-erp/automation/workflows', icon: Workflow, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Templates', href: '/wavecore-erp/automation/templates', icon: Layers, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Webhooks', href: '/wavecore-erp/automation/webhooks', icon: Webhook, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Execution Logs', href: '/wavecore-erp/automation/logs', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
    { label: 'Settings', href: '/wavecore-erp/automation/settings', icon: Settings, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  ]

  const triggerTypes = [
    { name: 'Schedule', desc: 'Run at specific times', icon: Clock, color: 'text-blue-500' },
    { name: 'Webhook', desc: 'External API trigger', icon: Webhook, color: 'text-green-500' },
    { name: 'Email', desc: 'Incoming email', icon: Zap, color: 'text-purple-500' },
    { name: 'Database', desc: 'Record created/updated', icon: Workflow, color: 'text-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Workflow Automation</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 p-6 lg:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><Workflow className="w-8 h-8" /> Workflow Automation</h1>
              <p className="text-white/80 text-sm">Triggers • Conditions • Actions • Approvals</p>
            </div>
            <Link href="/wavecore-erp/automation/workflows/create">
              <Button className="gap-2 bg-white text-orange-700 hover:bg-gray-100"><Plus className="w-4 h-4" /> New Workflow</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-500" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Workflow className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-2xl font-bold">{workflows.length}</p>
                <p className="text-xs text-muted-foreground">Total Workflows</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Play className="w-6 h-6 text-green-500 mb-3" />
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <Pause className="w-6 h-6 text-amber-500 mb-3" />
                <p className="text-2xl font-bold">{pausedCount}</p>
                <p className="text-xs text-muted-foreground">Paused</p>
              </div>
              <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <CheckCircle className="w-6 h-6 text-emerald-500 mb-3" />
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>

            {/* Sub-pages */}
            <h2 className="text-lg font-bold mb-4">Automation Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {subPages.map(page => {
                const Icon = page.icon
                return (
                  <Link key={page.label} href={page.href}
                    className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-orange-300 hover:shadow-lg transition-all group text-center">
                    <div className={`w-12 h-12 rounded-xl ${page.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${page.color}`} />
                    </div>
                    <p className="font-medium text-xs">{page.label}</p>
                  </Link>
                )
              })}
            </div>

            {/* Triggers */}
            <h2 className="text-lg font-bold mb-4">Trigger Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {triggerTypes.map(trigger => {
                const Icon = trigger.icon
                return (
                  <div key={trigger.name} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                    <Icon className={`w-5 h-5 ${trigger.color} mb-2`} />
                    <p className="font-medium text-sm">{trigger.name}</p>
                    <p className="text-xs text-muted-foreground">{trigger.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* Workflows List */}
            <h2 className="text-lg font-bold mb-4">Workflows</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border text-sm w-full" placeholder="Search workflows..." />
            </div>

            {filtered.length > 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
                {filtered.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-4 border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <div className="flex items-center gap-3">
                      <Workflow className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.trigger}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${w.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{w.status}</span>
                      <span className="text-xs text-muted-foreground">{w.runs} runs</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Workflow className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No workflows yet</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}