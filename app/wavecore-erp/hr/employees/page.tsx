'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users, Plus, Loader2, Search, Printer, Trash2, X, ArrowUpDown,
  CheckCircle2, UserPlus, Briefcase, TrendingUp, DollarSign, FileEdit, Sparkles,
  Mail, Phone, MapPin, Building2, Calendar, Star, FileText, Wallet, IdCard,
} from 'lucide-react'

const STATUSES = ['ACTIVE', 'PROBATION', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']
const TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'CONSULTANT']

const statusStyle = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'PROBATION': return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
    case 'ON_LEAVE': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'SUSPENDED': return 'bg-orange-900/40 text-orange-300 border border-orange-700'
    case 'TERMINATED': return 'bg-red-900/40 text-red-300 border border-red-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [byDepartment, setByDepartment] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDept, setFilterDept] = useState('ALL')
  const [sortBy, setSortBy] = useState('firstName')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [detailTab, setDetailTab] = useState<'personal'|'employment'|'salary'|'docs'>('personal')

  const blank = {
    firstName: '', lastName: '', preferredName: '', employeeId: '',
    email: '', phone: '', dateOfBirth: '', gender: '', maritalStatus: '',
    nationality: 'Kenyan', idNumber: '', taxPin: '', nssfNumber: '', nhifNumber: '',
    address: '', city: 'Nairobi', country: 'Kenya',
    emergencyContact: '', emergencyPhone: '',
    department: '', position: '', jobTitle: '', jobFamily: '', grade: '',
    division: '', branch: '', costCenter: '',
    employmentType: 'FULL_TIME', status: 'ACTIVE',
    hireDate: new Date().toISOString().slice(0, 10), terminationDate: '',
    salary: '', currency: 'KES',
    bankName: '', bankAccount: '', notes: '',
  }
  const [form, setForm] = useState<any>(blank)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/employees')
      const data = await res.json()
      setEmployees(data.employees || [])
      setSummary(data.summary || {})
      setByDepartment(data.byDepartment || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({ ...blank })
  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }
  const openEdit = (e: any) => {
    setForm({
      ...blank,
      ...Object.fromEntries(Object.keys(blank).map(k => [k, e[k] !== undefined && e[k] !== null ? String(e[k]) : (blank as any)[k]])),
      hireDate: e.hireDate ? e.hireDate.slice(0, 10) : '',
      terminationDate: e.terminationDate ? e.terminationDate.slice(0, 10) : '',
      dateOfBirth: e.dateOfBirth ? e.dateOfBirth.slice(0, 10) : '',
      salary: e.salary ? String(e.salary) : '',
    })
    setEditing(e); setShowCreate(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('First and last name required'); return }

    const payload = { ...form, salary: Number(form.salary || 0) }
    try {
      const url = editing ? '/api/wavecore/hr/employees/' + editing.id : '/api/wavecore/hr/employees'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Employee updated' : 'Employee created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, name: string) => {
    if (!confirm('Delete employee "' + name + '"? This cannot be undone.')) return
    setDeleting(id)
    setError('')
    try {
      const res = await fetch('/api/wavecore/hr/employees/' + id, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Employee deleted'); fetchAll()
    } finally { setDeleting('') }
  }

  const openDetail = async (id: string) => {
    setDetail(null)
    const res = await fetch('/api/wavecore/hr/employees/' + id)
    const data = await res.json()
    if (data.employee) { setDetail(data); setDetailTab('personal') }
  }

  const pdf = () => window.open('/api/wavecore/hr/employees/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...employees]
    if (activeKpi === 'ACTIVE') list = list.filter(e => e.status === 'ACTIVE')
    else if (activeKpi === 'ON_LEAVE') list = list.filter(e => e.status === 'ON_LEAVE')
    else if (activeKpi === 'NEW_HIRES') {
      const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      list = list.filter(e => e.hireDate && new Date(e.hireDate) >= ms)
    } else if (activeKpi === 'TERMINATED') list = list.filter(e => e.status === 'TERMINATED')
    if (filterStatus !== 'ALL') list = list.filter(e => e.status === filterStatus)
    if (filterDept !== 'ALL') list = list.filter(e => e.department === filterDept)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(e =>
        (e.firstName + ' ' + e.lastName).toLowerCase().includes(s) ||
        (e.employeeId || '').toLowerCase().includes(s) ||
        (e.email || '').toLowerCase().includes(s) ||
        (e.department || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [employees, activeKpi, filterStatus, filterDept, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }

  const deptOptions = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort()
  }, [employees])

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">HR · Employees</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Users className="w-7 h-7 text-blue-400" /> Employees
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Employee 360 · Full CRUD · Payroll-linked</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40">
              <UserPlus className="w-5 h-5" /> Add Employee
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-blue-300' : '')}>
            <Users className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
          </button>
          <button onClick={() => setActiveKpi('ACTIVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ACTIVE' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.active || 0}</p><p className="text-xs opacity-90">Active</p>
          </button>
          <button onClick={() => setActiveKpi('NEW_HIRES')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'NEW_HIRES' ? 'ring-4 ring-emerald-300' : '')}>
            <UserPlus className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.newHiresThisMonth || 0}</p><p className="text-xs opacity-90">New This Month</p>
          </button>
          <button onClick={() => setActiveKpi('ON_LEAVE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ON_LEAVE' ? 'ring-4 ring-yellow-300' : '')}>
            <Calendar className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.onLeave || 0}</p><p className="text-xs opacity-90">On Leave</p>
          </button>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white shadow-lg">
            <Building2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.departments || 0}</p><p className="text-xs opacity-90">Departments</p>
          </div>
          <div className="p-4 rounded-2xl text-left bg-gradient-to-br from-cyan-600 to-teal-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{(summary.monthlyPayroll || 0).toLocaleString()}</p><p className="text-xs opacity-90">Payroll/mo</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, email or department..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              <option value="ALL">All Departments</option>
              {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{filtered.length} of {employees.length} shown</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No employees yet</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add First Employee
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['employeeId','Code'],['firstName','Name'],['email','Email'],['phone','Phone'],['department','Department'],['jobTitle','Job Title'],['salary','Salary'],['status','Status']].map(([f,label]) => (
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
                      <td className="p-3 font-mono text-xs text-neutral-400">{e.employeeId || '—'}</td>
                      <td className="p-3">
                        <button onClick={() => openDetail(e.id)} className="text-white font-medium hover:text-blue-400">{e.firstName} {e.lastName}</button>
                      </td>
                      <td className="p-3 text-xs text-neutral-400">{e.email || '—'}</td>
                      <td className="p-3 text-xs text-neutral-400">{e.phone || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{e.department || '—'}</td>
                      <td className="p-3 text-xs text-neutral-300">{e.jobTitle || e.position || '—'}</td>
                      <td className="p-3 text-right text-white font-bold">{(Number(e.salary) || 0).toLocaleString()}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(e.status)}>{e.status}</span></td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(e.id, e.firstName + ' ' + e.lastName)} disabled={deleting === e.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
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

      {/* CREATE / EDIT MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-4xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" /> {editing ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-blue-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* PERSONAL */}
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-neutral-400 font-bold">First Name *</label>
                    <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Last Name *</label>
                    <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Preferred Name</label>
                    <input value={form.preferredName} onChange={e => setForm({ ...form, preferredName: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Employee Code (auto if blank)</label>
                    <input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP-0001" className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Gender</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm">
                      <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
                    </select></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Nationality</label>
                    <input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                </div>
              </div>

              {/* EMPLOYMENT */}
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Employment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-neutral-400 font-bold">Department</label>
                    <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Job Title</label>
                    <input value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Position</label>
                    <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Employment Type</label>
                    <select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm">
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Grade</label>
                    <input value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Hire Date</label>
                    <input type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Location / Branch</label>
                    <input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Cost Center</label>
                    <input value={form.costCenter} onChange={e => setForm({ ...form, costCenter: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                </div>
              </div>

              {/* COMPENSATION */}
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Compensation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><label className="text-xs text-neutral-400 font-bold">Annual Salary</label>
                    <input type="number" min="0" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Currency</label>
                    <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm">
                      <option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                    </select></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Bank Name</label>
                    <input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Bank Account</label>
                    <input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                </div>
              </div>

              {/* ID & TAX */}
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <IdCard className="w-4 h-4" /> Identity & Statutory
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div><label className="text-xs text-neutral-400 font-bold">ID Number</label>
                    <input value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">KRA PIN</label>
                    <input value={form.taxPin} onChange={e => setForm({ ...form, taxPin: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">NSSF Number</label>
                    <input value={form.nssfNumber} onChange={e => setForm({ ...form, nssfNumber: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">SHIF/NHIF Number</label>
                    <input value={form.nhifNumber} onChange={e => setForm({ ...form, nhifNumber: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                </div>
              </div>

              {/* CONTACT */}
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Contact & Emergency
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3"><label className="text-xs text-neutral-400 font-bold">Address</label>
                    <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">City</label>
                    <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Emergency Contact</label>
                    <input value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                  <div><label className="text-xs text-neutral-400 font-bold">Emergency Phone</label>
                    <input value={form.emergencyPhone} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" /></div>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-bold">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800 sticky bottom-0 bg-neutral-900">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">{editing ? 'Save Changes' : 'Add Employee'}</button>
            </div>
          </form>
        </div>
      )}

      {/* EMPLOYEE 360 DRAWER */}
      {detail && detail.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-5xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-5 border-b border-neutral-800">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg">
                    {(detail.employee.firstName?.[0] || '')}{(detail.employee.lastName?.[0] || '')}
                  </div>
                  {detail.employee.firstName} {detail.employee.lastName}
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {detail.employee.employeeId || 'No code'} · {detail.employee.jobTitle || detail.employee.position || 'No title'} · {detail.employee.department || 'No department'}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-blue-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex gap-1 p-3 border-b border-neutral-800 bg-neutral-900/50">
              {([['personal','Personal'],['employment','Employment'],['salary','Salary & Pay'],['docs','Docs & History']] as const).map(([k,l]) => (
                <button key={k} onClick={() => setDetailTab(k)} className={'px-4 py-2 rounded-lg text-sm font-bold ' + (detailTab === k ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-800')}>
                  {l}
                </button>
              ))}
            </div>

            <div className="p-6">
              {detailTab === 'personal' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Info label="Email" value={detail.employee.email} icon={Mail} />
                  <Info label="Phone" value={detail.employee.phone} icon={Phone} />
                  <Info label="Preferred Name" value={detail.employee.preferredName} />
                  <Info label="Date of Birth" value={detail.employee.dateOfBirth ? new Date(detail.employee.dateOfBirth).toLocaleDateString('en-GB') : null} />
                  <Info label="Gender" value={detail.employee.gender} />
                  <Info label="Marital Status" value={detail.employee.maritalStatus} />
                  <Info label="Nationality" value={detail.employee.nationality} />
                  <Info label="ID Number" value={detail.employee.idNumber} />
                  <Info label="KRA PIN" value={detail.employee.taxPin} />
                  <Info label="NSSF" value={detail.employee.nssfNumber} />
                  <Info label="SHIF/NHIF" value={detail.employee.nhifNumber} />
                  <Info label="City" value={detail.employee.city} />
                  <Info label="Address" value={detail.employee.address} className="md:col-span-3" />
                  <Info label="Emergency Contact" value={detail.employee.emergencyContact} />
                  <Info label="Emergency Phone" value={detail.employee.emergencyPhone} />
                </div>
              )}
              {detailTab === 'employment' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Info label="Employee Code" value={detail.employee.employeeId} />
                  <Info label="Job Title" value={detail.employee.jobTitle} icon={Briefcase} />
                  <Info label="Position" value={detail.employee.position} />
                  <Info label="Department" value={detail.employee.department} icon={Building2} />
                  <Info label="Division" value={detail.employee.division} />
                  <Info label="Grade" value={detail.employee.grade} />
                  <Info label="Employment Type" value={detail.employee.employmentType} />
                  <Info label="Status" value={detail.employee.status} />
                  <Info label="Hire Date" value={detail.employee.hireDate ? new Date(detail.employee.hireDate).toLocaleDateString('en-GB') : null} icon={Calendar} />
                  <Info label="Branch" value={detail.employee.branch} />
                  <Info label="Cost Center" value={detail.employee.costCenter} />
                </div>
              )}
              {detailTab === 'salary' && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <Info label="Annual Salary" value={(Number(detail.employee.salary) || 0).toLocaleString()} icon={DollarSign} />
                    <Info label="Monthly" value={Math.round((Number(detail.employee.salary) || 0) / 12).toLocaleString()} />
                    <Info label="Currency" value={detail.employee.currency} />
                    <Info label="Bank" value={detail.employee.bankName} />
                    <Info label="Account" value={detail.employee.bankAccount} />
                  </div>
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Recent Payslips ({detail.payrolls?.length || 0})
                  </h4>
                  {detail.payrolls?.length > 0 ? (
                    <div className="bg-neutral-800 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-700"><tr>
                          <th className="text-left p-3 text-xs uppercase text-neutral-300">Period</th>
                          <th className="text-right p-3 text-xs uppercase text-neutral-300">Gross</th>
                          <th className="text-right p-3 text-xs uppercase text-neutral-300">Net</th>
                        </tr></thead>
                        <tbody>
                          {detail.payrolls.map((p: any) => (
                            <tr key={p.id} className="border-t border-neutral-700">
                              <td className="p-3 text-white font-mono text-xs">{p.periodId?.slice(0, 8) || '—'}</td>
                              <td className="p-3 text-right text-neutral-300">{(Number(p.grossPay) || 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-green-400 font-bold">{(Number(p.netPay) || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-neutral-500 text-center py-6">No payslips yet</p>}
                </div>
              )}
              {detailTab === 'docs' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Leave History ({detail.leaves?.length || 0})
                    </h4>
                    {detail.leaves?.length > 0 ? (
                      <div className="bg-neutral-800 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-neutral-700"><tr>
                            <th className="text-left p-3 text-xs uppercase text-neutral-300">Start</th>
                            <th className="text-left p-3 text-xs uppercase text-neutral-300">End</th>
                            <th className="text-right p-3 text-xs uppercase text-neutral-300">Days</th>
                            <th className="text-center p-3 text-xs uppercase text-neutral-300">Status</th>
                          </tr></thead>
                          <tbody>
                            {detail.leaves.map((l: any) => (
                              <tr key={l.id} className="border-t border-neutral-700">
                                <td className="p-3 text-neutral-300 text-xs">{l.startDate ? new Date(l.startDate).toLocaleDateString('en-GB') : '—'}</td>
                                <td className="p-3 text-neutral-300 text-xs">{l.endDate ? new Date(l.endDate).toLocaleDateString('en-GB') : '—'}</td>
                                <td className="p-3 text-right text-white">{l.days}</td>
                                <td className="p-3 text-center"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(l.status === 'APPROVED' ? 'ACTIVE' : l.status === 'PENDING' ? 'PROBATION' : 'TERMINATED')}>{l.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p className="text-sm text-neutral-500 text-center py-4">No leave history</p>}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4" /> Performance Reviews ({detail.reviews?.length || 0})
                    </h4>
                    {detail.reviews?.length > 0 ? (
                      <div className="space-y-2">
                        {detail.reviews.map((r: any) => (
                          <div key={r.id} className="flex justify-between p-3 bg-neutral-800 rounded-lg">
                            <span className="text-sm text-white">{r.reviewPeriod}</span>
                            <span className="text-sm font-bold text-yellow-400">{Number(r.score).toFixed(1)}/5 · {r.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-neutral-500 text-center py-4">No performance reviews</p>}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Documents ({detail.documents?.length || 0})
                    </h4>
                    {detail.documents?.length > 0 ? (
                      <div className="space-y-2">
                        {detail.documents.map((d: any) => (
                          <div key={d.id} className="flex justify-between p-3 bg-neutral-800 rounded-lg">
                            <span className="text-sm text-white">{d.documentType || d.fileName || 'Document'}</span>
                            <span className="text-xs text-neutral-400">{d.expiryDate ? 'Expires ' + new Date(d.expiryDate).toLocaleDateString('en-GB') : ''}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-neutral-500 text-center py-4">No documents uploaded</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value, icon: Icon, className = '' }: { label: string; value: any; icon?: any; className?: string }) {
  if (!value && value !== 0) return null
  return (
    <div className={'p-3 bg-neutral-800 rounded-xl ' + className}>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mb-1 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </p>
      <p className="text-sm text-white break-words">{value}</p>
    </div>
  )
}