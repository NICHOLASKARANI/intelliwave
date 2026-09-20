'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  GanttChartSquare, Loader2, Plus, Trash2, X, RefreshCw, Search,
  CheckCircle2, Clock, AlertTriangle, ArrowUpDown, FileEdit, Sparkles,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'border-neutral-500', bg: 'bg-neutral-800/40', text: 'text-neutral-300' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-cyan-500', bg: 'bg-cyan-900/20', text: 'text-cyan-300' },
  { key: 'REVIEW', label: 'Review', color: 'border-yellow-500', bg: 'bg-yellow-900/20', text: 'text-yellow-300' },
  { key: 'BLOCKED', label: 'Blocked', color: 'border-red-500', bg: 'bg-red-900/20', text: 'text-red-300' },
  { key: 'DONE', label: 'Done', color: 'border-green-500', bg: 'bg-green-900/20', text: 'text-green-300' },
]

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

const priorityStyle = (p: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-900/40 text-red-300 border-red-700'
    case 'HIGH': return 'bg-orange-900/40 text-orange-300 border-orange-700'
    case 'NORMAL': return 'bg-blue-900/40 text-blue-300 border-blue-700'
    case 'LOW': return 'bg-neutral-800 text-neutral-400 border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-400'
  }
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('ALL')
  const [dragging, setDragging] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [moving, setMoving] = useState('')

  const blank = {
    title: '', description: '', projectId: '', status: 'TODO',
    priority: 'NORMAL', dueDate: '', estimatedHours: '', assigneeId: '',
  }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    setError('')
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
    const payload = { ...form, estimatedHours: Number(form.estimatedHours || 0) }
    try {
      const url = editing ? '/api/wavecore/projects/tasks/' + editing.id : '/api/wavecore/projects/tasks'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Task updated' : 'Task created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete task "' + title + '"?')) return
    try {
      const res = await fetch('/api/wavecore/projects/tasks/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Task deleted'); fetchAll() }
    } catch {}
  }

  // DRAG-DROP: move task to new column
  const moveTask = async (taskId: string, newStatus: string) => {
    setMoving(taskId)
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    try {
      const res = await fetch('/api/wavecore/projects/tasks/' + taskId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) { flash('Moved to ' + newStatus); fetchAll() }
      else { fetchAll() }
    } catch { fetchAll() }
    finally { setMoving('') }
  }

  const filtered = useMemo(() => {
    let list = [...tasks]
    if (filterProject !== 'ALL') list = list.filter(t => t.projectId === filterProject)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t => (t.title || '').toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s))
    }
    return list
  }, [tasks, filterProject, search])

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {}
    for (const c of COLUMNS) g[c.key] = []
    for (const t of filtered) {
      const k = t.status || 'TODO'
      if (!g[k]) g[k] = []
      g[k].push(t)
    }
    return g
  }, [filtered])

  const projectName = (id: string) => projects.find(p => p.id === id)?.title || '—'

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Projects · Kanban Board</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <GanttChartSquare className="w-7 h-7 text-blue-400" /> Kanban Board
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Drag & drop tasks between columns · {tasks.length} total</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40">
              <Plus className="w-5 h-5" /> New Task
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* FILTERS */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {/* KANBAN COLUMNS */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {COLUMNS.map(col => {
              const colTasks = grouped[col.key] || []
              return (
                <div
                  key={col.key}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    if (dragging) { moveTask(dragging, col.key); setDragging(null) }
                  }}
                  className={`rounded-2xl border-2 ${col.color} ${col.bg} p-3 min-h-[500px]`}
                >
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className={`text-xs uppercase tracking-wide font-bold ${col.text}`}>{col.label}</h3>
                    <span className="text-xs text-neutral-400 font-bold bg-neutral-800/60 rounded-full px-2 py-0.5">{colTasks.length}</span>
                  </div>

                  <div className="space-y-2">
                    {colTasks.map(t => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setDragging(t.id)}
                        onDragEnd={() => setDragging(null)}
                        className={`bg-neutral-900 rounded-xl border border-neutral-800 p-3 cursor-grab hover:border-blue-600 transition-all ${dragging === t.id ? 'opacity-50' : ''} ${moving === t.id ? 'animate-pulse' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <p className="text-sm font-bold text-white leading-snug flex-1">{t.title}</p>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(t)} className="p-1 rounded bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800">
                              <FileEdit className="w-3 h-3" />
                            </button>
                            <button onClick={() => del(t.id, t.title)} className="p-1 rounded bg-red-900/40 text-red-300 hover:bg-red-800">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-500 mb-2 truncate">{projectName(t.projectId)}</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${priorityStyle(t.priority)}`}>{t.priority}</span>
                          {t.dueDate && (
                            <span className={`text-[10px] font-bold ${t.isOverdue ? 'text-red-400' : 'text-neutral-500'}`}>
                              {new Date(t.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {t.estimatedHours > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-neutral-500">
                            <Clock className="w-3 h-3" /> {t.actualHours || 0}/{t.estimatedHours}h
                          </div>
                        )}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="text-center py-8 text-[11px] text-neutral-600 border border-dashed border-neutral-800 rounded-xl">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" /> {editing ? 'Edit Task' : 'New Task'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-blue-400"><X className="w-5 h-5" /></button>
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
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
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
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Assignee</label>
                <input value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Employee name or ID" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Task'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}