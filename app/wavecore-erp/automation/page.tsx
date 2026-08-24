'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Workflow, Plus, Search, Play, Pause, CheckCircle, AlertCircle,
  Clock, Zap, Settings, Trash2, Eye, ArrowRight, Webhook,
  Layers, Activity, BarChart3, Loader2, RefreshCw, TrendingUp,
  Database, Mail, Calendar, Edit3
} from 'lucide-react'

interface WorkflowItem {
  id: string
  name: string
  trigger: string
  status: string
  createdAt: string
}

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<WorkflowItem | null>(null)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/automation')
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return
    try {
      await fetch(`/api/wavecore/automation?id=${id}`, { method: 'DELETE' })
      fetchWorkflows()
    } catch {}
  }

  const handleToggleStatus = async (workflow: WorkflowItem) => {
    const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      await fetch('/api/wavecore/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, status: newStatus }),
      })
      fetchWorkflows()
    } catch {}
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await fetch('/api/wavecore/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      setEditing(null)
      fetchWorkflows()
    } catch {}
  }

  const filtered = workflows.filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.trigger?.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = workflows.filter(w => w.status === 'ACTIVE').length
  const pausedCount = workflows.filter(w => w.status === 'PAUSED').length

  const triggerTypes = [
    { name: 'Schedule', desc: 'Run at specific times', icon: Calendar },
    { name: 'Webhook', desc: 'External API trigger', icon: Webhook },
    { name: 'Email', desc: 'Incoming email', icon: Mail },
    { name: 'Database', desc: 'Record created/updated', icon: Database },
  ]

  const subPages = [
    { label: 'All Workflows', href: '/wavecore-erp/automation/workflows', icon: Workflow },
    { label: 'Templates', href: '/wavecore-erp/automation/templates', icon: Layers },
    { label: 'Webhooks', href: '/wavecore-erp/automation/webhooks', icon: Webhook },
    { label: 'Logs', href: '/wavecore-erp/automation/logs', icon: Activity },
    { label: 'Settings', href: '/wavecore-erp/automation/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Automation</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 p-6 lg:p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Workflow className="w-8 h-8" /> Workflow Automation
              </h1>
              <p className="text-white/80 text-sm">Triggers • Actions • Approvals • Real-time</p>
            </div>
            <Link href="/wavecore-erp/automation/workflows/create">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-orange-700 font-bold">
                <Plus className="w-4 h-4" /> New Workflow
              </button>
            </Link>
          </div>
        </div>

        {/* KPIs - CLICKABLE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/wavecore-erp/automation/workflows" className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg cursor-pointer">
            <Workflow className="w-6 h-6 text-blue-500 mb-3" />
            <p className="text-2xl font-bold">{workflows.length}</p>
            <p className="text-xs text-muted-foreground">Total Workflows</p>
          </Link>
          <Link href="/wavecore-erp/automation/workflows?status=active" className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg cursor-pointer">
            <Play className="w-6 h-6 text-green-500 mb-3" />
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Link>
          <Link href="/wavecore-erp/automation/workflows?status=paused" className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg cursor-pointer">
            <Pause className="w-6 h-6 text-amber-500 mb-3" />
            <p className="text-2xl font-bold">{pausedCount}</p>
            <p className="text-xs text-muted-foreground">Paused</p>
          </Link>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <CheckCircle className="w-6 h-6 text-emerald-500 mb-3" />
            <p className="text-2xl font-bold">100%</p>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
        </div>

        {/* Trigger Types */}
        <h2 className="text-lg font-bold mb-4">Trigger Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {triggerTypes.map(trigger => {
            const Icon = trigger.icon
            return (
              <div key={trigger.name} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                <Icon className="w-5 h-5 text-orange-500 mb-2" />
                <p className="font-medium text-sm">{trigger.name}</p>
                <p className="text-xs text-muted-foreground">{trigger.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Sub-pages */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {subPages.map(page => {
            const Icon = page.icon
            return (
              <Link key={page.label} href={page.href}
                className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-orange-500 hover:shadow-lg transition-all text-center">
                <Icon className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                <p className="font-medium text-xs">{page.label}</p>
              </Link>
            )
          })}
        </div>

        {/* Workflows List */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Workflows ({filtered.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border text-sm" placeholder="Search workflows..." />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Workflow className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No workflows yet</p>
            <p className="text-sm text-muted-foreground">Create your first workflow to automate your business</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {filtered.map(workflow => (
              <div key={workflow.id} className="flex justify-between items-center p-4 border-b hover:bg-neutral-50">
                <div>
                  <p className="font-medium">{workflow.name}</p>
                  <p className="text-xs text-muted-foreground">{workflow.trigger} • {new Date(workflow.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStatus(workflow)} className={`p-2 rounded-lg ${workflow.status === 'ACTIVE' ? 'text-green-500' : 'text-amber-500'}`}>
                    {workflow.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(workflow)} className="p-2 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(workflow.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit Workflow</h2>
            <input type="text" value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-3" placeholder="Workflow name" />
            <select value={editing.trigger} onChange={(e) => setEditing({...editing, trigger: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-3">
              <option>Schedule</option>
              <option>Webhook</option>
              <option>Email</option>
              <option>Database</option>
            </select>
            <select value={editing.status} onChange={(e) => setEditing({...editing, status: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border mb-4">
              <option>ACTIVE</option>
              <option>PAUSED</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-medium">Save</button>
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}