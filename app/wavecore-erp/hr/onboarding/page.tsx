'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  UserPlus, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Clock, TrendingUp, FileEdit, Sparkles,
} from 'lucide-react'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

const statusStyle = (s: string) => {
  switch (s) {
    case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'IN_PROGRESS': return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
    case 'PENDING': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'CANCELLED': return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function OnboardingPage() {
  const [checklists, setChecklists] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [employees, setEmployees] = useState<any[]>([])
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
    employeeName: '', employeeId: '', startDate: new Date().toISOString().slice(0, 10),
    targetCompletionDate: '', currentStep: '1', totalSteps: '8', status: 'IN_PROGRESS', notes: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [cRes, eRes] = await Promise.all([
        fetch('/api/wavecore/hr/onboarding'),
        fetch('/api/wavecore/hr/employees'),
      ])
      const cData = await cRes.json()
      const eData = await eRes.json()
      setChecklists(cData.checklists || [])
      setSummary(cData.summary || {})
      setEmployees(eData.employees || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    employeeName: '', employeeId: '', startDate: new Date().toISOString().slice(0, 10),
    targetCompletionDate: '', currentStep: '1', totalSteps: '8', status: 'IN_PROGRESS', notes: '',
  })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (c: any) => {
    setForm({
      employeeName: c.employeeName || '', employeeId: c.employeeId || '',
      startDate: c.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      targetCompletionDate: c.targetCompletionDate?.slice(0, 10) || '',
      currentStep: String(c.currentStep || 1), totalSteps: String(c.totalSteps || 8),
      status: c.status || 'IN_PROGRESS', notes: c.notes || '',
    })
    setEditing(c); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.employeeName.trim()) { setError('Employee name required'); return }
    const payload = {
      ...form,
      currentStep: Number(form.currentStep || 1),
      totalSteps: Number(form.totalSteps || 8),
    }
    try {
      const url = editing ? '/api/wavecore/hr/onboarding/' + editing.id : '/api/wavecore/hr/onboarding'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Checklist updated' : 'Onboarding started')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete onboarding checklist for ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/onboarding/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const advance = async (c: any) => {
    const next = Math.min(c.currentStep + 1, c.totalSteps)
    const newStatus = next >= c.totalSteps ? 'COMPLETED' : 'IN_PROGRESS'
    try {
      const res = await fetch('/api/wavecore/hr/onboarding/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStep: next, status: newStatus }),
      })
      if (res.ok) { flash(`Advanced to step ${next}${newStatus === 'COMPLETED' ? ' — COMPLETED!' : ''}`); fetchAll() }
    } catch {}
  }

  const pdf = () => window.open('/api/wavecore/hr/onboarding/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...checklists]
    if (activeKpi === 'IN_PROGRESS') list = list.filter(c => c.status === 'IN_PROGRESS')
    else if (activeKpi === 'COMPLETED') list = list.filter(c => c.status === 'COMPLETED')
    else if (activeKpi === 'PENDING') list = list.filter(c => c.status === 'PENDING')
    if (filterStatus !== 'ALL') list = list.filter(c => c.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c => (c.employeeName || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [checklists, activeKpi, filterStatus, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">HR · Onboarding</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <UserPlus className="w-7 h-7 text-green-400" /> Onboarding
            </h1>
            <p className="text-sm text-neutral-400 mt-1">New hire workflows · Step tracking · Completion</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-green-900/40">
              <Plus className="w-5 h-5" /> Start Onboarding
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-green-300' : '')}>
            <UserPlus className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('IN_PROGRESS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'IN_PROGRESS' ? 'ring-4 ring-cyan-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inProgress || 0}</p><p className="text-xs opacity-90">In Progress</p>
          </button>
          <button onClick={() => setActiveKpi('COMPLETED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'COMPLETED' ? 'ring-4 ring-blue-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.completed || 0}</p><p className="text-xs opacity-90">Completed</p>
          </button>
          <button onClick={() => setActiveKpi('PENDING')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'PENDING' ? 'ring-4 ring-yellow-300' : '')}>
            <Sparkles className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.pending || 0}</p><p className="text-xs opacity-90">Pending</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgProgress || 0}%</p><p className="text-xs opacity-90">Avg Progress</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee name..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{filtered.length} of {checklists.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No onboarding checklists yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Start First Onboarding
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['employeeName','Employee'],['startDate','Start'],['targetCompletionDate','Target'],['currentStep','Step'],['progress','Progress'],['status','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3 text-white font-medium">{c.employeeName}</td>
                      <td className="p-3 text-xs text-neutral-400">{c.startDate ? new Date(c.startDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-xs text-neutral-400">{c.targetCompletionDate ? new Date(c.targetCompletionDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-center text-white text-xs">{c.currentStep}/{c.totalSteps}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-neutral-700 rounded-full h-2">
                            <div className={'h-2 rounded-full ' + (c.progress >= 100 ? 'bg-green-500' : c.progress >= 50 ? 'bg-cyan-500' : 'bg-yellow-500')} style={{ width: Math.min(c.progress, 100) + '%' }}></div>
                          </div>
                          <span className="text-xs text-white font-bold">{c.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(c.status)}>{c.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          {c.status !== 'COMPLETED' && (
                            <button onClick={() => advance(c)} className="p-1.5 rounded-lg bg-green-900/50 text-green-300 hover:bg-green-800" title="Advance step">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(c.id, c.employeeName)} disabled={deleting === c.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
                            {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                <Sparkles className="w-5 h-5 text-green-400" /> {editing ? 'Edit Checklist' : 'Start Onboarding'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-green-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employee Name *</label>
                <input value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Link Employee (optional)</label>
                <select value={form.employeeId} onChange={e => {
                  const emp = employees.find((x: any) => x.id === e.target.value)
                  setForm({ ...form, employeeId: e.target.value, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : form.employeeName })
                }} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">— Not linked —</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Target Completion</label>
                <input type="date" value={form.targetCompletionDate} onChange={e => setForm({ ...form, targetCompletionDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Current Step</label>
                <input type="number" min="0" value={form.currentStep} onChange={e => setForm({ ...form, currentStep: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Total Steps</label>
                <input type="number" min="1" value={form.totalSteps} onChange={e => setForm({ ...form, totalSteps: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">{editing ? 'Save Changes' : 'Start Onboarding'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}