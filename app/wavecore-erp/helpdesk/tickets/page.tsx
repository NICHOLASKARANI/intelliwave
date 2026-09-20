'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Ticket, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  AlertTriangle, ArrowUpDown, FileEdit, Sparkles, Clock, Printer,
  TrendingUp, Timer, Star, Activity,
} from 'lucide-react'

const STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const statusStyle = (s: string, overdue: boolean) => {
  if (overdue) return 'bg-red-900/40 text-red-300 border border-red-700'
  switch (s) {
    case 'OPEN': return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
    case 'IN_PROGRESS': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'PENDING': return 'bg-orange-900/40 text-orange-300 border border-orange-700'
    case 'RESOLVED': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'CLOSED': return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-400'
  }
}

const priorityStyle = (p: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-900/40 text-red-300 border-red-700'
    case 'HIGH': return 'bg-orange-900/40 text-orange-300 border-orange-700'
    case 'MEDIUM': return 'bg-blue-900/40 text-blue-300 border-blue-700'
    default: return 'bg-neutral-800 text-neutral-400 border-neutral-700'
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [deleting, setDeleting] = useState('')

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

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }

  const del = async (id: string, subject: string) => {
    if (!confirm('Delete ticket "' + subject + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/helpdesk/tickets/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Ticket deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const pdf = () => window.open('/api/wavecore/helpdesk/tickets/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...tickets]
    if (activeKpi === 'OPEN') list = list.filter(t => t.status === 'OPEN')
    else if (activeKpi === 'IN_PROGRESS') list = list.filter(t => t.status === 'IN_PROGRESS')
    else if (activeKpi === 'OVERDUE') list = list.filter(t => t.isOverdue)
    else if (activeKpi === 'UNASSIGNED') list = list.filter(t => !t.assigneeId)
    if (filterStatus !== 'ALL') list = list.filter(t => t.status === filterStatus)
    if (filterPriority !== 'ALL') list = list.filter(t => t.priority === filterPriority)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t =>
        (t.subject || '').toLowerCase().includes(s) ||
        (t.customerName || '').toLowerCase().includes(s) ||
        (t.customerEmail || '').toLowerCase().includes(s) ||
        (t.description || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [tickets, activeKpi, filterStatus, filterPriority, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/helpdesk" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Helpdesk · Tickets</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Ticket className="w-7 h-7 text-pink-400" /> Tickets
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Full queue · Filters · Sortable · PDF export</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <Link href="/wavecore-erp/helpdesk/tickets/create" className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-pink-900/40">
              <Plus className="w-5 h-5" /> New Ticket
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-pink-300' : '')}>
            <Ticket className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('OPEN')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OPEN' ? 'ring-4 ring-cyan-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.open || 0}</p><p className="text-xs opacity-90">Open</p>
          </button>
          <button onClick={() => setActiveKpi('IN_PROGRESS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'IN_PROGRESS' ? 'ring-4 ring-yellow-300' : '')}>
            <Timer className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inProgress || 0}</p><p className="text-xs opacity-90">In Progress</p>
          </button>
          <button onClick={() => setActiveKpi('OVERDUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OVERDUE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue || 0}</p><p className="text-xs opacity-90">Overdue</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgResponseHours || 0}h</p><p className="text-xs opacity-90">Avg Response</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <Star className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgCsat || 0}</p><p className="text-xs opacity-90">CSAT</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject, customer..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No tickets match filters</p>
            <Link href="/wavecore-erp/helpdesk/tickets/create" className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Ticket
            </Link>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['subject','Subject'],['customerName','Customer'],['category','Category'],['priority','Priority'],['assigneeName','Assignee'],['createdAt','Created'],['daysOpen','Age'],['status','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3">
                        <Link href={'/wavecore-erp/helpdesk/tickets/' + t.id} className="text-white font-medium hover:text-pink-400">{t.subject}</Link>
                      </td>
                      <td className="p-3 text-xs text-neutral-400">{t.customerName || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{t.category || 'GENERAL'}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold border ' + priorityStyle(t.priority)}>{t.priority}</span></td>
                      <td className="p-3 text-xs text-neutral-400">{t.assigneeName || 'Unassigned'}</td>
                      <td className="p-3 text-xs text-neutral-500">{new Date(t.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 text-xs text-neutral-300 text-center">{t.daysOpen}d</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold border ' + statusStyle(t.status, t.isOverdue)}>{t.isOverdue ? 'OVERDUE' : t.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => del(t.id, t.subject)} disabled={deleting === t.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
                            {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}