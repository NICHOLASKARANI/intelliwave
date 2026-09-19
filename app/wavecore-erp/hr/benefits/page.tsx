'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Heart, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Users, DollarSign, TrendingUp, FileEdit, Sparkles, Building2,
} from 'lucide-react'

const STATUSES = ['ACTIVE', 'INACTIVE', 'DRAFT']

const statusStyle = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'INACTIVE': return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
    case 'DRAFT': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const [form, setForm] = useState({
    name: '', category: '', provider: '', description: '', eligibility: '',
    employerContribution: '', employeeContribution: '', enrolledCount: '', status: 'ACTIVE',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/benefits')
      const data = await res.json()
      setBenefits(data.benefits || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    name: '', category: '', provider: '', description: '', eligibility: '',
    employerContribution: '', employeeContribution: '', enrolledCount: '', status: 'ACTIVE',
  })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (b: any) => {
    setForm({
      name: b.name || '', category: b.category || '', provider: b.provider || '',
      description: b.description || '', eligibility: b.eligibility || '',
      employerContribution: String(b.employerContribution || ''),
      employeeContribution: String(b.employeeContribution || ''),
      enrolledCount: String(b.enrolledCount || ''), status: b.status || 'ACTIVE',
    })
    setEditing(b); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name required'); return }
    const payload = {
      ...form,
      employerContribution: Number(form.employerContribution || 0),
      employeeContribution: Number(form.employeeContribution || 0),
      enrolledCount: Number(form.enrolledCount || 0),
    }
    try {
      const url = editing ? '/api/wavecore/hr/benefits/' + editing.id : '/api/wavecore/hr/benefits'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Benefit updated' : 'Benefit created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete benefit program "' + name + '"?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/benefits/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const pdf = () => window.open('/api/wavecore/hr/benefits/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...benefits]
    if (activeKpi === 'ACTIVE') list = list.filter(b => b.status === 'ACTIVE')
    else if (activeKpi === 'INACTIVE') list = list.filter(b => b.status !== 'ACTIVE')
    else if (activeKpi === 'HIGH_ENROLL') list = list.filter(b => b.enrolledCount > 0).sort((a, b) => b.enrolledCount - a.enrolledCount)
    if (filterStatus !== 'ALL') list = list.filter(b => b.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(b =>
        (b.name || '').toLowerCase().includes(s) ||
        (b.provider || '').toLowerCase().includes(s) ||
        (b.category || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [benefits, activeKpi, filterStatus, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">HR · Benefits</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Heart className="w-7 h-7 text-pink-400" /> Benefits Administration
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Health · Pension · Wellness · Allowances</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-pink-900/40">
              <Plus className="w-5 h-5" /> New Benefit
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-pink-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-pink-300' : '')}>
            <Heart className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Programs</p>
          </button>
          <button onClick={() => setActiveKpi('ACTIVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ACTIVE' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.active || 0}</p><p className="text-xs opacity-90">Active</p>
          </button>
          <button onClick={() => setActiveKpi('HIGH_ENROLL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'HIGH_ENROLL' ? 'ring-4 ring-indigo-300' : '')}>
            <Users className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalEnrolled || 0}</p><p className="text-xs opacity-90">Enrolled</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalMonthlyEmployerCost || 0}</p><p className="text-xs opacity-90">Employer Cost</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgEmployerCostPerEmployee || 0}</p><p className="text-xs opacity-90">Avg / Emp</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white shadow-lg">
            <Building2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.providers || 0}</p><p className="text-xs opacity-90">Providers</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, provider or category..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{filtered.length} of {benefits.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No benefit programs yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Benefit
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['name','Program'],['category','Category'],['provider','Provider'],['enrolledCount','Enrolled'],['employerContribution','Employer'],['employeeContribution','Employee'],['monthlyEmployerCost','Monthly Cost'],['status','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3 text-white font-medium">{b.name}</td>
                      <td className="p-3 text-xs text-neutral-400">{b.category || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{b.provider || '—'}</td>
                      <td className="p-3 text-right text-white">{b.enrolledCount}</td>
                      <td className="p-3 text-right text-red-400">{b.employerContribution.toLocaleString()}</td>
                      <td className="p-3 text-right text-cyan-400">{b.employeeContribution.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-400 font-bold">{b.monthlyEmployerCost.toLocaleString()}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(b.status)}>{b.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(b.id, b.name)} disabled={deleting === b.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
                            {deleting === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                <Sparkles className="w-5 h-5 text-pink-400" /> {editing ? 'Edit Benefit' : 'New Benefit Program'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-pink-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Program Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Health Insurance" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Category</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Health / Pension / Wellness" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Provider</label>
                <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. AAR / NSSF" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employer Contribution (KSh)</label>
                <input type="number" min="0" step="100" value={form.employerContribution} onChange={e => setForm({ ...form, employerContribution: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employee Contribution (KSh)</label>
                <input type="number" min="0" step="100" value={form.employeeContribution} onChange={e => setForm({ ...form, employeeContribution: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
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
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Eligibility</label>
                <input value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. All permanent employees after 3 months" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Benefit'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}