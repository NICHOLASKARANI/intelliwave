'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Loader2, RefreshCw, Search, ArrowUpDown, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, Star, Ticket, Activity,
} from 'lucide-react'

export default function AgentsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('openCount')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

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

  // Aggregate by assignee
  const agents = useMemo(() => {
    const map: Record<string, any> = {}
    for (const t of tickets) {
      const key = t.assigneeId || t.assigneeName || 'UNASSIGNED'
      if (!map[key]) {
        map[key] = {
          id: key,
          name: t.assigneeName || 'Unassigned',
          total: 0, open: 0, inProgress: 0, resolved: 0, overdue: 0,
          csatSum: 0, csatCount: 0,
          responseSum: 0, responseCount: 0,
          resolutionSum: 0, resolutionCount: 0,
        }
      }
      map[key].total++
      if (t.status === 'OPEN') map[key].open++
      if (t.status === 'IN_PROGRESS') map[key].inProgress++
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') map[key].resolved++
      if (t.isOverdue) map[key].overdue++
      if (t.satisfactionRating) {
        map[key].csatSum += Number(t.satisfactionRating)
        map[key].csatCount++
      }
      if (t.responseHours !== null && t.responseHours !== undefined) {
        map[key].responseSum += t.responseHours
        map[key].responseCount++
      }
      if (t.resolutionHours !== null && t.resolutionHours !== undefined) {
        map[key].resolutionSum += t.resolutionHours
        map[key].resolutionCount++
      }
    }
    return Object.values(map).map((a: any) => ({
      ...a,
      openCount: a.open + a.inProgress,
      avgCsat: a.csatCount > 0 ? Math.round((a.csatSum / a.csatCount) * 10) / 10 : 0,
      avgResponse: a.responseCount > 0 ? Math.round((a.responseSum / a.responseCount) * 10) / 10 : 0,
      avgResolution: a.resolutionCount > 0 ? Math.round((a.resolutionSum / a.resolutionCount) * 10) / 10 : 0,
      slaCompliance: a.total > 0 ? Math.round(((a.total - a.overdue) / a.total) * 100) : 100,
    }))
  }, [tickets])

  const filtered = useMemo(() => {
    let list = [...agents]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(a => (a.name || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? 0; const bv = b[sortBy] ?? 0
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [agents, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  const totalAgents = agents.filter(a => a.id !== 'UNASSIGNED').length
  const topPerformer = [...agents].sort((a, b) => b.resolved - a.resolved)[0]

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Agents</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Users className="w-7 h-7 text-cyan-400" /> Agent Performance
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Workload · Response times · CSAT by assignee</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
            <Users className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{totalAgents}</p><p className="text-xs opacity-90">Active Agents</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.resolved || 0}</p><p className="text-xs opacity-90">Total Resolved</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgResponseHours || 0}h</p><p className="text-xs opacity-90">Team Avg Response</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg">
            <Star className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgCsat || 0}</p><p className="text-xs opacity-90">Team CSAT</p>
          </div>
        </div>

        {topPerformer && topPerformer.resolved > 0 && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-700 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center text-white text-xl font-bold">
              {topPerformer.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-yellow-400 font-bold">Top Performer</p>
              <p className="text-xl font-bold text-white">{topPerformer.name}</p>
              <p className="text-sm text-neutral-400">{topPerformer.resolved} resolved · {topPerformer.avgCsat}★ CSAT</p>
            </div>
            <TrendingUp className="w-10 h-10 text-yellow-400" />
          </div>
        )}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <span className="text-xs text-neutral-500">{filtered.length} agents</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No agent activity yet</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Agent</th>
                    {[['total','Total'],['openCount','Open'],['resolved','Resolved'],['overdue','Overdue'],['avgResponse','Avg Resp'],['avgResolution','Avg Resolve'],['avgCsat','CSAT'],['slaCompliance','SLA %']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                            {a.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="text-white font-medium">{a.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-white">{a.total}</td>
                      <td className="p-3 text-center text-yellow-300 font-bold">{a.openCount}</td>
                      <td className="p-3 text-center text-green-400 font-bold">{a.resolved}</td>
                      <td className={'p-3 text-center font-bold ' + (a.overdue > 0 ? 'text-red-400' : 'text-neutral-500')}>{a.overdue}</td>
                      <td className="p-3 text-center text-neutral-300 text-xs">{a.avgResponse}h</td>
                      <td className="p-3 text-center text-neutral-300 text-xs">{a.avgResolution}h</td>
                      <td className="p-3 text-center">
                        <span className={'font-bold ' + (a.avgCsat >= 4 ? 'text-green-400' : a.avgCsat >= 3 ? 'text-yellow-400' : 'text-red-400')}>
                          {a.avgCsat > 0 ? a.avgCsat + '★' : '—'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-neutral-700 rounded-full h-1.5">
                            <div className={'h-1.5 rounded-full ' + (a.slaCompliance >= 90 ? 'bg-green-500' : a.slaCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: a.slaCompliance + '%' }}></div>
                          </div>
                          <span className="text-xs font-bold text-white">{a.slaCompliance}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 p-5 rounded-2xl bg-blue-900/20 border border-blue-800/50 flex gap-3">
          <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200 space-y-1">
            <p><b>How agents are computed:</b> Grouped by the ticket's <b>assigneeId</b> field. Set assignee when creating or editing tickets.</p>
            <p><b>SLA Compliance:</b> % of tickets not overdue (based on dueAt vs resolvedAt).</p>
          </div>
        </div>
      </main>
    </div>
  )
}