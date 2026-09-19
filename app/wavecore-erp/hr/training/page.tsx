'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  GraduationCap, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Users, TrendingUp, FileEdit, Sparkles, Clock, DollarSign,
} from 'lucide-react'

const STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const statusStyle = (s: string) => {
  switch (s) {
    case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'IN_PROGRESS': return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
    case 'PLANNED': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'CANCELLED': return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('startDate')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const [form, setForm] = useState({
    title: '', category: '', provider: '', trainer: '', description: '',
    startDate: '', endDate: '', durationHours: '', costPerAttendee: '',
    maxAttendees: '', enrolledCount: '', status: 'PLANNED',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/training')
      const data = await res.json()
      setTrainings(data.trainings || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    title: '', category: '', provider: '', trainer: '', description: '',
    startDate: '', endDate: '', durationHours: '', costPerAttendee: '',
    maxAttendees: '', enrolledCount: '', status: 'PLANNED',
  })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (t: any) => {
    setForm({
      title: t.title || '', category: t.category || '', provider: t.provider || '', trainer: t.trainer || '',
      description: t.description || '', startDate: t.startDate?.slice(0, 10) || '', endDate: t.endDate?.slice(0, 10) || '',
      durationHours: String(t.durationHours || ''), costPerAttendee: String(t.costPerAttendee || ''),
      maxAttendees: String(t.maxAttendees || ''), enrolledCount: String(t.enrolledCount || ''), status: t.status || 'PLANNED',
    })
    setEditing(t); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title required'); return }
    const payload = {
      ...form,
      durationHours: Number(form.durationHours || 0), costPerAttendee: Number(form.costPerAttendee || 0),
      maxAttendees: Number(form.maxAttendees || 0), enrolledCount: Number(form.enrolledCount || 0),
    }
    try {
      const url = editing ? '/api/wavecore/hr/training/' + editing.id : '/api/wavecore/hr/training'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Training updated' : 'Training program created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete "' + title + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/training/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const pdf = () => window.open('/api/wavecore/hr/training/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...trainings]
    if (activeKpi === 'ACTIVE') list = list.filter(t => t.status === 'IN_PROGRESS')
    else if (activeKpi === 'PLANNED') list = list.filter(t => t.status === 'PLANNED')
    else if (activeKpi === 'COMPLETED') list = list.filter(t => t.status === 'COMPLETED')
    if (filterStatus !== 'ALL') list = list.filter(t => t.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(t =>
        (t.title || '').toLowerCase().includes(s) ||
        (t.provider || '').toLowerCase().includes(s) ||
        (t.trainer || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [trainings, activeKpi, filterStatus, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">HR · Training</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <GraduationCap className="w-7 h-7 text-violet-400" /> Training & Development
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Programs · Enrolment · Certifications · Learning paths</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-violet-900/40">
              <Plus className="w-5 h-5" /> New Program
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-violet-300' : '')}>
            <GraduationCap className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Programs</p>
          </button>
          <button onClick={() => setActiveKpi('ACTIVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ACTIVE' ? 'ring-4 ring-cyan-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.active || 0}</p><p className="text-xs opacity-90">Active</p>
          </button>
          <button onClick={() => setActiveKpi('PLANNED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'PLANNED' ? 'ring-4 ring-yellow-300' : '')}>
            <Sparkles className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.planned || 0}</p><p className="text-xs opacity-90">Planned</p>
          </button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed || 0}</p><p className="text-xs opacity-90">Completed</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
            <Users className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalEnrolled || 0}</p><p className="text-xs opacity-90">Enrolled</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-fuchsia-600 to-pink-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalCost || 0}</p><p className="text-xs opacity-90">Total Cost</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, provider, trainer..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{filtered.length} of {trainings.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-violet-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No training programs yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Program
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['title','Title'],['category','Category'],['provider','Provider'],['trainer','Trainer'],['startDate','Start'],['enrolledCount','Enrolled'],['fillRate','Fill %'],['status','Status']].map(([f,label]) => (
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
                      <td className="p-3 text-xs text-neutral-400">{t.category || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{t.provider || '—'}</td>
                      <td className="p-3 text-xs text-neutral-400">{t.trainer || '—'}</td>
                      <td className="p-3 text-xs text-neutral-400">{t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-right text-white">{t.enrolledCount}/{t.maxAttendees || '—'}</td>
                      <td className="p-3 text-center">
                        <span className={'text-xs font-bold ' + (t.fillRate >= 90 ? 'text-red-400' : t.fillRate >= 60 ? 'text-yellow-400' : 'text-green-400')}>{t.fillRate}%</span>
                      </td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(t.status)}>{t.status}</span></td>
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
                <Sparkles className="w-5 h-5 text-violet-400" /> {editing ? 'Edit Program' : 'New Training Program'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-violet-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Advanced React Workshop" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Category</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Technical" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Provider</label>
                <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Udemy / Internal" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Trainer</label>
                <input value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Duration (hours)</label>
                <input type="number" step="0.5" value={form.durationHours} onChange={e => setForm({ ...form, durationHours: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Cost Per Attendee</label>
                <input type="number" min="0" step="100" value={form.costPerAttendee} onChange={e => setForm({ ...form, costPerAttendee: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Max Attendees</label>
                <input type="number" min="0" value={form.maxAttendees} onChange={e => setForm({ ...form, maxAttendees: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Enrolled Count</label>
                <input type="number" min="0" value={form.enrolledCount} onChange={e => setForm({ ...form, enrolledCount: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Program'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}