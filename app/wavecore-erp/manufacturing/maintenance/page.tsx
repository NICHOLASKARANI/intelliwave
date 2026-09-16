'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Wrench, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Activity, FileEdit, ChevronRight, Sparkles, AlertTriangle,
  PlayCircle, Clock, TrendingUp,
} from 'lucide-react'

const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const PRIORITIES = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const TYPES = ['ALL', 'PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'PREDICTIVE']

const statusStyle = (s: string) => {
  switch (s) {
    case 'OPEN': return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'IN_PROGRESS': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'CANCELLED': return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}
const priorityStyle = (p: string) => {
  switch (p) {
    case 'CRITICAL': return 'bg-red-900/60 text-red-200 border border-red-700'
    case 'HIGH': return 'bg-orange-900/50 text-orange-300 border border-orange-700'
    case 'MEDIUM': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'LOW': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [busy, setBusy] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    assetName: '', assetCode: '', type: 'CORRECTIVE', priority: 'MEDIUM',
    status: 'OPEN', description: '', requestedDate: '', assignedToId: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/maintenance')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); setRequests([]) }
      else setRequests(data.requests || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    assetName: '', assetCode: '', type: 'CORRECTIVE', priority: 'MEDIUM',
    status: 'OPEN', description: '', requestedDate: '', assignedToId: '',
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }

  const openEdit = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/maintenance/' + id)
    const data = await res.json()
    if (!data.request) return
    const r = data.request
    setForm({
      assetName: r.assetName || '',
      assetCode: r.assetCode || '',
      type: r.type || 'CORRECTIVE',
      priority: r.priority || 'MEDIUM',
      status: r.status || 'OPEN',
      description: r.description || '',
      requestedDate: r.requestedDate ? r.requestedDate.slice(0, 10) : '',
      assignedToId: r.assignedToId || '',
    })
    setEditing(r)
    setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.assetName.trim()) { setError('Asset name is required'); return }
    if (!form.description.trim()) { setError('Description is required'); return }
    try {
      const url = editing ? '/api/wavecore/manufacturing/maintenance/' + editing.id : '/api/wavecore/manufacturing/maintenance'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Request updated' : 'Maintenance request created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const patchRequest = async (id: string, patch: any, label: string) => {
    setBusy(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/maintenance/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) { flash(label); fetchAll() }
    } finally { setBusy('') }
  }

  const del = async (id: string, label: string) => {
    if (!confirm('Delete maintenance request ' + label + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/maintenance/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm('Delete ' + selected.size + ' request(s)?')) return
    for (const id of Array.from(selected)) {
      await fetch('/api/wavecore/manufacturing/maintenance/' + id, { method: 'DELETE' })
    }
    setSelected(new Set()); flash('Bulk delete complete'); fetchAll()
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/maintenance/' + id)
    const data = await res.json()
    setDetail(data)
  }

  const pdf = (id: string) => window.open('/api/wavecore/manufacturing/maintenance/' + id + '/pdf', '_blank')

  const summary = useMemo(() => {
    const now = new Date()
    const total = requests.length
    const open = requests.filter(r => r.status === 'OPEN').length
    const inProg = requests.filter(r => r.status === 'IN_PROGRESS').length
    const completed = requests.filter(r => r.status === 'COMPLETED').length
    const overdue = requests.filter(r =>
      r.status !== 'COMPLETED' && r.status !== 'CANCELLED' &&
      r.requestedDate && new Date(r.requestedDate) < now
    ).length
    const critical = requests.filter(r => r.priority === 'CRITICAL' && r.status !== 'COMPLETED').length
    const completedItems = requests.filter(r => r.status === 'COMPLETED' && r.completedDate && r.createdAt)
    const avgResolution = completedItems.length > 0
      ? Math.round(
          completedItems.reduce((s, r) =>
            s + (new Date(r.completedDate).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          , 0) / completedItems.length * 10
        ) / 10
      : 0
    return { total, open, inProg, completed, overdue, critical, avgResolution }
  }, [requests])

  const filtered = useMemo(() => {
    let list = [...requests]
    if (activeKpi === 'OPEN') list = list.filter(r => r.status === 'OPEN')
    else if (activeKpi === 'IN_PROGRESS') list = list.filter(r => r.status === 'IN_PROGRESS')
    else if (activeKpi === 'COMPLETED') list = list.filter(r => r.status === 'COMPLETED')
    else if (activeKpi === 'OVERDUE') list = list.filter(r =>
      r.status !== 'COMPLETED' && r.status !== 'CANCELLED' &&
      r.requestedDate && new Date(r.requestedDate) < new Date()
    )
    else if (activeKpi === 'CRITICAL') list = list.filter(r => r.priority === 'CRITICAL' && r.status !== 'COMPLETED')
    if (filterStatus !== 'ALL') list = list.filter(r => r.status === filterStatus)
    if (filterPriority !== 'ALL') list = list.filter(r => r.priority === filterPriority)
    if (filterType !== 'ALL') list = list.filter(r => r.type === filterType)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r =>
        (r.number || '').toLowerCase().includes(s) ||
        (r.assetName || '').toLowerCase().includes(s) ||
        (r.assetCode || '').toLowerCase().includes(s) ||
        (r.description || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [requests, activeKpi, filterStatus, filterPriority, filterType, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }
  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Maintenance</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Wrench className="w-7 h-7 text-red-500" /> Maintenance
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Preventive · Corrective · Emergency · Predictive</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-900/40">
              <Plus className="w-5 h-5" /> New Request
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-red-300' : '')}>
            <Wrench className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('OPEN')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-orange-600 to-red-800 text-white shadow-lg ' + (activeKpi === 'OPEN' ? 'ring-4 ring-orange-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.open}</p><p className="text-xs opacity-90">Open</p>
          </button>
          <button onClick={() => setActiveKpi('IN_PROGRESS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg ' + (activeKpi === 'IN_PROGRESS' ? 'ring-4 ring-yellow-300' : '')}>
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inProg}</p><p className="text-xs opacity-90">In Progress</p>
          </button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed}</p><p className="text-xs opacity-90">Completed</p>
          </button>
          <button onClick={() => setActiveKpi('OVERDUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-700 to-red-900 text-white shadow-lg ' + (activeKpi === 'OVERDUE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue}</p><p className="text-xs opacity-90">Overdue</p>
          </button>
          <button onClick={() => setActiveKpi('CRITICAL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-fuchsia-600 to-purple-800 text-white shadow-lg ' + (activeKpi === 'CRITICAL' ? 'ring-4 ring-fuchsia-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.critical}</p><p className="text-xs opacity-90">Critical</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgResolution}d</p><p className="text-xs opacity-90">Avg Resolution</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by #, asset, or description..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p === 'ALL' ? 'All Priorities' : p}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              {TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
            </select>
            {selected.size > 0 && (
              <button onClick={bulkDelete} className="px-3 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">
                Delete {selected.size}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-red-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No maintenance requests match filters</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                    {[['number','Number'],['assetName','Asset'],['type','Type'],['priority','Priority'],['status','Status'],['assignedToId','Assigned'],['requestedDate','Scheduled']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const overdue = r.status !== 'COMPLETED' && r.status !== 'CANCELLED' &&
                      r.requestedDate && new Date(r.requestedDate) < new Date()
                    return (
                      <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                        <td className="p-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                        <td className="p-3 font-mono text-white">
                          <button onClick={() => openDetail(r.id)} className="hover:text-red-400 inline-flex items-center gap-1">
                            {r.number} <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="p-3 text-neutral-200">
                          {r.assetName || '—'}
                          {r.assetCode && <span className="text-xs text-neutral-500 ml-1">({r.assetCode})</span>}
                        </td>
                        <td className="p-3 text-xs text-neutral-400">{r.type || '—'}</td>
                        <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + priorityStyle(r.priority)}>{r.priority || 'MEDIUM'}</span></td>
                        <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(r.status)}>{r.status || 'OPEN'}</span></td>
                        <td className="p-3 text-xs text-neutral-300">{r.assignedToId || <span className="text-neutral-500 italic">Unassigned</span>}</td>
                        <td className={'p-3 text-xs ' + (overdue ? 'text-red-400 font-bold' : 'text-neutral-400')}>
                          {r.requestedDate ? new Date(r.requestedDate).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center">
                            {r.status === 'OPEN' && (
                              <button onClick={() => patchRequest(r.id, { status: 'IN_PROGRESS' }, 'Started ' + r.number)} disabled={busy === r.id} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Start">
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                            {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
                              <button onClick={() => patchRequest(r.id, { status: 'COMPLETED', completedDate: new Date().toISOString() }, 'Completed ' + r.number)} disabled={busy === r.id} className="p-1.5 rounded-lg bg-green-900/50 text-green-300 hover:bg-green-800" title="Complete">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => pdf(r.id)} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => openEdit(r.id)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                            <button onClick={() => del(r.id, r.number)} disabled={deleting === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                              {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-400" /> {editing ? 'Edit Maintenance Request' : 'New Maintenance Request'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Asset Name *</label>
                <input value={form.assetName} onChange={e => setForm({ ...form, assetName: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Conveyor Belt #3" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Asset Code</label>
                <input value={form.assetCode} onChange={e => setForm({ ...form, assetCode: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. CV-003" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="PREVENTIVE">Preventive</option>
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="PREDICTIVE">Predictive</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Assigned To</label>
                <input value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Technician name" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Scheduled Date</label>
                <input type="date" value={form.requestedDate} onChange={e => setForm({ ...form, requestedDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description *</label>
                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Describe the issue, symptoms, or planned maintenance..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Request'}</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Maintenance Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center flex justify-center gap-2">
                <span className={'inline-block px-4 py-2 rounded-xl text-sm font-bold ' + priorityStyle(detail.request?.priority)}>{detail.request?.priority || 'MEDIUM'}</span>
                <span className={'inline-block px-4 py-2 rounded-xl text-sm font-bold ' + statusStyle(detail.request?.status)}>{detail.request?.status || 'OPEN'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Number', detail.request?.number],
                  ['Asset', detail.request?.assetName],
                  ['Asset Code', detail.request?.assetCode],
                  ['Type', detail.request?.type],
                  ['Assigned To', detail.request?.assignedToId],
                  ['Requested', detail.request?.requestedDate ? new Date(detail.request.requestedDate).toLocaleDateString('en-GB') : '—'],
                  ['Completed', detail.request?.completedDate ? new Date(detail.request.completedDate).toLocaleDateString('en-GB') : '—'],
                  ['Created', detail.request?.createdAt ? new Date(detail.request.createdAt).toLocaleDateString('en-GB') : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.request?.description && (
                <div className="bg-neutral-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Description</div>
                  <div className="text-sm text-white whitespace-pre-wrap">{detail.request.description}</div>
                </div>
              )}
              <button onClick={() => pdf(detail.request.id)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print Maintenance PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}