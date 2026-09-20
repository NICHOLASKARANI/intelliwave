'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Target, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  AlertTriangle, ArrowUpDown, FileEdit, Sparkles, Clock, Printer, Download,
} from 'lucide-react'

const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE']
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

const statusStyle = (s: string, overdue: boolean) => {
  if (overdue) return 'bg-red-900/40 text-red-300 border-red-700'
  switch (s) {
    case 'DONE': return 'bg-green-900/40 text-green-300 border-green-700'
    case 'IN_PROGRESS': return 'bg-cyan-900/40 text-cyan-300 border-cyan-700'
    case 'REVIEW': return 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
    case 'BLOCKED': return 'bg-red-900/40 text-red-300 border-red-700'
    default: return 'bg-neutral-800 text-neutral-300 border-neutral-700'
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterProject, setFilterProject] = useState('ALL')
  const [sortBy, setSortBy] = useState('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const blank = { title: '', description: '', projectId: '', status: 'TODO', priority: 'NORMAL', dueDate: '', estimatedHours: '', assigneeId: '' }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/wavecore/projects/tasks'),
        fetch('/api/wavecore/projects'),
      ])
      const tData = await tRes.json()
      const pData = await pRes.json()
      setTasks(tData.tasks || [])
      setSummary(tData.summary || {})
      setProjects(pData.projects || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (t: any) => {
    setForm({
      title: t.title || '', description: t.description || '', projectId: t.projectId || '',
      status: t.status || 'TODO', priority: t.priority || 'NORMAL',
      dueDate: t.dueDate?.slice(0, 10) || '', estimatedHours: String(t.estimatedHours || ''),
      assigneeId: t.assigneeId || '',
    })
    setEditing(t); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title required'); return }
    if (!form.projectId) { setError('Project required'); return }
    try {
      const url = editing ? '/api/wavecore/projects/tasks/' + editing.id : '/api/wavecore/projects/tasks'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, estimatedHours: Number(form.estimatedHours || 0) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Task updated' : 'Task created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete task "' + title + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/projects/tasks/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Task deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const pdf = () => window.open('/api/wavecore/projects/tasks/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...tasks]
    if (activeKpi === 'DONE') list = list.filter(t => t.status === 'DONE')
    else if (activeKpi === 'OPEN') list = list.filter(t => t.status !== 'DONE')
    else if (activeKpi === 'OVERDUE') list = list.filter(t => t.isOverdue)
    else if (activeKpi === 'IN_PROGRESS') list = list.filter(t => t.status === 'IN_PROGRESS')
    if (filterStatus !== 'ALL') list = list.filter(t => t.status === filterStatus)
    if (filterProject !== 'ALL') list = list.filter(t => t.projectId === filterProject)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t => (t.title || '').toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [tasks, activeKpi, filterStatus, filterProject, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }

  const projectName = (id: string) => projects.find(p => p.id === id)?.title || '—'

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Projects · Tasks</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Target className="w-7 h-7 text-cyan-400" /> All Tasks
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Full task list · Sortable · Filterable · PDF export</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/40">
              <Plus className="w-5 h-5" /> New Task
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-cyan-300' : '')}>
            <Target className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total Tasks</p>
          </button>
          <button onClick={() => setActiveKpi('OPEN')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OPEN' ? 'ring-4 ring-yellow-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{(summary.todo || 0) + (summary.inProgress || 0) + (summary.review || 0) + (summary.blocked || 0)}</p><p className="text-xs opacity-90">Open</p>
          </button>
          <button onClick={() => setActiveKpi('IN_PROGRESS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'IN_PROGRESS' ? 'ring-4 ring-blue-300' : '')}>
            <Target className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inProgress || 0}</p><p className="text-xs opacity-90">In Progress</p>
          </button>
          <button onClick={() => setActiveKpi('DONE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'DONE' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.done || 0}</p><p className="text-xs opacity-90">Done</p>
          </button>
          <button onClick={() => setActiveKpi('OVERDUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OVERDUE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue || 0}</p><p className="text-xs opacity-90">Overdue</p>
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No tasks match filters</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Task
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['title','Task'],['projectId','Project'],['assigneeId','Assignee'],['priority','Priority'],['dueDate','Due'],['estimatedHours','Est'],['status','Status']].map(([f,label]) => (
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
                      <td className="p-3 text-white font-medium">{t.title}</td>
                      <td className="p-3 text-xs text-neutral-400">{projectName(t.projectId)}</td>
                      <td className="p-3 text-xs text-neutral-400">{t.assigneeId || '—'}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(t.priority, false)}>{t.priority}</span></td>
                      <td className={'p-3 text-xs ' + (t.isOverdue ? 'text-red-400 font-bold' : 'text-neutral-400')}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-right text-neutral-300 text-xs">{t.estimatedHours || '—'}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(t.status, t.isOverdue)}>{t.isOverdue ? 'OVERDUE' : t.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(t.id, t.title)} disabled={deleting === t.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> {editing ? 'Edit Task' : 'New Task'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-cyan-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Project *</label>
                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">Select...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
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
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Estimated Hours</label>
                <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Assignee</label>
                <input value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Employee name or ID" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Task'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}