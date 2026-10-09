'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Workflow, Plus, Search, Play, Pause, CheckCircle, AlertCircle,
  Clock, Zap, Settings, Trash2, Eye, ArrowRight, Webhook,
  Layers, Activity, BarChart3, Loader2, RefreshCw, TrendingUp,
  Database, Mail, Calendar, Edit3, PlayCircle
} from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface WorkflowStepItem {
  id: string
  stepNumber: number
  type: string
  config: any
}

interface WorkflowItem {
  id: string
  name: string
  trigger: string
  status: string
  createdAt: string
  steps?: WorkflowStepItem[]
}

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<WorkflowItem | null>(null)
  const [running, setRunning] = useState<string | null>(null)
  const [stats, setStats] = useState<{ successRate: number; totalRuns: number; successRuns: number; failedRuns: number; runsToday: number; approvals?: { chainCount: number; stepCount: number } }>({ successRate: 0, totalRuns: 0, successRuns: 0, failedRuns: 0, runsToday: 0, approvals: { chainCount: 0, stepCount: 0 } })

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/wavecore/automation')
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows || [])
        if (data.stats) setStats({ ...data.stats, approvals: data.approvals || { chainCount: 0, stepCount: 0 } })
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return
    try {
      await authedFetch(`/api/wavecore/automation?id=${id}`, { method: 'DELETE' })
      fetchWorkflows()
    } catch {}
  }

  const handleToggleStatus = async (workflow: WorkflowItem) => {
    const newStatus = workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      await authedFetch('/api/wavecore/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, status: newStatus }),
      })
      fetchWorkflows()
    } catch {}
  }

  const handleRun = async (id: string) => {
    setRunning(id)
    try {
      const res = await authedFetch('/api/wavecore/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: id }),
      })
      const data = await res.json()
      if (res.ok && data.result) {
        const r = data.result
        alert('Run complete: ' + r.status + ' in ' + r.durationMs + 'ms' + String.fromCharCode(10) + r.stepsRun + ' executed, ' + r.stepsSkipped + ' skipped')
      } else if (data.error) {
        alert('Run failed: ' + data.error)
      }
    } catch (e) {
      alert('Run failed: ' + (e as Error).message)
    } finally {
      setRunning(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await authedFetch('/api/wavecore/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      setEditing(null)
      fetchWorkflows()
    } catch {}
  }

  const handleExportPDF = () => {
    const esc = (s: string) => String(s || '').replace(/[()\\]/g, '\\$&').slice(0, 95)
    const lines: string[] = []
    const add = (s: string) => lines.push(s)

    add('WaveCore ERP — Workflow Automation Report')
    add('=============================================================')
    add('Generated: ' + new Date().toLocaleString())
    add('Total workflows: ' + workflows.length)
    add('Active: ' + activeCount + '   Paused: ' + pausedCount)
    add('Success Rate: ' + (stats.totalRuns > 0 ? stats.successRate + '% (' + stats.totalRuns + ' runs)' : 'no runs yet'))
    add('=============================================================')
    add('')

    workflows.forEach((w, wi) => {
      add('[' + (wi + 1) + '] ' + w.name)
      add('    Trigger : ' + (w.trigger || '—'))
      add('    Status  : ' + w.status)
      add('    Created : ' + new Date(w.createdAt).toLocaleString())
      const steps = w.steps || []
      add('    Steps   : ' + steps.length)
      steps.forEach(s => {
        add('      #' + s.stepNumber + '  ' + s.type + '  ' + JSON.stringify(s.config || {}))
      })
      add('')
    })

    add('=============================================================')
    add('(c) 2026 IntelliWavve — All Rights Reserved')

    // Build a valid single-page-or-multi PDF (one page per ~55 lines)
    const LINES_PER_PAGE = 55
    const pages: string[][] = []
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
      pages.push(lines.slice(i, i + LINES_PER_PAGE))
    }
    if (pages.length === 0) pages.push(['(empty)'])

    const objects: string[] = []
    const pageIds: number[] = []
    // We'll build objects: 1=Catalog, 2=Pages, 3=Font, then per-page: (content, page) pairs
    const contentIds: number[] = []
    const pageObjIds: number[] = []
    let nextId = 4
    pages.forEach(() => {
      contentIds.push(nextId++); pageObjIds.push(nextId++)
    })

    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
    objects.push('2 0 obj\n<< /Type /Pages /Kids [' + pageObjIds.map(id => id + ' 0 R').join(' ') + '] /Count ' + pages.length + ' >>\nendobj\n')
    objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')

    const contentStream = (pageLines: string[]) => {
      let s = ''
      let y = 792 - 40
      for (const ln of pageLines) {
        s += 'BT /F1 9 Tf 40 ' + y + ' Td (' + esc(ln) + ') Tj ET\n'
        y -= 12
      }
      return s
    }

    pages.forEach((pl, idx) => {
      const cid = contentIds[idx]
      const pid = pageObjIds[idx]
      const stream = contentStream(pl)
      objects.push(cid + ' 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream\nendobj\n')
      objects.push(pid + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ' + cid + ' 0 R >>\nendobj\n')
    })

    // Sort objects by id, since PDF xref requires ascending
    objects.sort((a, b) => parseInt(a) - parseInt(b))

    let pdf = '%PDF-1.4\n'
    const offsets: number[] = []
    for (const obj of objects) {
      offsets.push(pdf.length)
      pdf += obj
    }
    const xrefStart = pdf.length
    pdf += 'xref\n0 ' + (objects.length + 1) + '\n'
    pdf += '0000000000 65535 f \n'
    for (const off of offsets) {
      pdf += String(off).padStart(10, '0') + ' 00000 n \n'
    }
    pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF'

    const blob = new Blob([pdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow-automation-report-' + new Date().toISOString().slice(0,10) + '.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
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
            <div className="flex gap-2 print:hidden">
              <button onClick={handleExportPDF} disabled={workflows.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 text-white text-sm font-bold disabled:opacity-40">
                <BarChart3 className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 text-white text-sm font-bold">
                <Eye className="w-4 h-4" /> Print
              </button>
              <Link href="/wavecore-erp/automation/workflows/create">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-orange-700 font-bold">
                  <Plus className="w-4 h-4" /> New Workflow
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* KPIs - CLICKABLE */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
            <p className="text-2xl font-bold">{stats.totalRuns > 0 ? stats.successRate + '%' : '—'}</p>
            <p className="text-xs text-muted-foreground">{stats.totalRuns > 0 ? `Success Rate ($($stats.totalRuns) runs)` : 'Success Rate — no runs yet'}</p>
          </div>
          <Link href="/wavecore-erp/procurement/approvals" className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg cursor-pointer">
            <AlertCircle className="w-6 h-6 text-indigo-500 mb-3" />
            <p className="text-2xl font-bold">{stats.approvals?.chainCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Approval Chains ({stats.approvals?.stepCount ?? 0} steps)</p>
          </Link>
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
                  <button onClick={() => handleRun(workflow.id)} disabled={running === workflow.id} className="p-2 rounded-lg text-teal-500 disabled:opacity-50" title="Run now">
                    {running === workflow.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  </button>
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

        {/* Print-only detailed report */}
        <div className="hidden print:block mt-8">
          <h2 className="text-lg font-bold mb-3">Workflow Automation Report</h2>
          <p className="text-xs mb-3">
            Generated {new Date().toLocaleString()} · {workflows.length} workflows ·
            Active {activeCount} · Paused {pausedCount} ·
            Success Rate {stats.totalRuns > 0 ? stats.successRate + '% (' + stats.totalRuns + ' runs)' : 'no runs yet'}
          </p>
          {workflows.length === 0 ? (
            <p>No workflows.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1">#</th>
                  <th className="text-left p-1">Name</th>
                  <th className="text-left p-1">Trigger</th>
                  <th className="text-left p-1">Status</th>
                  <th className="text-left p-1">Created</th>
                  <th className="text-left p-1">Steps</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((w, i) => (
                  <>
                    <tr key={w.id} className="border-b align-top">
                      <td className="p-1">{i + 1}</td>
                      <td className="p-1 font-medium">{w.name}</td>
                      <td className="p-1">{w.trigger}</td>
                      <td className="p-1">{w.status}</td>
                      <td className="p-1">{new Date(w.createdAt).toLocaleString()}</td>
                      <td className="p-1">{(w.steps || []).length}</td>
                    </tr>
                    {(w.steps || []).map(s => (
                      <tr key={w.id + '-s-' + s.stepNumber} className="border-b">
                        <td className="p-1"></td>
                        <td className="p-1 pl-4" colSpan={4}>
                          Step #{s.stepNumber}: {s.type} — {JSON.stringify(s.config || {})}
                        </td>
                        <td className="p-1"></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
