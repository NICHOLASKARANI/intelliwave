'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Briefcase, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, Users, TrendingUp, FileEdit, Sparkles, MapPin, Clock,
} from 'lucide-react'

const STATUSES = ['OPEN', 'CLOSED', 'ON_HOLD', 'DRAFT']
const TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']

const statusStyle = (s: string) => {
  switch (s) {
    case 'OPEN': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'CLOSED': return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
    case 'ON_HOLD': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'DRAFT': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    default: return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [pipeline, setPipeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('postedDate')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const [form, setForm] = useState({
    title: '', location: '', employmentType: 'FULL_TIME', salaryRange: '',
    description: '', requirements: '', status: 'OPEN', priority: 'NORMAL', closingDate: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/recruitment')
      const data = await res.json()
      setJobs(data.jobs || [])
      setSummary(data.summary || {})
      setPipeline(data.applicantsByStage || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({ title: '', location: '', employmentType: 'FULL_TIME', salaryRange: '', description: '', requirements: '', status: 'OPEN', priority: 'NORMAL', closingDate: '' })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (j: any) => {
    setForm({
      title: j.title || '', location: j.location || '', employmentType: j.employmentType || 'FULL_TIME',
      salaryRange: j.salaryRange || '', description: j.description || '', requirements: j.requirements || '',
      status: j.status || 'OPEN', priority: j.priority || 'NORMAL', closingDate: j.closingDate?.slice(0, 10) || '',
    })
    setEditing(j); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Job title required'); return }
    try {
      const url = editing ? '/api/wavecore/hr/recruitment/' + editing.id : '/api/wavecore/hr/recruitment'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Job updated' : 'Job posted')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, title: string) => {
    if (!confirm('Delete job "' + title + '" and all its applicants?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/recruitment/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Job deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/hr/recruitment/' + id)
    const data = await res.json()
    if (data.job) setDetail(data)
  }

  const pdf = () => window.open('/api/wavecore/hr/recruitment/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...jobs]
    if (activeKpi === 'OPEN') list = list.filter(j => j.status === 'OPEN')
    else if (activeKpi === 'CLOSED') list = list.filter(j => j.status === 'CLOSED')
    else if (activeKpi === 'HAS_APPLICANTS') list = list.filter(j => j.applicantCount > 0)
    if (filterStatus !== 'ALL') list = list.filter(j => j.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(j =>
        (j.title || '').toLowerCase().includes(s) ||
        (j.location || '').toLowerCase().includes(s) ||
        (j.description || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [jobs, activeKpi, filterStatus, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">HR · Recruitment</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Briefcase className="w-7 h-7 text-cyan-400" /> Recruitment
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Job postings · Applicant pipeline · Hiring analytics</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/40">
              <Plus className="w-5 h-5" /> Post Job
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-blue-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-cyan-300' : '')}>
            <Briefcase className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalJobs || 0}</p><p className="text-xs opacity-90">Total Jobs</p>
          </button>
          <button onClick={() => setActiveKpi('OPEN')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OPEN' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.openJobs || 0}</p><p className="text-xs opacity-90">Open</p>
          </button>
          <button onClick={() => setActiveKpi('CLOSED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-slate-600 to-neutral-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'CLOSED' ? 'ring-4 ring-slate-300' : '')}>
            <FileEdit className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.closedJobs || 0}</p><p className="text-xs opacity-90">Closed</p>
          </button>
          <button onClick={() => setActiveKpi('HAS_APPLICANTS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'HAS_APPLICANTS' ? 'ring-4 ring-indigo-300' : '')}>
            <Users className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalApplicants || 0}</p><p className="text-xs opacity-90">Applicants</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.inInterview || 0}</p><p className="text-xs opacity-90">In Interview</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-fuchsia-600 to-pink-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgApplicantsPerJob || 0}</p><p className="text-xs opacity-90">Avg / Job</p>
          </div>
        </div>

        {pipeline.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide mb-3">Applicant Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
              {pipeline.map(p => {
                const max = Math.max(...pipeline.map((x: any) => x.count), 1)
                const pct = Math.round((p.count / max) * 100)
                return (
                  <div key={p.stage} className="bg-neutral-800 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-bold">{p.stage}</span>
                      <span className="text-xs text-white font-bold">{p.count}</span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: pct + '%' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, location..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{filtered.length} of {jobs.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No job postings yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Post First Job
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['title','Job Title'],['location','Location'],['employmentType','Type'],['applicantCount','Applicants'],['salaryRange','Salary Range'],['postedDate','Posted'],['status','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(j => (
                    <tr key={j.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3">
                        <button onClick={() => openDetail(j.id)} className="text-white font-medium hover:text-cyan-400">{j.title}</button>
                      </td>
                      <td className="p-3 text-xs text-neutral-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {j.location || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{j.employmentType || '—'}</td>
                      <td className="p-3 text-right text-white font-bold">{j.applicantCount || 0}</td>
                      <td className="p-3 text-xs text-neutral-400">{j.salaryRange || '—'}</td>
                      <td className="p-3 text-xs text-neutral-400">{j.postedDate ? new Date(j.postedDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(j.status)}>{j.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(j.id, j.title)} disabled={deleting === j.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                            {deleting === j.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                <Sparkles className="w-5 h-5 text-cyan-400" /> {editing ? 'Edit Job' : 'Post New Job'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-cyan-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Job Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Senior Backend Engineer" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Nairobi HQ" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employment Type</label>
                <select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Salary Range</label>
                <input value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. KSh 200k - 350k" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Closing Date</label>
                <input type="date" value={form.closingDate} onChange={e => setForm({ ...form, closingDate: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="LOW">LOW</option><option value="NORMAL">NORMAL</option><option value="HIGH">HIGH</option><option value="URGENT">URGENT</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Role overview..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Requirements</label>
                <textarea rows={3} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Qualifications, skills, experience..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold">{editing ? 'Save Changes' : 'Post Job'}</button>
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
                  <Briefcase className="w-5 h-5 text-cyan-400" /> {detail.job?.title}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">{detail.job?.location || '—'} · {detail.job?.employmentType || '—'} · {detail.job?.status}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-cyan-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {detail.job?.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide mb-2">Description</h3>
                  <p className="text-sm text-neutral-300 whitespace-pre-wrap">{detail.job.description}</p>
                </div>
              )}
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide mb-3">Applicants ({detail.applicants?.length || 0})</h3>
              {detail.applicants?.length > 0 ? (
                <div className="bg-neutral-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-700"><tr>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Name</th>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Email</th>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Stage</th>
                      <th className="text-left p-3 text-xs uppercase text-neutral-300">Source</th>
                    </tr></thead>
                    <tbody>
                      {detail.applicants.map((a: any) => (
                        <tr key={a.id} className="border-t border-neutral-700">
                          <td className="p-3 text-white">{a.firstName} {a.lastName}</td>
                          <td className="p-3 text-neutral-400 text-xs">{a.email || '—'}</td>
                          <td className="p-3"><span className="px-2 py-1 rounded-full text-[10px] font-bold bg-cyan-900/40 text-cyan-300">{a.stage || 'APPLIED'}</span></td>
                          <td className="p-3 text-xs text-neutral-400">{a.source || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-8">No applicants yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}