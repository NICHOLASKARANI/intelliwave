'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Loader2, Plus, Trash2, X, RefreshCw, Search, CheckCircle2,
  ArrowUpDown, FileEdit, Sparkles, Clock, DollarSign, Briefcase,
} from 'lucide-react'

export default function ResourcesPage() {
  const [members, setMembers] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('ALL')
  const [sortBy, setSortBy] = useState('employeeName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const blank = { projectId: '', employeeName: '', role: 'MEMBER', hourlyRate: '', allocatedHours: '' }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        fetch('/api/wavecore/projects/members'),
        fetch('/api/wavecore/projects'),
      ])
      const mData = await mRes.json()
      const pData = await pRes.json()
      setMembers(mData.members || [])
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
      projectId: m.projectId || '', employeeName: m.employeeName || '', role: m.role || 'MEMBER',
      hourlyRate: String(m.hourlyRate || ''), allocatedHours: String(m.allocatedHours || ''),
    })
    setEditing(m); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.projectId) { setError('Project required'); return }
    if (!form.employeeName.trim()) { setError('Employee name required'); return }
    try {
      const url = editing ? '/api/wavecore/projects/members/' + editing.id : '/api/wavecore/projects/members'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hourlyRate: Number(form.hourlyRate || 0), allocatedHours: Number(form.allocatedHours || 0) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Member updated' : 'Member added')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Remove ' + name + ' from this project?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/projects/members/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Member removed'); fetchAll() }
    } finally { setDeleting('') }
  }

  const filtered = useMemo(() => {
    let list = [...members]
    if (filterProject !== 'ALL') list = list.filter(m => m.projectId === filterProject)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(m => (m.employeeName || '').toLowerCase().includes(s) || (m.role || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [members, filterProject, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">Projects · Resources</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Users className="w-7 h-7 text-amber-400" /> Resource Planning
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Team allocation · Hourly rates · Capacity planning</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-900/40">
              <Plus className="w-5 h-5" /> Add Member
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg">
            <Users className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Team Members</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalAllocatedHours || 0}</p><p className="text-xs opacity-90">Allocated Hours</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgHourlyRate || 0}</p><p className="text-xs opacity-90">Avg Hourly Rate</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <Briefcase className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{projects.length}</p><p className="text-xs opacity-90">Active Projects</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or role..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No team members yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add First Member
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['employeeName','Name'],['role','Role'],['projectId','Project'],['hourlyRate','Rate/hr'],['allocatedHours','Allocated Hrs'],['createdAt','Added']].map(([f,label]) => (
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
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                            {(m.employeeName || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="text-white font-medium">{m.employeeName || '—'}</span>
                        </div>
                      </td>
                      <td className="p-3"><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-900/40 text-amber-300">{m.role || 'MEMBER'}</span></td>
                      <td className="p-3 text-xs text-neutral-300">{projectName(m.projectId)}</td>
                      <td className="p-3 text-right text-white font-bold">{Number(m.hourlyRate).toLocaleString()}</td>
                      <td className="p-3 text-right text-neutral-300">{m.allocatedHours}h</td>
                      <td className="p-3 text-xs text-neutral-500">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(m.id, m.employeeName)} disabled={deleting === m.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800">
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
                <Sparkles className="w-5 h-5 text-amber-400" /> {editing ? 'Edit Member' : 'Add Team Member'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-amber-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Project *</label>
                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employee Name *</label>
                <input value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="MEMBER">Member</option><option value="LEAD">Lead</option><option value="MANAGER">Manager</option><option value="CONTRIBUTOR">Contributor</option><option value="OBSERVER">Observer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Hourly Rate</label>
                  <input type="number" min="0" step="50" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Allocated Hours</label>
                  <input type="number" min="0" step="1" value={form.allocatedHours} onChange={e => setForm({ ...form, allocatedHours: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold">{editing ? 'Save Changes' : 'Add Member'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}