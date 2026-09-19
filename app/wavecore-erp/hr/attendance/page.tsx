'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Clock, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, XCircle, AlertTriangle, UserCheck, TrendingUp, FileEdit, Sparkles, PlayCircle, StopCircle,
} from 'lucide-react'

const STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'REMOTE']

const statusStyle = (s: string) => {
  switch (s) {
    case 'PRESENT': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'LATE':    return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'ABSENT':  return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'LEAVE':   return 'bg-purple-900/40 text-purple-300 border border-purple-700'
    case 'REMOTE':  return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    default:        return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')

  const [form, setForm] = useState({
    employeeId: '', date: new Date().toISOString().slice(0, 10),
    checkIn: '', checkOut: '', status: 'PRESENT', notes: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [aRes, eRes] = await Promise.all([
        fetch('/api/wavecore/hr/attendance'),
        fetch('/api/wavecore/hr/employees'),
      ])
      const aData = await aRes.json()
      const eData = await eRes.json()
      setRecords(aData.attendance || [])
      setSummary(aData.summary || {})
      setEmployees(eData.employees || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({
    employeeId: '', date: new Date().toISOString().slice(0, 10),
    checkIn: '', checkOut: '', status: 'PRESENT', notes: '',
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (r: any) => {
    setForm({
      employeeId: r.employeeId || '',
      date: r.date ? r.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      checkIn: r.checkIn ? new Date(r.checkIn).toISOString().slice(11, 16) : '',
      checkOut: r.checkOut ? new Date(r.checkOut).toISOString().slice(11, 16) : '',
      status: r.status || 'PRESENT',
      notes: r.notes || '',
    })
    setEditing(r)
    setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.employeeId) { setError('Please select an employee'); return }
    if (!form.date) { setError('Date is required'); return }

    const payload: any = {
      employeeId: form.employeeId,
      date: form.date,
      status: form.status,
      notes: form.notes,
      checkIn: form.checkIn ? `${form.date}T${form.checkIn}:00` : null,
      checkOut: form.checkOut ? `${form.date}T${form.checkOut}:00` : null,
    }

    try {
      const url = editing ? '/api/wavecore/hr/attendance/' + editing.id : '/api/wavecore/hr/attendance'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Attendance updated' : 'Attendance recorded')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete attendance record for ' + name + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/hr/attendance/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const quickClockIn = async (empId: string) => {
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    try {
      const res = await fetch('/api/wavecore/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          date: now.toISOString().slice(0, 10),
          checkIn: `${now.toISOString().slice(0, 10)}T${time}:00`,
          status: 'PRESENT',
        }),
      })
      if (res.ok) { flash('Clocked in at ' + time); fetchAll() }
    } catch {}
  }

  const pdf = () => window.open('/api/wavecore/hr/attendance/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...records]
    if (activeKpi === 'TODAY') {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      list = list.filter(r => r.date && new Date(r.date) >= todayStart)
    } else if (activeKpi === 'LATE') list = list.filter(r => r.status === 'LATE')
    else if (activeKpi === 'ABSENT') list = list.filter(r => r.status === 'ABSENT')
    else if (activeKpi === 'LEAVE') list = list.filter(r => r.status === 'LEAVE')
    if (filterStatus !== 'ALL') list = list.filter(r => r.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(r =>
        (r.employeeName || '').toLowerCase().includes(s) ||
        (r.empCode || '').toLowerCase().includes(s) ||
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
          <span className="text-sm text-neutral-400">HR · Attendance</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Clock className="w-7 h-7 text-green-400" /> Attendance
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Clock in/out · Shift tracking · Late detection</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-green-900/40">
              <Plus className="w-5 h-5" /> Record Attendance
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('TODAY')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'TODAY' ? 'ring-4 ring-green-300' : '')}>
            <UserCheck className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.presentToday || 0}</p><p className="text-xs opacity-90">Present Today</p>
          </button>
          <button onClick={() => setActiveKpi('LATE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'LATE' ? 'ring-4 ring-yellow-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.lateToday || 0}</p><p className="text-xs opacity-90">Late Today</p>
          </button>
          <button onClick={() => setActiveKpi('ABSENT')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ABSENT' ? 'ring-4 ring-red-300' : '')}>
            <XCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.absentToday || 0}</p><p className="text-xs opacity-90">Absent Today</p>
          </button>
          <button onClick={() => setActiveKpi('LEAVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-violet-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'LEAVE' ? 'ring-4 ring-purple-300' : '')}>
            <Sparkles className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.leaveToday || 0}</p><p className="text-xs opacity-90">On Leave</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.attendanceRate || 0}%</p><p className="text-xs opacity-90">Attendance Rate</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalHoursThisMonth || 0}</p><p className="text-xs opacity-90">Hours This Month</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee, code or department..."
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
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No attendance records</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Record First Attendance
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['date','Date'],['employeeName','Employee'],['empCode','Code'],['department','Department'],['checkIn','Check In'],['checkOut','Check Out'],['hoursWorked','Hours'],['status','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const inStr = r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
                    const outStr = r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
                    return (
                      <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                        <td className="p-3 text-xs text-neutral-400">{r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}</td>
                        <td className="p-3 text-white font-medium">{r.employeeName}</td>
                        <td className="p-3 font-mono text-xs text-neutral-400">{r.empCode || '—'}</td>
                        <td className="p-3 text-xs text-neutral-400">{r.department || '—'}</td>
                        <td className="p-3 text-center text-neutral-300">{inStr}</td>
                        <td className="p-3 text-center text-neutral-300">{outStr}</td>
                        <td className="p-3 text-right text-white font-bold">{r.hoursWorked || '—'}</td>
                        <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(r.status)}>{r.status}</span></td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                            <button onClick={() => del(r.id, r.employeeName)} disabled={deleting === r.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                              {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                <Sparkles className="w-5 h-5 text-green-400" /> {editing ? 'Edit Attendance' : 'Record Attendance'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-green-400"><X className="w-5 h-5" /></button>
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
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold flex items-center gap-1"><PlayCircle className="w-3 h-3 text-green-400" /> Check In</label>
                <input type="time" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold flex items-center gap-1"><StopCircle className="w-3 h-3 text-red-400" /> Check Out</label>
                <input type="time" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Optional remarks..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">{editing ? 'Save Changes' : 'Record Attendance'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}