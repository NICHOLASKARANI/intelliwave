'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Users, DollarSign, TrendingUp, AlertTriangle, FileEdit, Sparkles, User,
} from 'lucide-react'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const [form, setForm] = useState({
    name: '', code: '', head: '', costCenter: '', location: '',
    budgetAmount: '', description: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/departments')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); setDepartments([]) }
      else { setDepartments(data.departments || []); setSummary(data.summary || {}) }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({ name: '', code: '', head: '', costCenter: '', location: '', budgetAmount: '', description: '' })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (d: any) => {
    setForm({
      name: d.name || '', code: d.code || '', head: d.head || '',
      costCenter: d.costCenter || '', location: d.location || '',
      budgetAmount: String(d.budgetAmount || ''), description: d.description || '',
    })
    setEditing(d)
    setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Department name is required'); return }

    const payload = { ...form, budgetAmount: Number(form.budgetAmount || 0) }
    try {
      const url = editing ? '/api/wavecore/hr/departments/' + editing.id : '/api/wavecore/hr/departments'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Department updated' : 'Department created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete department "' + name + '"? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/departments/' + id, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Department deleted'); fetchAll()
    } finally { setDeleting('') }
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/hr/departments/' + id)
    const data = await res.json()
    if (data.department) setDetail(data)
  }

  const pdf = () => window.open('/api/wavecore/hr/departments/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...departments]
    if (activeKpi === 'OVER_BUDGET') list = list.filter(d => Number(d.budgetAmount || 0) > 0 && d.annualCost > Number(d.budgetAmount))
    else if (activeKpi === 'HAS_HEAD') list = list.filter(d => d.head && d.head.trim())
    else if (activeKpi === 'EMPTY') list = list.filter(d => d.employeeCount === 0)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(d =>
        (d.name || '').toLowerCase().includes(s) ||
        (d.code || '').toLowerCase().includes(s) ||
        (d.head || '').toLowerCase().includes(s) ||
        (d.costCenter || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [departments, activeKpi, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">HR · Departments</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Building2 className="w-7 h-7 text-indigo-400" /> Departments
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Organisation structure · Budget tracking · Cost centres</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40">
              <Plus className="w-5 h-5" /> New Department
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-indigo-300' : '')}>
            <Building2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Departments</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-cyan-800 text-white shadow-lg">
            <Users className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalEmployees || 0}</p><p className="text-xs opacity-90">Employees</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalBudget || 0}</p><p className="text-xs opacity-90">Budget</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalMonthlyCost || 0}</p><p className="text-xs opacity-90">Monthly Cost</p>
          </div>
          <button onClick={() => setActiveKpi('OVER_BUDGET')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OVER_BUDGET' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overBudget || 0}</p><p className="text-xs opacity-90">Over Budget</p>
          </button>
          <button onClick={() => setActiveKpi('HAS_HEAD')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'HAS_HEAD' ? 'ring-4 ring-amber-300' : '')}>
            <User className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.withHead || 0}</p><p className="text-xs opacity-90">With Head</p>
          </button>
          <button onClick={() => setActiveKpi('EMPTY')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-slate-600 to-neutral-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'EMPTY' ? 'ring-4 ring-slate-300' : '')}>
            <Sparkles className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total - (summary.totalEmployees > 0 ? (departments.filter(d => d.employeeCount > 0).length) : summary.total) || 0}</p><p className="text-xs opacity-90">Empty</p>
          </button>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, head or cost centre..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <span className="text-xs text-neutral-500">{filtered.length} of {departments.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No departments yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Department
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['name','Department'],['code','Code'],['head','Head'],['employeeCount','Employees'],['budgetAmount','Budget'],['annualCost','Annual Cost'],['location','Location']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const budget = Number(d.budgetAmount || 0)
                    const over = budget > 0 && d.annualCost > budget
                    return (
                      <tr key={d.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                        <td className="p-3">
                          <button onClick={() => openDetail(d.id)} className="text-white font-medium hover:text-indigo-400">{d.name}</button>
                        </td>
                        <td className="p-3 font-mono text-xs text-neutral-400">{d.code || '—'}</td>
                        <td className="p-3 text-neutral-300">{d.head || '—'}</td>
                        <td className="p-3 text-right text-white">{d.employeeCount || 0}</td>
                        <td className="p-3 text-right text-neutral-300">{budget > 0 ? budget.toLocaleString() : '—'}</td>
                        <td className={'p-3 text-right font-bold ' + (over ? 'text-red-400' : 'text-emerald-400')}>
                          {d.annualCost ? d.annualCost.toLocaleString() : '—'}
                        </td>
                        <td className="p-3 text-xs text-neutral-400">{d.location || '—'}</td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                            <button onClick={() => del(d.id, d.name)} disabled={deleting === d.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                              {deleting === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                <Sparkles className="w-5 h-5 text-indigo-400" /> {editing ? 'Edit Department' : 'New Department'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-indigo-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Department Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. ENG" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Head / Manager</label>
                <input value={form.head} onChange={e => setForm({ ...form, head: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Cost Centre</label>
                <input value={form.costCenter} onChange={e => setForm({ ...form, costCenter: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. CC-100" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Nairobi HQ" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Annual Budget</label>
                <input type="number" min="0" step="1000" value={form.budgetAmount} onChange={e => setForm({ ...form, budgetAmount: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="0" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Optional" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Department'}</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" /> {detail.department?.name}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">{detail.department?.code || '—'} · {detail.department?.location || 'No location'}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-indigo-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-neutral-800">
                  <p className="text-xs text-neutral-400 mb-1">Head</p>
                  <p className="text-white font-bold">{detail.department?.head || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800">
                  <p className="text-xs text-neutral-400 mb-1">Cost Centre</p>
                  <p className="text-white font-bold">{detail.department?.costCenter || '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800">
                  <p className="text-xs text-neutral-400 mb-1">Budget</p>
                  <p className="text-white font-bold">{Number(detail.department?.budgetAmount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800">
                  <p className="text-xs text-neutral-400 mb-1">Employees</p>
                  <p className="text-white font-bold">{detail.employees?.length || 0}</p>
                </div>
              </div>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-3">Employee Roster</h3>
              {detail.employees?.length > 0 ? (
                <div className="bg-neutral-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-700"><tr>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Name</th>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Employee ID</th>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Job Title</th>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Status</th>
                    </tr></thead>
                    <tbody>
                      {detail.employees.map((e: any) => (
                        <tr key={e.id} className="border-t border-neutral-700">
                          <td className="p-3 text-white">{e.firstName} {e.lastName}</td>
                          <td className="p-3 text-neutral-400 font-mono text-xs">{e.employeeId || '—'}</td>
                          <td className="p-3 text-neutral-300">{e.jobTitle || e.position || '—'}</td>
                          <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (e.status === 'ACTIVE' ? 'bg-green-900/40 text-green-300' : 'bg-neutral-700 text-neutral-300')}>{e.status || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-8">No employees assigned to this department yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}