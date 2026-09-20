'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Target, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  AlertTriangle, ArrowUpDown, FileEdit, Sparkles, Clock, Calendar,
} from 'lucide-react'

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('ALL')
  const [sortBy, setSortBy] = useState('dueDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [toggling, setToggling] = useState('')

  const blank = { title: '', description: '', projectId: '', dueDate: '', completed: false }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        fetch('/api/wavecore/projects/milestones'),
        fetch('/api/wavecore/projects'),
      ])
      const mData = await mRes.json()
      const pData = await pRes.json()
      setMilestones(mData.milestones || [])
      setSummary(mData.summary || {})
      setProjects(pData.projects || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (m: any) => {
    setForm({
      title: m.title || '', description: m.description || '', projectId: m.projectId || '',
      dueDate: m.dueDate?.slice(0, 10) || '', completed: Boolean(m.completed),
    })
    setEditing(m); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title required'); return }
    if (!form.projectId) { setError('Project required'); return }
    if (!form.dueDate) { setError('Due date required'); return }
    try {
      const url = editing ? '/api/wavecore/projects/milestones/' + editing.id : '/api/wavecore/projects/milestones'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Milestone updated' : 'Milestone created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const toggle = async (m: any) => {
    setToggling(m.id)
    setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, completed: !m.completed } : x))
    try {
      await fetch('/api/wavecore/projects/milestones/' + m.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !m.completed }),
      })
      flash(m.completed ? 'Marked pending' : 'Marked complete')
      fetchAll()
    } finally { setToggling('') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete milestone "' + title + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/projects/milestones/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Milestone deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const filtered = useMemo(() => {
    let list = [...milestones]
    if (activeKpi === 'PENDING') list = list.filter(m => !m.completed)
    else if (activeKpi === 'COMPLETED') list = list.filter(m => m.completed)
    else if (activeKpi === 'OVERDUE') list = list.filter(m => m.isOverdue)
    if (filterProject !== 'ALL') list = list.filter(m => m.projectId === filterProject)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(m => (m.title || '').toLowerCase().includes(s) || (m.description || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [milestones, activeKpi, filterProject, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">Projects · Milestones</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Target className="w-7 h-7 text-pink-400" /> Milestones
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Key project checkpoints · Click to toggle completion</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-pink-900/40">
              <Plus className="w-5 h-5" /> New Milestone
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-pink-300' : '')}>
            <Target className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('PENDING')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'PENDING' ? 'ring-4 ring-yellow-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.pending || 0}</p><p className="text-xs opacity-90">Pending</p>
          </button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed || 0}</p><p className="text-xs opacity-90">Completed</p>
          </button>
          <button onClick={() => setActiveKpi('OVERDUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OVERDUE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overdue || 0}</p><p className="text-xs opacity-90">Overdue</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completionRate || 0}%</p><p className="text-xs opacity-90">Completion</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search milestones..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No milestones yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Milestone
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['title','Milestone'],['projectId','Project'],['dueDate','Due Date'],['completed','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3">
                        <button onClick={() => toggle(m)} disabled={toggling === m.id} className="flex items-center gap-2 text-left hover:opacity-80">
                          {m.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-600 flex-shrink-0"></div>
                          )}
                          <span className={'font-medium ' + (m.completed ? 'text-neutral-500 line-through' : 'text-white')}>{m.title}</span>
                        </button>
                        {m.description && <p className="text-xs text-neutral-500 mt-1 ml-7">{m.description}</p>}
                      </td>
                      <td className="p-3 text-xs text-neutral-400">{projectName(m.projectId)}</td>
                      <td className="p-3">
                        <span className={'text-xs flex items-center gap-1 ' + (m.isOverdue ? 'text-red-400 font-bold' : 'text-neutral-400')}>
                          <Calendar className="w-3 h-3" /> {m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-GB') : '—'}
                          {m.daysUntil !== null && !m.completed && <span className="text-[10px]">({m.daysUntil > 0 ? `${m.daysUntil}d` : `${Math.abs(m.daysUntil)}d overdue`})</span>}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={'px-2 py-1 rounded-full text-[10px] font-bold border ' + (m.completed ? 'bg-green-900/40 text-green-300 border-green-700' : m.isOverdue ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-yellow-900/40 text-yellow-300 border-yellow-700')}>
                          {m.completed ? 'COMPLETED' : m.isOverdue ? 'OVERDUE' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(m.id, m.title)} disabled={deleting === m.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
                            {deleting === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" /> {editing ? 'Edit Milestone' : 'New Milestone'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-pink-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Project *</label>
                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              {editing && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.completed} onChange={e => setForm({ ...form, completed: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm text-white">Mark as completed</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Milestone'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}