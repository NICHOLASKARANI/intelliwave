'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Clock, Trash2, Edit3, Save, X as XIcon,
  Calendar, User, CheckCircle2, FileText,
} from 'lucide-react'

interface Attendance {
  id: string
  date: string
  checkIn?: string
  checkOut?: string
  status: string
  notes?: string
  employeeId: string
  employeeName?: string
  empCode?: string
  department?: string
  hoursWorked?: number
  createdAt: string
}

const STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'REMOTE']

const statusStyle = (s: string) => {
  switch (s) {
    case 'PRESENT': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'LATE':    return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'ABSENT':  return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'LEAVE':   return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    case 'REMOTE':  return 'bg-purple-900/40 text-purple-300 border border-purple-700'
    default:        return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—'
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'

export default function AttendanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rec, setRec] = useState<Attendance | null>(null)
  const [working, setWorking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/hr/attendance/' + id, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      // The endpoint returns { attendance: row } without employee join;
      // also fetch the list to enrich with name + code.
      const a = data.attendance
      let enriched = a
      try {
        const listRes = await fetch('/api/wavecore/hr/attendance', { cache: 'no-store' })
        const listData = await listRes.json()
        const match = (listData.attendance || []).find((x: any) => x.id === a.id)
        if (match) enriched = { ...a, ...match }
      } catch {}
      setRec(enriched)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const startEdit = () => {
    if (!rec) return
    setForm({
      status: rec.status || 'PRESENT',
      checkIn: rec.checkIn ? new Date(rec.checkIn).toISOString().slice(11, 16) : '',
      checkOut: rec.checkOut ? new Date(rec.checkOut).toISOString().slice(11, 16) : '',
      notes: rec.notes || '',
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!rec) return
    setWorking(true)
    setError('')
    try {
      const baseDate = rec.date ? new Date(rec.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      const body: any = {
        status: form.status,
        notes: form.notes || null,
      }
      if (form.checkIn) body.checkIn = baseDate + 'T' + form.checkIn + ':00'
      if (form.checkOut) body.checkOut = baseDate + 'T' + form.checkOut + ':00'

      const res = await fetch('/api/wavecore/hr/attendance/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      flash('Attendance updated')
      setEditing(false)
      load()
    } catch { setError('Network error') }
    finally { setWorking(false) }
  }

  const del = async () => {
    if (!rec) return
    if (!confirm('Delete this attendance record? This cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/hr/attendance/' + id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Delete failed')
        return
      }
      router.push('/wavecore-erp/hr/attendance')
    } catch { setError('Network error') }
    finally { setWorking(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    )
  }

  if (error && !rec) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/hr/attendance" className="p-2 rounded-lg hover:bg-neutral-800 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold text-white">Attendance</span>
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

  if (!rec) return null

  const hours = rec.hoursWorked != null ? Number(rec.hoursWorked) : (
    rec.checkIn && rec.checkOut
      ? Math.max(0, Math.round(((new Date(rec.checkOut).getTime() - new Date(rec.checkIn).getTime()) / 3600000) * 10) / 10)
      : 0
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/hr/attendance" className="p-2 rounded-lg hover:bg-neutral-800 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Attendance</p>
              <p className="font-bold text-white">{rec.employeeName || 'Employee'}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusStyle(rec.status)}>
              {rec.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={startEdit} className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} disabled={working} className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
                  <XIcon className="w-4 h-4" /> Cancel
                </button>
                <button onClick={saveEdit} disabled={working} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
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

      <main className="max-w-4xl mx-auto p-4 lg:p-8">

        <div className="rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
                <Clock className="w-8 h-8" /> {fmtDate(rec.date)}
              </h1>
              <p className="text-white/80 text-sm">{rec.employeeName || 'Employee'} · {rec.empCode || 'no code'} · {rec.department || 'No department'}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-3xl font-bold">{hours}h</p>
              <p className="text-white/80 text-xs">Hours worked</p>
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

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Employee
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Name</span><span className="text-white font-medium">{rec.employeeName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Code</span><span className="text-white font-mono text-xs">{rec.empCode || '—'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Department</span><span className="text-white">{rec.department || '—'}</span></div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Day summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Date</span><span className="text-white">{fmtDate(rec.date)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusStyle(rec.status)}>{rec.status}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Check In</span><span className="text-white font-mono">{fmtTime(rec.checkIn)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Check Out</span><span className="text-white font-mono">{fmtTime(rec.checkOut)}</span></div>
              <div className="flex justify-between border-t border-neutral-800 pt-3"><span className="text-neutral-500">Hours worked</span><span className="text-green-400 font-bold">{hours}h</span></div>
            </div>
          </div>

          {editing && (
            <div className="md:col-span-2 bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Edit attendance</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Check In</label>
                  <input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Check Out</label>
                  <input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
                </div>
              </div>
            </div>
          )}

          {rec.notes && !editing && (
            <div className="md:col-span-2 bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap text-neutral-300">{rec.notes}</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}