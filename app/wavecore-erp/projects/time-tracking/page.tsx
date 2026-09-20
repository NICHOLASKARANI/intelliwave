'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Timer, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  ArrowUpDown, FileEdit, Sparkles, Clock, DollarSign, TrendingUp,
} from 'lucide-react'

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('ALL')
  const [sortBy, setSortBy] = useState('entryDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const blank = { projectId: '', taskId: '', hours: '', description: '', entryDate: new Date().toISOString().slice(0, 10), billable: true, employeeName: '' }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [eRes, pRes, tRes] = await Promise.all([
        fetch('/api/wavecore/projects/time-entries'),
        fetch('/api/wavecore/projects'),
        fetch('/api/wavecore/projects/tasks'),
      ])
      const eData = await eRes.json()
      const pData = await pRes.json()
      const tData = await tRes.json()
      setEntries(eData.entries || [])
      setSummary(eData.summary || {})
      setProjects(pData.projects || [])
      setTasks(tData.tasks || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (e: any) => {
    setForm({
      projectId: e.projectId || '', taskId: e.taskId || '', hours: String(e.hours || ''),
      description: e.description || '', entryDate: e.entryDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      billable: Boolean(e.billable), employeeName: e.employeeName || '',
    })
    setEditing(e); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.projectId) { setError('Project required'); return }
    const hours = Number(form.hours || 0)
    if (hours <= 0 || hours > 24) { setError('Hours must be 1-24'); return }
    try {
      const url = editing ? '/api/wavecore/projects/time-entries/' + editing.id : '/api/wavecore/projects/time-entries'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hours }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Entry updated' : 'Time logged')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete time entry for ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/projects/time-entries/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Entry deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const filtered = useMemo(() => {
    let list = [...entries]
    if (filterProject !== 'ALL') list = list.filter(e => e.projectId === filterProject)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(e => (e.description || '').toLowerCase().includes(s) || (e.employeeName || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [entries, filterProject, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  const projectName = (id: string) => projects.find(p => p.id === id)?.title || '—'
  const taskName = (id: string) => tasks.find(t => t.id === id)?.title || '—'
  const projectTasks = form.projectId ? tasks.filter(t => t.projectId === form.projectId) : []

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Projects · Time Tracking</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Timer className="w-7 h-7 text-green-400" /> Time Tracking
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Log hours per task · Billable vs non-billable</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-green-900/40">
              <Plus className="w-5 h-5" /> Log Time
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg">
            <Timer className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalHours || 0}</p><p className="text-xs opacity-90">Total Hours</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Entries</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.billableHours || 0}</p><p className="text-xs opacity-90">Billable Hours</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgHoursPerEntry || 0}</p><p className="text-xs opacity-90">Avg / Entry</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by description or employee..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Timer className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No time entries yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Log First Entry
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['entryDate','Date'],['employeeName','Employee'],['projectId','Project'],['taskId','Task'],['description','Description'],['hours','Hours'],['billable','Billable']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3 text-xs text-neutral-400">{e.entryDate ? new Date(e.entryDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-white">{e.employeeName || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{projectName(e.projectId)}</td>
                      <td className="p-3 text-xs text-neutral-400">{e.taskId ? taskName(e.taskId) : '—'}</td>
                      <td className="p-3 text-xs text-neutral-400 max-w-[200px] truncate">{e.description || '—'}</td>
                      <td className="p-3 text-right text-white font-bold">{e.hours}h</td>
                      <td className="p-3 text-center">
                        <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (e.billable ? 'bg-green-900/40 text-green-300' : 'bg-neutral-800 text-neutral-400')}>
                          {e.billable ? 'BILLABLE' : 'NON-BILL'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(e.id, e.employeeName || 'entry')} disabled={deleting === e.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
                            {deleting === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                <Sparkles className="w-5 h-5 text-green-400" /> {editing ? 'Edit Time Entry' : 'Log Time'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-green-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Project *</label>
                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, taskId: '' })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Task (optional)</label>
                <select value={form.taskId} onChange={e => setForm({ ...form, taskId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">— Not linked —</option>
                  {projectTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Hours *</label>
                  <input type="number" min="0.25" max="24" step="0.25" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Date</label>
                  <input type="date" value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employee Name</label>
                <input value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Your name" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.billable} onChange={e => setForm({ ...form, billable: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm text-white">Billable hours</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">{editing ? 'Save Changes' : 'Log Time'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}