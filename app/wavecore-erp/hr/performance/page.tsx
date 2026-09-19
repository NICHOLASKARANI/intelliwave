'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Award, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Star, TrendingUp, FileEdit, Sparkles, Target,
} from 'lucide-react'

const STATUSES = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const TYPES = ['ANNUAL', 'QUARTERLY', 'MID_YEAR', 'PROBATION', 'PROJECT']

const scoreColor = (s: number) =>
  s >= 4.5 ? 'text-green-400' : s >= 3.5 ? 'text-cyan-400' : s >= 2.5 ? 'text-yellow-400' : 'text-red-400'

const statusStyle = (s: string) => {
  switch (s) {
    case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'IN_PROGRESS': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    case 'DRAFT': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'CANCELLED': return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function PerformancePage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('reviewDate')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const [form, setForm] = useState({
    employeeId: '', reviewPeriod: '', reviewType: 'ANNUAL',
    score: '', selfScore: '', managerScore: '', goalsAchieved: '', goalsTotal: '',
    strengths: '', improvements: '', comments: '', status: 'DRAFT',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [rRes, eRes] = await Promise.all([
        fetch('/api/wavecore/hr/performance'),
        fetch('/api/wavecore/hr/employees'),
      ])
      const rData = await rRes.json()
      const eData = await eRes.json()
      setReviews(rData.reviews || [])
      setSummary(rData.summary || {})
      setEmployees(eData.employees || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    employeeId: '', reviewPeriod: '', reviewType: 'ANNUAL',
    score: '', selfScore: '', managerScore: '', goalsAchieved: '', goalsTotal: '',
    strengths: '', improvements: '', comments: '', status: 'DRAFT',
  })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (r: any) => {
    setForm({
      employeeId: r.employeeId || '', reviewPeriod: r.reviewPeriod || '', reviewType: r.reviewType || 'ANNUAL',
      score: String(r.score || ''), selfScore: String(r.selfScore || ''), managerScore: String(r.managerScore || ''),
      goalsAchieved: String(r.goalsAchieved || ''), goalsTotal: String(r.goalsTotal || ''),
      strengths: r.strengths || '', improvements: r.improvements || '', comments: r.comments || '', status: r.status || 'DRAFT',
    })
    setEditing(r); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.employeeId || !form.reviewPeriod.trim()) { setError('Employee and period required'); return }
    const payload = {
      ...form,
      score: Number(form.score || 0), selfScore: Number(form.selfScore || 0), managerScore: Number(form.managerScore || 0),
      goalsAchieved: Number(form.goalsAchieved || 0), goalsTotal: Number(form.goalsTotal || 0),
    }
    try {
      const url = editing ? '/api/wavecore/hr/performance/' + editing.id : '/api/wavecore/hr/performance'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Review updated' : 'Review created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete performance review for ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/performance/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const pdf = () => window.open('/api/wavecore/hr/performance/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...reviews]
    if (activeKpi === 'COMPLETED') list = list.filter(r => r.status === 'COMPLETED')
    else if (activeKpi === 'DRAFT') list = list.filter(r => r.status === 'DRAFT')
    else if (activeKpi === 'TOP') list = list.filter(r => Number(r.score) >= 4.5)
    else if (activeKpi === 'NEEDS') list = list.filter(r => Number(r.score) > 0 && Number(r.score) < 2.5)
    if (filterStatus !== 'ALL') list = list.filter(r => r.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r =>
        (r.employeeName || '').toLowerCase().includes(s) ||
        (r.reviewPeriod || '').toLowerCase().includes(s) ||
        (r.department || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [reviews, activeKpi, filterStatus, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">HR · Performance</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Award className="w-7 h-7 text-yellow-400" /> Performance Reviews
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Goals · Scores · Ratings · Development plans</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-yellow-900/40">
              <Plus className="w-5 h-5" /> New Review
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-yellow-300' : '')}>
            <Award className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed || 0}</p><p className="text-xs opacity-90">Completed</p>
          </button>
          <button onClick={() => setActiveKpi('DRAFT')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'DRAFT' ? 'ring-4 ring-blue-300' : '')}>
            <FileEdit className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.draft || 0}</p><p className="text-xs opacity-90">Draft</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg">
            <Star className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgScore || 0}</p><p className="text-xs opacity-90">Avg Score</p>
          </div>
          <button onClick={() => setActiveKpi('TOP')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-green-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'TOP' ? 'ring-4 ring-emerald-300' : '')}>
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.outstanding || 0}</p><p className="text-xs opacity-90">Outstanding</p>
          </button>
          <button onClick={() => setActiveKpi('NEEDS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'NEEDS' ? 'ring-4 ring-red-300' : '')}>
            <Target className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.needs || 0}</p><p className="text-xs opacity-90">Needs Impr.</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg">
            <Sparkles className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completionRate || 0}%</p><p className="text-xs opacity-90">Completion</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee, period, department..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{filtered.length} of {reviews.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-yellow-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No performance reviews yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Review
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['employeeName','Employee'],['department','Department'],['reviewPeriod','Period'],['reviewType','Type'],['score','Score'],['goalsAchieved','Goals'],['status','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3 text-white font-medium">{r.employeeName}</td>
                      <td className="p-3 text-xs text-neutral-400">{r.department || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{r.reviewPeriod}</td>
                      <td className="p-3 text-xs text-neutral-400">{r.reviewType}</td>
                      <td className={'p-3 text-right font-bold ' + scoreColor(Number(r.score))}>
                        {Number(r.score) > 0 ? Number(r.score).toFixed(1) : '—'}
                      </td>
                      <td className="p-3 text-center text-xs text-neutral-300">{r.goalsAchieved || 0}/{r.goalsTotal || 0}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(r.status)}>{r.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(r.id, r.employeeName)} disabled={deleting === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
                            {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                <Sparkles className="w-5 h-5 text-yellow-400" /> {editing ? 'Edit Review' : 'New Performance Review'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-yellow-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employee *</label>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">Select employee...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Period *</label>
                <input value={form.reviewPeriod} onChange={e => setForm({ ...form, reviewPeriod: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Q3 2026 / Annual 2026" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Type</label>
                <select value={form.reviewType} onChange={e => setForm({ ...form, reviewType: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Final Score (0-5)</label>
                <input type="number" step="0.1" min="0" max="5" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Self Score (0-5)</label>
                <input type="number" step="0.1" min="0" max="5" value={form.selfScore} onChange={e => setForm({ ...form, selfScore: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Manager Score (0-5)</label>
                <input type="number" step="0.1" min="0" max="5" value={form.managerScore} onChange={e => setForm({ ...form, managerScore: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Goals Achieved</label>
                <input type="number" min="0" value={form.goalsAchieved} onChange={e => setForm({ ...form, goalsAchieved: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Goals Total</label>
                <input type="number" min="0" value={form.goalsTotal} onChange={e => setForm({ ...form, goalsTotal: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Strengths</label>
                <textarea rows={2} value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Areas for Improvement</label>
                <textarea rows={2} value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Comments</label>
                <textarea rows={2} value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Review'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}