'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText, Loader2, RefreshCw, Printer, Download, TrendingUp,
  BarChart3, Target, CheckCircle2, AlertTriangle, Clock, DollarSign,
  Users, Activity,
} from 'lucide-react'

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/wavecore/projects'),
        fetch('/api/wavecore/projects/tasks'),
      ])
      const pData = await pRes.json()
      const tData = await tRes.json()
      setProjects(pData.projects || [])
      setSummary(pData.summary || {})
      setTasks(tData.tasks || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const byStatus = useMemo(() => {
    const m: Record<string, number> = { PLANNING: 0, ACTIVE: 0, ON_HOLD: 0, COMPLETED: 0, CANCELLED: 0 }
    for (const p of projects) m[p.status] = (m[p.status] || 0) + 1
    return m
  }, [projects])

  const byPriority = useMemo(() => {
    const m: Record<string, number> = { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 }
    for (const p of projects) m[p.priority] = (m[p.priority] || 0) + 1
    return m
  }, [projects])

  const byTaskStatus = useMemo(() => {
    const m: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, BLOCKED: 0, DONE: 0 }
    for (const t of tasks) m[t.status] = (m[t.status] || 0) + 1
    return m
  }, [tasks])

  const topProjects = useMemo(() => {
    return [...projects].sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0)).slice(0, 5)
  }, [projects])

  const completionRate = summary.total > 0 ? Math.round(((summary.completed || 0) / summary.total) * 100) : 0
  const onTimeRate = summary.total > 0 ? Math.round(((summary.total - (summary.overdue || 0)) / summary.total) * 100) : 0
  const avgProgress = summary.avgProgress || 0

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Projects · Reports</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <FileText className="w-7 h-7 text-indigo-400" /> Project Reports
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Portfolio analytics · Status distribution · Top projects</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={() => window.open('/api/wavecore/projects/pdf', '_blank')} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40">
              <Printer className="w-5 h-5" /> Portfolio PDF
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* KPI STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
                <BarChart3 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total Projects</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
                <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{completionRate}%</p><p className="text-xs opacity-90">Completion Rate</p>
              </div>
              <div className={'p-4 rounded-2xl text-white shadow-lg bg-gradient-to-br ' + (onTimeRate >= 80 ? 'from-green-600 to-emerald-800' : 'from-yellow-600 to-amber-800')}>
                <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{onTimeRate}%</p><p className="text-xs opacity-90">On-Time Rate</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
                <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{avgProgress}%</p><p className="text-xs opacity-90">Avg Progress</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
                <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{(summary.totalBudget || 0).toLocaleString()}</p><p className="text-xs opacity-90">Total Budget</p>
              </div>
            </div>

            {/* STATUS DISTRIBUTION */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Projects by Status
                </h3>
                <div className="space-y-3">
                  {Object.entries(byStatus).map(([status, count]) => {
                    const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0
                    const colors: Record<string, string> = { PLANNING: 'bg-yellow-500', ACTIVE: 'bg-cyan-500', ON_HOLD: 'bg-orange-500', COMPLETED: 'bg-green-500', CANCELLED: 'bg-neutral-500' }
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-400 uppercase font-bold">{status}</span>
                          <span className="text-white font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className={colors[status] + ' h-2 rounded-full'} style={{ width: pct + '%' }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-400 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Tasks by Status
                </h3>
                <div className="space-y-3">
                  {Object.entries(byTaskStatus).map(([status, count]) => {
                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
                    const colors: Record<string, string> = { TODO: 'bg-neutral-500', IN_PROGRESS: 'bg-cyan-500', REVIEW: 'bg-yellow-500', BLOCKED: 'bg-red-500', DONE: 'bg-green-500' }
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-400 uppercase font-bold">{status.replace('_', ' ')}</span>
                          <span className="text-white font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className={colors[status] + ' h-2 rounded-full'} style={{ width: pct + '%' }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* PRIORITY + TOP PROJECTS */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-orange-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Projects by Priority
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(byPriority).map(([p, count]) => {
                    const colors: Record<string, string> = { LOW: 'from-neutral-600 to-neutral-800', NORMAL: 'from-blue-600 to-indigo-800', HIGH: 'from-orange-600 to-red-800', URGENT: 'from-red-600 to-rose-800' }
                    return (
                      <div key={p} className={'p-4 rounded-xl text-center bg-gradient-to-br text-white ' + colors[p]}>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-[10px] uppercase tracking-wide opacity-90 font-bold mt-1">{p}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-400 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Top 5 Projects by Budget
                </h3>
                {topProjects.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No projects yet</p>
                ) : (
                  <div className="space-y-2">
                    {topProjects.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">{i + 1}</span>
                        <span className="flex-1 text-sm text-white truncate">{p.title}</span>
                        <span className="text-sm font-bold text-emerald-400">{Number(p.budget).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SUMMARY STATS */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Portfolio Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Active" value={byStatus.ACTIVE} color="text-cyan-400" />
                <Stat label="Completed" value={byStatus.COMPLETED} color="text-green-400" />
                <Stat label="Overdue" value={summary.overdue || 0} color="text-red-400" />
                <Stat label="Total Tasks" value={tasks.length} color="text-white" />
                <Stat label="Open Tasks" value={tasks.filter(t => t.status !== 'DONE').length} color="text-yellow-400" />
                <Stat label="Done Tasks" value={byTaskStatus.DONE} color="text-green-400" />
                <Stat label="Team Size" value={summary.teamSize || 0} color="text-amber-400" />
                <Stat label="Total Hours" value={summary.totalHours || 0} color="text-indigo-400" />
              </div>
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-indigo-900/20 border border-indigo-800/50 flex gap-3">
              <Download className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-200 space-y-1">
                <p><b>Export options:</b> Click "Portfolio PDF" for a full A4 landscape report. Visit <b>Tasks</b> page for the Task List PDF.</p>
                <p><b>Custom reports:</b> Filter by project on the Tasks page, then export.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-neutral-800">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">{label}</p>
      <p className={'text-xl font-bold mt-1 ' + color}>{value}</p>
    </div>
  )
}