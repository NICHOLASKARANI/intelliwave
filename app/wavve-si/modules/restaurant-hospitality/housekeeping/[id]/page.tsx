'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Calendar, User, AlertCircle, Trash2, Clock } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface Task {
  id: string
  roomNumber: string
  roomType: string | null
  taskType: string
  priority: string
  status: string
  assignedToName: string | null
  notes: string | null
  scheduledFor: string | null
  startedAt: string | null
  completedAt: string | null
  verifiedAt: string | null
}

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }[]> = {
  PENDING:     [{ next: 'IN_PROGRESS', label: 'Start Task', color: 'bg-blue-600 hover:bg-blue-700' }, { next: 'CANCELLED', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' }],
  IN_PROGRESS: [{ next: 'COMPLETED', label: 'Mark Complete', color: 'bg-green-600 hover:bg-green-700' }],
  COMPLETED:   [{ next: 'VERIFIED', label: 'Verify', color: 'bg-emerald-600 hover:bg-emerald-700' }],
  VERIFIED:    [],
  CANCELLED:   [],
}

export default function HousekeepingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [t, setT] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/housekeeping/' + params.id)
      if (!res.ok) throw new Error('Not found')
      const j = await res.json()
      setT(j.task)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [params.id])

  async function changeStatus(newStatus: string) {
    if (!t) return
    setSaving(true)
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/housekeeping/' + t.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!t) return
    if (!confirm('Delete this task? This cannot be undone.')) return
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/housekeeping/' + t.id, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/wavve-si/modules/restaurant-hospitality/housekeeping')
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin inline-block text-indigo-500" /></div>
  if (error || !t) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error || 'Task not found'}
        </div>
        <Link href="/wavve-si/modules/restaurant-hospitality/housekeeping"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">
          Back to Housekeeping
        </Link>
      </div>
    )
  }

  const transitions = STATUS_FLOW[t.status] || []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavve-si/modules/restaurant-hospitality/housekeeping"
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Room {t.roomNumber}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t.taskType.replace('_', ' ')} · {t.priority} priority</p>
        </div>
        <button onClick={handleDelete}
          className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 hover:bg-red-900/30 font-bold text-sm flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow icon={Sparkles} label="Status" value={t.status.replace('_', ' ')} />
          <InfoRow icon={User} label="Assigned To" value={t.assignedToName || '—'} />
          <InfoRow icon={Calendar} label="Scheduled For" value={t.scheduledFor ? new Date(t.scheduledFor).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'} />
          <InfoRow icon={Clock} label="Started" value={t.startedAt ? new Date(t.startedAt).toLocaleString('en-GB') : '—'} />
          <InfoRow icon={Clock} label="Completed" value={t.completedAt ? new Date(t.completedAt).toLocaleString('en-GB') : '—'} />
          <InfoRow icon={Sparkles} label="Verified" value={t.verifiedAt ? new Date(t.verifiedAt).toLocaleString('en-GB') : '—'} />
        </div>

        {t.notes && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Notes</p>
            <p className="text-sm">{t.notes}</p>
          </div>
        )}
      </div>

      {transitions.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Actions</p>
          <div className="flex flex-wrap gap-3">
            {transitions.map(tr => (
              <button key={tr.next} onClick={() => changeStatus(tr.next)} disabled={saving}
                className={'px-5 py-2.5 rounded-xl text-white font-bold text-sm ' + tr.color + ' disabled:opacity-50'}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : tr.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <Icon className="w-4 h-4 text-neutral-500" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  )
}