'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Activity as ActivityIcon, Printer, Trash2,
  User, Mail, Phone, Calendar, Save, X, Edit3, CheckCircle2, Circle, Clock,
  Phone as PhoneIcon, MessageSquare, Users as UsersIcon, Target,
} from 'lucide-react'

interface Activity {
  id: string
  type: string
  subject: string
  description?: string
  dueDate?: string
  completed: boolean
  priority?: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  leadId?: string
  leadName?: string
  leadCompany?: string
  opportunityId?: string
  opportunityName?: string
  opportunityAmount?: number
  createdAt: string
}

const TYPE_COLORS: Record<string, string> = {
  CALL:    'bg-blue-900/40 text-blue-300',
  EMAIL:   'bg-green-900/40 text-green-300',
  MEETING: 'bg-purple-900/40 text-purple-300',
  NOTE:    'bg-amber-900/40 text-amber-300',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    'bg-neutral-800 text-neutral-300',
  MEDIUM: 'bg-amber-900/50 text-amber-300',
  HIGH:   'bg-red-900/50 text-red-300',
}

const TYPES = ['CALL','EMAIL','MEETING','NOTE']
const PRIORITIES = ['LOW','MEDIUM','HIGH']

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('en-GB') : '—'

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activity, setActivity] = useState<Activity | null>(null)
  const [working, setWorking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/activities/' + id, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setActivity(data.activity)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const startEdit = () => {
    if (!activity) return
    setForm({
      type: activity.type || 'NOTE',
      subject: activity.subject || '',
      description: activity.description || '',
      dueDate: activity.dueDate ? activity.dueDate.slice(0, 10) : '',
      priority: activity.priority || 'MEDIUM',
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/crm/activities/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          type: form.type,
          subject: form.subject,
          description: form.description || null,
          dueDate: form.dueDate || null,
          priority: form.priority,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      setActivity({ ...activity, ...data.activity })
      setEditing(false)
      flash('Activity updated')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const toggleComplete = async () => {
    if (!activity) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/crm/activities/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ completed: !activity.completed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Update failed'); return }
      setActivity({ ...activity, ...data.activity })
      flash(data.activity.completed ? 'Marked complete' : 'Reopened')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const deleteActivity = async () => {
    if (!activity) return
    if (!confirm('Delete activity "' + activity.subject + '"? This cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/crm/activities/' + id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Delete failed')
        return
      }
      router.push('/wavecore-erp/crm/activities')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error && !activity) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/crm/activities" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold">Activity</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-8">
          <div className="p-6 rounded-2xl bg-red-900/20 border border-red-800 text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        </main>
      </div>
    )
  }

  if (!activity) return null

  const overdue = activity.dueDate && !activity.completed && new Date(activity.dueDate).getTime() < Date.now()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm/activities" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Activity</p>
              <p className="font-bold truncate max-w-[280px]">{activity.subject}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (TYPE_COLORS[activity.type] || 'bg-neutral-800 text-neutral-300')}>
              {activity.type}
            </span>
            {activity.completed ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/50 text-green-300">completed</span>
            ) : overdue ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/50 text-red-300">overdue</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300">open</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={'/api/wavecore/crm/activities/' + id + '/pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </a>
            <button
              onClick={toggleComplete}
              disabled={working}
              className={
                'px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-40 ' +
                (activity.completed
                  ? 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white')
              }
            >
              {activity.completed ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {activity.completed ? 'Reopen' : 'Mark complete'}
            </button>
            {!editing ? (
              <button
                onClick={startEdit}
                className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  disabled={working}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={working}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            )}
            <button
              onClick={deleteActivity}
              disabled={working}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">

        <div className={'rounded-3xl p-6 lg:p-8 mb-6 text-white ' + (activity.completed ? 'bg-gradient-to-br from-neutral-600 to-neutral-700' : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700')}>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
                <ActivityIcon className="w-8 h-8" /> {activity.subject}
              </h1>
              <p className="text-white/80 text-sm">Created {fmtDateTime(activity.createdAt)}</p>
            </div>
            <div className="text-right text-sm">
              {activity.dueDate && <p className={overdue ? 'font-bold' : ''}>Due {fmtDate(activity.dueDate)}{overdue ? ' · OVERDUE' : ''}</p>}
              {activity.priority && <p>Priority: {activity.priority}</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-900/30 text-emerald-300 border border-emerald-800">
            {success}
          </div>
        )}

        {editing ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Edit activity</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Subject</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Due date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4" /> Description
              </h3>
              {activity.description ? (
                <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{activity.description}</p>
              ) : (
                <p className="text-sm text-neutral-400 italic">No description</p>
              )}
            </div>

            <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Type</span>
                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (TYPE_COLORS[activity.type] || '')}>{activity.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Priority</span>
                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (PRIORITY_COLORS[activity.priority || 'MEDIUM'] || '')}>{activity.priority || 'MEDIUM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status</span>
                  <span>{activity.completed ? 'Completed' : 'Open'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Due</span>
                  <span className={overdue ? 'text-red-500 font-bold' : ''}>{fmtDate(activity.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Linked records */}
        {(activity.customerId || activity.leadId || activity.opportunityId) && (
          <div className="grid md:grid-cols-3 gap-4">
            {activity.customerId && (
              <Link href={'/wavecore-erp/crm/customers/' + activity.customerId} className="block p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 transition">
                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-neutral-500 font-bold">
                  <UsersIcon className="w-4 h-4" /> Customer
                </div>
                <p className="font-bold text-sm">{activity.customerName || 'Unknown'}</p>
                {activity.customerEmail && <p className="text-xs text-neutral-500 truncate flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {activity.customerEmail}</p>}
                {activity.customerPhone && <p className="text-xs text-neutral-500 truncate flex items-center gap-1"><Phone className="w-3 h-3" /> {activity.customerPhone}</p>}
              </Link>
            )}
            {activity.leadId && (
              <Link href={'/wavecore-erp/crm/leads/' + activity.leadId} className="block p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-green-400 transition">
                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-neutral-500 font-bold">
                  <Target className="w-4 h-4" /> Lead
                </div>
                <p className="font-bold text-sm">{activity.leadName || 'Unknown'}</p>
                {activity.leadCompany && <p className="text-xs text-neutral-500 mt-1">{activity.leadCompany}</p>}
              </Link>
            )}
            {activity.opportunityId && (
              <Link href={'/wavecore-erp/crm/opportunities/' + activity.opportunityId} className="block p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-400 transition">
                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-neutral-500 font-bold">
                  <Target className="w-4 h-4" /> Opportunity
                </div>
                <p className="font-bold text-sm">{activity.opportunityName || 'Unknown'}</p>
                {activity.opportunityAmount != null && <p className="text-xs text-neutral-500 mt-1">KSh {Number(activity.opportunityAmount).toLocaleString()}</p>}
              </Link>
            )}
          </div>
        )}

      </main>
    </div>
  )
}