'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  TrendingUp, Loader2, RefreshCw, Printer, Ticket, CheckCircle2,
  Clock, AlertTriangle, Star, BarChart3, Users, Timer, Activity,
} from 'lucide-react'

export default function ReportsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const byStatus = useMemo(() => {
    const m: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, PENDING: 0, RESOLVED: 0, CLOSED: 0 }
    for (const t of tickets) m[t.status] = (m[t.status] || 0) + 1
    return m
  }, [tickets])

  const byPriority = useMemo(() => {
    const m: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
    for (const t of tickets) m[t.priority] = (m[t.priority] || 0) + 1
    return m
  }, [tickets])

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of tickets) {
      const c = t.category || 'GENERAL'
      m[c] = (m[c] || 0) + 1
    }
    return m
  }, [tickets])

  const byAgent = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of tickets) {
      const k = t.assigneeName || 'Unassigned'
      m[k] = (m[k] || 0) + 1
    }
    return m
  }, [tickets])

  // 30-day volume chart
  const volumeChart = useMemo(() => {
    const days: { date: string; count: number }[] = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const count = tickets.filter(t => {
        const c = new Date(t.createdAt)
        return c >= d && c < next
      }).length
      days.push({ date: d.toISOString().slice(5, 10), count })
    }
    return days
  }, [tickets])

  const maxVolume = Math.max(...volumeChart.map(d => d.count), 1)

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Reports</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <TrendingUp className="w-7 h-7 text-pink-400" /> Helpdesk Reports
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Volume · Performance · Distributions · PDF export</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={() => window.open('/api/wavecore/helpdesk/tickets/pdf', '_blank')} className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-pink-900/40">
              <Printer className="w-5 h-5" /> Export PDF
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : (
          <>
            {/* KPI STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg">
                <Ticket className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
                <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.open || 0}</p><p className="text-xs opacity-90">Open</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
                <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.resolved || 0}</p><p className="text-xs opacity-90">Resolved</p>
              </div>
              <div className={'p-4 rounded-2xl text-white shadow-lg bg-gradient-to-br ' + (summary.overdue > 0 ? 'from-red-600 to-rose-800' : 'from-slate-600 to-neutral-800')}>
                <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue || 0}</p><p className="text-xs opacity-90">Overdue</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
                <Timer className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgResponseHours || 0}h</p><p className="text-xs opacity-90">Avg Response</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-800 text-white shadow-lg">
                <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgResolutionHours || 0}h</p><p className="text-xs opacity-90">Avg Resolve</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg">
                <Star className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgCsat || 0}</p><p className="text-xs opacity-90">CSAT</p>
              </div>
            </div>

            {/* VOLUME CHART (30 days) */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-pink-400 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Ticket Volume · Last 30 Days
              </h3>
              <div className="flex items-end gap-1 h-40">
                {volumeChart.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-gradient-to-t from-pink-600 to-rose-400 rounded-t transition-all hover:from-pink-500 hover:to-rose-300" style={{ height: (d.count / maxVolume) * 100 + '%', minHeight: d.count > 0 ? '4px' : '2px' }} title={`${d.date}: ${d.count} tickets`}></div>
                    <span className="text-[8px] text-neutral-600 mt-1 rotate-45 origin-left whitespace-nowrap">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DISTRIBUTIONS */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> By Status
                </h3>
                <div className="space-y-3">
                  {Object.entries(byStatus).map(([s, count]) => {
                    const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
                    const colors: Record<string, string> = { OPEN: 'bg-cyan-500', IN_PROGRESS: 'bg-yellow-500', PENDING: 'bg-orange-500', RESOLVED: 'bg-green-500', CLOSED: 'bg-neutral-500' }
                    return (
                      <div key={s}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-400 uppercase font-bold">{s.replace('_', ' ')}</span>
                          <span className="text-white font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className={(colors[s] || 'bg-pink-500') + ' h-2 rounded-full'} style={{ width: pct + '%' }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-orange-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> By Priority
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(byPriority).map(([p, count]) => {
                    const colors: Record<string, string> = { LOW: 'from-neutral-600 to-neutral-800', MEDIUM: 'from-blue-600 to-indigo-800', HIGH: 'from-orange-600 to-red-800', URGENT: 'from-red-600 to-rose-800' }
                    return (
                      <div key={p} className={'p-4 rounded-xl text-center bg-gradient-to-br text-white ' + colors[p]}>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-[10px] uppercase font-bold mt-1 opacity-90">{p}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-purple-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> By Category
                </h3>
                {Object.keys(byCategory).length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No data</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([c, count]) => {
                      const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
                      return (
                        <div key={c}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-400 uppercase font-bold">{c}</span>
                            <span className="text-white font-bold">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-400 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" /> By Assignee
                </h3>
                {Object.keys(byAgent).length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No data</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([a, count]) => {
                      const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
                      return (
                        <div key={a}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-400 font-bold">{a}</span>
                            <span className="text-white font-bold">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-pink-900/20 border border-pink-800/50 flex gap-3">
              <Printer className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-pink-200 space-y-1">
                <p><b>Export:</b> Click "Export PDF" for a full A4 landscape ticket report with all current data.</p>
                <p><b>Filters:</b> Visit the Tickets page to filter by status/priority/agent, then export.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}