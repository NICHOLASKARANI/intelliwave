'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FolderKanban, Download, Loader2, TrendingUp, CheckCircle, Clock,
  Users, Plus, Calendar, GanttChartSquare, Timer, Target, FileText,
  DollarSign, Search, RefreshCw, AlertTriangle, ArrowUpDown, Trash2,
  X, Sparkles, FileEdit, PlayCircle, BarChart3, Briefcase, Zap,
} from 'lucide-react'

const STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

const statusStyle = (s: string, overdue: boolean) => {
  if (overdue) return 'bg-red-900/40 text-red-300 border border-red-700'
  switch (s) {
    case 'ACTIVE': return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
    case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'PLANNING': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'ON_HOLD': return 'bg-orange-900/40 text-orange-300 border border-orange-700'
    case 'CANCELLED': return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
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

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const blank = {
    title: '', description: '', status: 'PLANNING', budget: '',
    currency: 'KES', startDate: '', endDate: '', priority: 'NORMAL', color: '#14b8a6',
  }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/projects')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setProjects(data.projects || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (p: any) => {
    setForm({
      title: p.title || '', description: p.description || '', status: p.status || 'PLANNING',
      budget: String(p.budget || ''), currency: p.currency || 'KES',
      startDate: p.startDate?.slice(0, 10) || '', endDate: p.endDate?.slice(0, 10) || '',
      priority: p.priority || 'NORMAL', color: p.color || '#14b8a6',
    })
    setEditing(p); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title required'); return }
    const payload = { ...form, budget: Number(form.budget || 0) }
    try {
      const url = editing ? '/api/wavecore/projects/' + editing.id : '/api/wavecore/projects'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Project updated' : 'Project created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete project "' + title + '" and all its tasks/milestones?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/projects/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Project deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/projects/' + id)
    const data = await res.json()
    if (data.project) setDetail(data)
  }

  const pdf = () => window.open('/api/wavecore/projects/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...projects]
    if (activeKpi === 'ACTIVE') list = list.filter(p => p.status === 'ACTIVE')
    else if (activeKpi === 'COMPLETED') list = list.filter(p => p.status === 'COMPLETED')
    else if (activeKpi === 'PLANNING') list = list.filter(p => p.status === 'PLANNING')
    else if (activeKpi === 'OVERDUE') list = list.filter(p => p.isOverdue)
    if (filterStatus !== 'ALL') list = list.filter(p => p.status === filterStatus)
    if (filterPriority !== 'ALL') list = list.filter(p => p.priority === filterPriority)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [projects, activeKpi, filterStatus, filterPriority, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  const modules = [
    { name: 'Kanban Board', href: '/wavecore-erp/projects/kanban', icon: GanttChartSquare, color: 'from-blue-500 to-indigo-600', stat: summary.openTasks || 0, sub: 'open tasks' },
    { name: 'Gantt Timeline', href: '/wavecore-erp/projects/gantt', icon: Calendar, color: 'from-purple-500 to-violet-600', stat: summary.total || 0, sub: 'projects' },
    { name: 'Time Tracking', href: '/wavecore-erp/projects/time-tracking', icon: Timer, color: 'from-green-500 to-emerald-600', stat: summary.totalHours || 0, sub: 'hours logged' },
    { name: 'Resources', href: '/wavecore-erp/projects/resources', icon: Users, color: 'from-amber-500 to-orange-600', stat: summary.teamSize || 0, sub: 'team members' },
    { name: 'Tasks', href: '/wavecore-erp/projects/tasks', icon: Target, color: 'from-cyan-500 to-teal-600', stat: summary.totalTasks || 0, sub: 'total tasks' },
    { name: 'Milestones', href: '/wavecore-erp/projects/milestones', icon: Target, color: 'from-pink-500 to-rose-600', stat: 0, sub: 'milestones' },
    { name: 'Budget', href: '/wavecore-erp/projects/budget', icon: DollarSign, color: 'from-emerald-500 to-green-600', stat: summary.totalBudget || 0, sub: 'KES total' },
    { name: 'Reports', href: '/wavecore-erp/projects/reports', icon: FileText, color: 'from-indigo-500 to-blue-600', stat: summary.completionRate || 0, sub: '% complete' },
  ]

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Projects</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 p-6 lg:p-8 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FolderKanban className="w-8 h-8" /> Project Management
              </h1>
              <p className="text-white/80 text-sm">Kanban · Gantt · Time Tracking · Team · Budget</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
              </button>
              <button onClick={pdf} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-teal-700 text-sm font-bold shadow-lg">
                <Plus className="w-4 h-4" /> New Project
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {success}</div>}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-teal-300' : '')}>
            <FolderKanban className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total Projects</p>
          </button>
          <button onClick={() => setActiveKpi('ACTIVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ACTIVE' ? 'ring-4 ring-cyan-300' : '')}>
            <PlayCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.active || 0}</p><p className="text-xs opacity-90">Active</p>
          </button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed || 0}</p><p className="text-xs opacity-90">Completed</p>
          </button>
          <button onClick={() => setActiveKpi('OVERDUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OVERDUE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue || 0}</p><p className="text-xs opacity-90">Overdue</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <BarChart3 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgProgress || 0}%</p><p className="text-xs opacity-90">Avg Progress</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{(summary.totalBudget || 0).toLocaleString()}</p><p className="text-xs opacity-90">Total Budget (KES)</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
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
            <span className="text-xs text-neutral-500">{filtered.length} of {projects.length} shown</span>
          </div>
        </div>

        {/* PROJECTS TABLE */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-teal-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No projects match filters</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Project
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['title','Project'],['status','Status'],['priority','Priority'],['progress','Progress'],['totalTasks','Tasks'],['budget','Budget'],['endDate','Deadline']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3">
                        <button onClick={() => openDetail(p.id)} className="text-white font-medium hover:text-teal-400">{p.title}</button>
                        <br /><span className="text-[10px] text-neutral-500">{p.daysRemaining !== null ? (p.daysRemaining > 0 ? p.daysRemaining + ' days left' : Math.abs(p.daysRemaining) + ' days overdue') : '—'}</span>
                      </td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(p.status, p.isOverdue)}>{p.isOverdue ? 'OVERDUE' : p.status}</span></td>
                      <td className="p-3 text-xs text-neutral-300">{p.priority}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-neutral-700 rounded-full h-2">
                            <div className={'h-2 rounded-full ' + (p.progress >= 100 ? 'bg-green-500' : p.progress >= 50 ? 'bg-cyan-500' : 'bg-yellow-500')} style={{ width: Math.min(p.progress, 100) + '%' }}></div>
                          </div>
                          <span className="text-xs text-white font-bold">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-white text-xs">{p.doneTasks}/{p.totalTasks}</td>
                      <td className="p-3 text-right text-white font-bold">{Number(p.budget).toLocaleString()}</td>
                      <td className="p-3 text-xs text-neutral-400">{p.endDate ? new Date(p.endDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(p.id, p.title)} disabled={deleting === p.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                            {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

        {/* MODULE GRID */}
        <h2 className="text-xl font-bold mb-4 text-white">Project Modules (8)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map(m => {
            const Icon = m.icon
            return (
              <Link key={m.name} href={m.href} className="p-5 rounded-2xl border bg-neutral-900 border-neutral-800 hover:border-teal-600 hover:shadow-2xl transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-sm text-white">{m.name}</p>
                <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between items-center">
                  <span className="text-lg font-extrabold text-white">{typeof m.stat === 'number' ? m.stat.toLocaleString() : m.stat}</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wide">{m.sub}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      {/* CREATE/EDIT MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" /> {editing ? 'Edit Project' : 'New Project'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-teal-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Project Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Q4 Product Launch" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Budget (KES)</label>
                <input type="number" min="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="0" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Currency</label>
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Project'}</button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {detail && detail.project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-5xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-5 border-b border-neutral-800">
              <div>
                <h2 className="text-2xl font-bold text-white">{detail.project.title}</h2>
                <p className="text-sm text-neutral-400 mt-1">{detail.project.status} · {detail.project.priority} · {detail.project.progress}% complete</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-teal-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Tasks" value={`${detail.metrics.doneTasks}/${detail.metrics.totalTasks}`} />
              <StatBox label="Milestones" value={`${detail.metrics.doneMilestones}/${detail.metrics.totalMilestones}`} />
              <StatBox label="Team" value={detail.metrics.teamSize} />
              <StatBox label="Hours Logged" value={detail.metrics.totalHours} />
              <StatBox label="Budget" value={Number(detail.metrics.totalBudget).toLocaleString()} />
              <StatBox label="Spent" value={Number(detail.metrics.totalCost).toLocaleString()} />
              <StatBox label="Variance" value={Number(detail.metrics.budgetVariance).toLocaleString()} />
              <StatBox label="Progress" value={`${detail.project.progress}%`} />
            </div>
            {detail.tasks?.length > 0 && (
              <div className="px-6 pb-6">
                <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wide mb-3">Tasks ({detail.tasks.length})</h3>
                <div className="bg-neutral-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-700">
                      <tr><th className="text-left p-3 text-xs uppercase text-neutral-300">Title</th><th className="text-left p-3 text-xs uppercase text-neutral-300">Status</th><th className="text-right p-3 text-xs uppercase text-neutral-300">Due</th></tr>
                    </thead>
                    <tbody>
                      {detail.tasks.slice(0, 20).map((t: any) => (
                        <tr key={t.id} className="border-t border-neutral-700">
                          <td className="p-3 text-white">{t.title}</td>
                          <td className="p-3"><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-cyan-900/40 text-cyan-300">{t.status}</span></td>
                          <td className="p-3 text-right text-neutral-400 text-xs">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-xl bg-neutral-800">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">{label}</p>
      <p className="text-lg font-bold text-white mt-1">{value}</p>
    </div>
  )
}