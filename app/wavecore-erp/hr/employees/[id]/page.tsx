'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Users, Printer, Trash2,
  User, Mail, Phone, Building2, Calendar, DollarSign, Save, X as XIcon, Edit3,
  FileText, Wallet, Briefcase, TrendingUp, Clock, GraduationCap, ExternalLink,
  CheckCircle2, ChevronRight,
} from 'lucide-react'

type Tab = 'overview' | 'documents' | 'leave' | 'attendance' | 'payroll' | 'training' | 'performance'

interface Employee {
  id: string
  employeeId?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  nationality?: string
  idNumber?: string
  taxPin?: string
  nssfNumber?: string
  nhifNumber?: string
  address?: string
  city?: string
  country?: string
  emergencyContact?: string
  emergencyPhone?: string
  department?: string
  position?: string
  jobTitle?: string
  jobFamily?: string
  grade?: string
  division?: string
  branch?: string
  costCenter?: string
  employmentType?: string
  status?: string
  hireDate?: string
  terminationDate?: string
  salary?: number
  currency?: string
  bankName?: string
  bankAccount?: string
  notes?: string
  preferredName?: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:     'bg-green-900/50 text-green-300',
  PROBATION:  'bg-cyan-900/50 text-cyan-300',
  ON_LEAVE:   'bg-yellow-900/50 text-yellow-300',
  SUSPENDED:  'bg-orange-900/50 text-orange-300',
  TERMINATED: 'bg-red-900/50 text-red-300',
  INACTIVE:   'bg-neutral-800 text-neutral-400',
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-GB') : '—'
const fmtMoney = (n: any, cur = 'KES') => cur + ' ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const mask = (s?: string) => (!s || s.length <= 4) ? (s ? '••••' : '—') : '••••' + s.slice(-4)

export default function Employee360Page() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emp, setEmp] = useState<Employee | null>(null)
  const [data, setData] = useState<any>({})
  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [working, setWorking] = useState(false)
  const [form, setForm] = useState<any>({})

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/employees/' + id, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setEmp(json.employee)
      setData(json)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const startEdit = () => {
    if (!emp) return
    const f: any = {}
    for (const k of Object.keys(emp)) f[k] = (emp as any)[k] ?? ''
    f.hireDate = emp.hireDate ? emp.hireDate.slice(0, 10) : ''
    f.terminationDate = emp.terminationDate ? emp.terminationDate.slice(0, 10) : ''
    f.dateOfBirth = emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : ''
    f.salary = String(emp.salary || 0)
    setForm(f)
    setEditing(true)
  }

  const saveEdit = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/hr/employees/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ ...form, salary: Number(form.salary || 0) }),
      })
      const json = await res.json()
      if (!res.ok) {
        const msg = json.messages && Array.isArray(json.messages) ? json.messages.join(' · ') : (json.error || 'Save failed')
        setError(msg)
        return
      }
      flash('Employee updated')
      setEditing(false)
      load()
    } catch { setError('Network error') }
    finally { setWorking(false) }
  }

  const del = async () => {
    if (!emp) return
    if (!confirm('Delete employee "' + emp.firstName + ' ' + emp.lastName + '"? This cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/hr/employees/' + id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'Delete failed'); return }
      router.push('/wavecore-erp/hr/employees')
    } catch { setError('Network error') }
    finally { setWorking(false) }
  }

  const fullName = emp ? (emp.firstName + ' ' + emp.lastName) : ''
  const counts = useMemo(() => ({
    documents: (data.documents || []).length,
    leaves: (data.leaves || []).length,
    attendance: (data.attendance || []).length,
    payrolls: (data.payrolls || []).length,
    trainings: (data.trainings || []).length,
    reviews: (data.reviews || []).length,
    balances: (data.balances || []).length,
  }), [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error && !emp) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/hr/employees" className="p-2 rounded-lg hover:bg-neutral-800 text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <span className="font-bold text-white">Employee</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-8">
          <div className="p-6 rounded-2xl bg-red-900/30 border border-red-800 text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        </main>
      </div>
    )
  }

  if (!emp) return null

  const TABS: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'overview',     label: 'Overview',     icon: User,           count: 0 },
    { key: 'documents',    label: 'Documents',    icon: FileText,       count: counts.documents },
    { key: 'leave',        label: 'Leave',        icon: Calendar,       count: counts.leaves },
    { key: 'attendance',   label: 'Attendance',   icon: Clock,          count: counts.attendance },
    { key: 'payroll',      label: 'Payroll',      icon: Wallet,         count: counts.payrolls },
    { key: 'training',     label: 'Training',     icon: GraduationCap,  count: counts.trainings },
    { key: 'performance',  label: 'Performance',  icon: TrendingUp,     count: counts.reviews },
  ]

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/hr/employees" className="p-2 rounded-lg hover:bg-neutral-800 text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Employee</p>
              <p className="font-bold text-white">{fullName}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (STATUS_COLORS[emp.status || ''] || 'bg-neutral-800 text-neutral-400')}>
              {emp.status || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={'/api/wavecore/hr/employees/' + id + '/pdf'}
              target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Profile PDF
            </a>
            {!editing ? (
              <button onClick={startEdit} className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} disabled={working} className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
                  <XIcon className="w-4 h-4" /> Cancel
                </button>
                <button onClick={saveEdit} disabled={working} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            )}
            <button onClick={del} disabled={working} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                {(emp.firstName || '?').charAt(0)}{(emp.lastName || '').charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">{fullName}</h1>
                <p className="text-white/80 text-sm mt-1">
                  {emp.jobTitle || emp.position || 'No position'} · {emp.department || 'No department'} · {emp.employeeId || 'no code'}
                </p>
              </div>
            </div>
            <div className="text-right text-sm space-y-1">
              <p><span className="text-white/70">Hired:</span> {fmtDate(emp.hireDate)}</p>
              <p><span className="text-white/70">Salary:</span> {fmtMoney(emp.salary, emp.currency || 'KES')}</p>
              <p><span className="text-white/70">Type:</span> {emp.employmentType || '—'}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        {editing ? (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Edit employee</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                ['firstName','First Name'], ['lastName','Last Name'], ['preferredName','Preferred Name'],
                ['email','Email'], ['phone','Phone'], ['dateOfBirth','Date of Birth'],
                ['gender','Gender'], ['maritalStatus','Marital Status'], ['nationality','Nationality'],
                ['idNumber','ID Number'], ['taxPin','KRA PIN'], ['nssfNumber','NSSF'],
                ['nhifNumber','NHIF / SHIF'], ['address','Address'], ['city','City'],
                ['country','Country'], ['emergencyContact','Emergency Contact'], ['emergencyPhone','Emergency Phone'],
                ['department','Department'], ['position','Position'], ['jobTitle','Job Title'],
                ['jobFamily','Job Family'], ['grade','Grade'], ['division','Division'],
                ['branch','Branch'], ['costCenter','Cost Center'], ['hireDate','Hire Date'],
                ['terminationDate','Termination Date'], ['salary','Salary'], ['currency','Currency'],
                ['bankName','Bank Name'], ['bankAccount','Bank Account'],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">{label}</label>
                  <input
                    value={form[k] || ''}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Employment Type</label>
                <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
                  {['FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP','CONSULTANT'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
                  {['ACTIVE','PROBATION','ON_LEAVE','SUSPENDED','TERMINATED'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Notes</label>
                <textarea rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ' +
                      (active
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-600')
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {t.count > 0 && (
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (active ? 'bg-white/20' : 'bg-neutral-800')}>
                        {t.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {tab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Section title="Personal">
                  <Row label="Email" value={emp.email} />
                  <Row label="Phone" value={emp.phone} />
                  <Row label="Date of Birth" value={fmtDate(emp.dateOfBirth)} />
                  <Row label="Gender" value={emp.gender} />
                  <Row label="Marital Status" value={emp.maritalStatus} />
                  <Row label="Nationality" value={emp.nationality} />
                </Section>
                <Section title="Identity & Statutory">
                  <Row label="ID Number" value={emp.idNumber} />
                  <Row label="KRA PIN" value={emp.taxPin} />
                  <Row label="NSSF Number" value={emp.nssfNumber} />
                  <Row label="NHIF / SHIF" value={emp.nhifNumber} />
                </Section>
                <Section title="Employment">
                  <Row label="Employee Code" value={emp.employeeId} />
                  <Row label="Department" value={emp.department} />
                  <Row label="Position" value={emp.position} />
                  <Row label="Job Title" value={emp.jobTitle} />
                  <Row label="Job Family" value={emp.jobFamily} />
                  <Row label="Grade" value={emp.grade} />
                  <Row label="Division" value={emp.division} />
                  <Row label="Branch" value={emp.branch} />
                  <Row label="Cost Center" value={emp.costCenter} />
                  <Row label="Employment Type" value={emp.employmentType} />
                  <Row label="Hire Date" value={fmtDate(emp.hireDate)} />
                  <Row label="Termination Date" value={fmtDate(emp.terminationDate)} />
                </Section>
                <Section title="Payment & Contact">
                  <Row label="Salary" value={fmtMoney(emp.salary, emp.currency || 'KES')} />
                  <Row label="Currency" value={emp.currency} />
                  <Row label="Bank" value={emp.bankName} />
                  <Row label="Bank Account" value={mask(emp.bankAccount)} />
                  <Row label="Address" value={emp.address} />
                  <Row label="City" value={emp.city} />
                  <Row label="Country" value={emp.country} />
                  <Row label="Emergency Contact" value={emp.emergencyContact} />
                  <Row label="Emergency Phone" value={emp.emergencyPhone} />
                </Section>
                {emp.notes && (
                  <div className="lg:col-span-2 bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                    <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Notes
                    </h3>
                    <p className="text-sm whitespace-pre-wrap text-neutral-300">{emp.notes}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'documents' && (
              <Panel
                empty="No documents uploaded yet"
                rows={data.documents}
                cols={[
                  { k: 'name', label: 'Document', bold: true },
                  { k: 'type', label: 'Type' },
                  { k: 'createdAt', label: 'Uploaded', date: true },
                  { k: 'url', label: 'File', link: (r: any) => r.url, linkLabel: 'Open' },
                ]}
              />
            )}

            {tab === 'leave' && (
              <>
                {counts.balances > 0 && (
                  <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-4">
                    <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Current balances</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(data.balances || []).map((b: any) => {
                        const pct = Number(b.totalDays || 0) > 0 ? (Number(b.remainingDays || 0) / Number(b.totalDays)) * 100 : 0
                        const tone = pct >= 50 ? 'text-green-400' : pct >= 20 ? 'text-amber-400' : 'text-red-400'
                        return (
                          <div key={b.id} className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-800">
                            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{b.leaveTypeName}</p>
                            <p className={'text-lg font-bold ' + tone}>{b.remainingDays} / {b.totalDays}</p>
                            <p className="text-[10px] text-neutral-500">{b.usedDays} used · {b.year}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <Panel
                  empty="No leave requests"
                  rows={data.leaves}
                  cols={[
                    { k: 'leaveTypeName', label: 'Type', bold: true },
                    { k: 'startDate', label: 'From', date: true },
                    { k: 'endDate', label: 'To', date: true },
                    { k: 'days', label: 'Days' },
                    { k: 'status', label: 'Status' },
                  ]}
                />
              </>
            )}

            {tab === 'attendance' && (
              <Panel
                empty="No attendance records"
                rows={data.attendance}
                cols={[
                  { k: 'date', label: 'Date', date: true },
                  { k: 'checkIn', label: 'Check In', date: true },
                  { k: 'checkOut', label: 'Check Out', date: true },
                  { k: 'status', label: 'Status' },
                  { k: 'notes', label: 'Notes' },
                ]}
              />
            )}

            {tab === 'payroll' && (
              <Panel
                empty="No payslips yet"
                rows={data.payrolls}
                cols={[
                  { k: 'periodName', label: 'Period', bold: true },
                  { k: 'grossPay', label: 'Gross', money: true },
                  { k: 'paye', label: 'PAYE', money: true },
                  { k: 'nssf', label: 'NSSF', money: true },
                  { k: 'shif', label: 'SHIF', money: true },
                  { k: 'netPay', label: 'Net', money: true, bold: true },
                  { k: 'id', label: 'Payslip', link: (r: any) => '/api/wavecore/hr/payroll/payslip/' + r.id + '/pdf', linkLabel: 'Download' },
                ]}
              />
            )}

            {tab === 'training' && (
              <Panel
                empty="No training enrollments"
                rows={data.trainings}
                cols={[
                  { k: 'title', label: 'Training', bold: true },
                  { k: 'type', label: 'Type' },
                  { k: 'provider', label: 'Provider' },
                  { k: 'startDate', label: 'Start', date: true },
                  { k: 'status', label: 'Status' },
                ]}
              />
            )}

            {tab === 'performance' && (
              <Panel
                empty="No performance reviews"
                rows={data.reviews}
                cols={[
                  { k: 'reviewDate', label: 'Date', date: true, bold: true },
                  { k: 'rating', label: 'Rating' },
                  { k: 'strengths', label: 'Strengths' },
                  { k: 'improvements', label: 'Improvements' },
                ]}
              />
            )}
          </>
        )}

      </main>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">{title}</h3>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  )
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-neutral-500">{label}</span>
      <span className="text-white text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  )
}

function Panel({ rows, cols, empty }: any) {
  if (!rows || rows.length === 0) return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center text-neutral-500 text-sm">
      {empty}
    </div>
  )
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-800">
            <tr>
              {cols.map((c: any) => (
                <th key={c.k} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-800/30">
                {cols.map((c: any) => {
                  let v = r[c.k]
                  if (c.date) v = fmtDate(v)
                  else if (c.money) v = fmtMoney(v)
                  else if (v === null || v === undefined || v === '') v = '—'
                  return (
                    <td key={c.k} className={'p-3 text-sm ' + (c.bold ? 'text-white font-bold' : 'text-neutral-300')}>
                      {c.link ? (
                        <a href={c.link(r)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs font-bold">
                          {c.linkLabel || 'Open'}
                        </a>
                      ) : v}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}