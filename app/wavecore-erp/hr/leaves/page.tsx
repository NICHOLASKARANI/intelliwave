'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, XCircle, Clock, AlertTriangle, FileEdit, Sparkles, ThumbsUp, ThumbsDown,
} from 'lucide-react'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']

const statusStyle = (s: string) => {
  switch (s) {
    case 'APPROVED':  return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'PENDING':   return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'REJECTED':  return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'CANCELLED': return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
    default:          return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

export default function LeavesPage() {
  const [records, setRecords] = useState<any[]>([])
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
  const [actioning, setActioning] = useState('')

  const [form, setForm] = useState({
    employeeId: '', leaveTypeId: '', startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10), days: '', reason: '', status: 'PENDING',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [lRes, eRes] = await Promise.all([
        fetch('/api/wavecore/hr/leaves'),
        fetch('/api/wavecore/hr/employees'),
      ])
      const lData = await lRes.json()
      const eData = await eRes.json()
      setRecords(lData.leaves || lData.requests || [])
      setSummary(lData.summary || {})
      setEmployees(eData.employees || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    employeeId: '', leaveTypeId: '', startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10), days: '', reason: '', status: 'PENDING',
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.employeeId) { setError('Please select an employee'); return }
    if (!form.startDate || !form.endDate) { setError('Start and end dates required'); return }

    const payload: any = {
      employeeId: form.employeeId,
      startDate: form.startDate,
      endDate: form.endDate,
      days: form.days ? Number(form.days) : undefined,
      reason: form.reason,
      status: form.status,
    }

    try {
      const url = editing ? '/api/wavecore/hr/leaves/' + editing.id : '/api/wavecore/hr/leaves'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Leave updated' : 'Leave request submitted')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const approve = async (id: string) => {
    setActioning(id)
    try {
      const res = await fetch('/api/wavecore/hr/leaves/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      if (res.ok) { flash('Leave approved'); fetchAll() }
    } finally { setActioning('') }
  }

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):')
    if (reason === null) return
    setActioning(id)
    try {
      const res = await fetch('/api/wavecore/hr/leaves/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason || 'No reason given' }),
      })
      if (res.ok) { flash('Leave rejected'); fetchAll() }
    } finally { setActioning('') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete leave request for ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/leaves/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const pdf = () => window.open('/api/wavecore/hr/leaves/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...records]
    if (activeKpi === 'PENDING') list = list.filter(r => r.status === 'PENDING')
    else if (activeKpi === 'APPROVED') list = list.filter(r => r.status === 'APPROVED')
    else if (activeKpi === 'REJECTED') list = list.filter(r => r.status === 'REJECTED')
    if (filterStatus !== 'ALL') list = list.filter(r => r.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r =>
        (r.employeeName || '').toLowerCase().includes(s) ||
        (r.empCode || '').toLowerCase().includes(s) ||
        (r.department || '').toLowerCase().includes(s) ||
        (r.reason || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [records, activeKpi, filterStatus, search, sortBy, sortDir])

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
          <span className="text-sm text-neutral-400">HR · Leave Management</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Calendar className="w-7 h-7 text-amber-400" /> Leave & Absence
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Request · Approve · Track · Report</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-900/40">
              <Plus className="w-5 h-5" /> New Request
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-amber-600 to-orange-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-amber-300' : '')}>
            <Calendar className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total Requests</p>
          </button>
          <button onClick={() => setActiveKpi('PENDING')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'PENDING' ? 'ring-4 ring-yellow-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.pending || 0}</p><p className="text-xs opacity-90">Pending</p>
          </button>
          <button onClick={() => setActiveKpi('APPROVED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'APPROVED' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.approved || 0}</p><p className="text-xs opacity-90">Approved</p>
          </button>
          <button onClick={() => setActiveKpi('REJECTED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'REJECTED' ? 'ring-4 ring-red-300' : '')}>
            <XCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.rejected || 0}</p><p className="text-xs opacity-90">Rejected</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
            <Sparkles className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.pendingDays || 0}</p><p className="text-xs opacity-90">Pending Days</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalDaysThisYear || 0}</p><p className="text-xs opacity-90">Approved Days YTD</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee, code or reason..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{filtered.length} of {records.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No leave requests match filters</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Submit First Request
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['employeeName','Employee'],['department','Department'],['leaveTypeName','Type'],['startDate','Start'],['endDate','End'],['days','Days'],['status','Status']].map(([f,label]) => (
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
                      <td className="p-3 text-white font-medium">{r.employeeName}<br /><span className="font-mono text-[10px] text-neutral-500">{r.empCode || ''}</span></td>
                      <td className="p-3 text-xs text-neutral-400">{r.department || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{r.leaveTypeName || '—'}</td>
                      <td className="p-3 text-xs text-neutral-400">{r.startDate ? new Date(r.startDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-xs text-neutral-400">{r.endDate ? new Date(r.endDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-right text-white font-bold">{r.days}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(r.status)}>{r.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          {r.status === 'PENDING' && (
                            <>
                              <button onClick={() => approve(r.id)} disabled={actioning === r.id} className="p-1.5 rounded-lg bg-green-900/50 text-green-300 hover:bg-green-800" title="Approve">
                                {actioning === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                              </button>
                              <button onClick={() => reject(r.id)} disabled={actioning === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Reject">
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => { setEditing(r); setForm({
                            employeeId: r.employeeId, leaveTypeId: r.leaveTypeId, startDate: r.startDate?.slice(0, 10) || '',
                            endDate: r.endDate?.slice(0, 10) || '', days: String(r.days || ''), reason: r.reason || '', status: r.status
                          }); setShowCreate(true) }} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(r.id, r.employeeName)} disabled={deleting === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
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
                <Sparkles className="w-5 h-5 text-amber-400" /> {editing ? 'Edit Leave Request' : 'New Leave Request'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-amber-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Employee *</label>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="">Select employee...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId || 'no code'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Start Date *</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">End Date *</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Days</label>
                <input type="number" step="0.5" min="0" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} placeholder="Auto-calc" className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Reason</label>
                <textarea rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Optional reason..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold">{editing ? 'Save Changes' : 'Submit Request'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}