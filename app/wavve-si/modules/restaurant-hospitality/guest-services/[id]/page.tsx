'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, BellRing, Calendar, User, AlertCircle, Trash2, CheckCircle2, Mail, Phone } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface GSRequest {
  id: string
  requestNumber: string
  roomNumber: string | null
  guestName: string
  guestPhone: string | null
  guestEmail: string | null
  category: string
  priority: string
  status: string
  subject: string
  description: string | null
  resolutionNotes: string | null
  assignedToName: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
}

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }[]> = {
  OPEN:        [{ next: 'ASSIGNED', label: 'Assign', color: 'bg-blue-600 hover:bg-blue-700' }, { next: 'CLOSED', label: 'Close', color: 'bg-red-600 hover:bg-red-700' }],
  ASSIGNED:    [{ next: 'IN_PROGRESS', label: 'Start Work', color: 'bg-indigo-600 hover:bg-indigo-700' }],
  IN_PROGRESS: [{ next: 'RESOLVED', label: 'Mark Resolved', color: 'bg-green-600 hover:bg-green-700' }],
  RESOLVED:    [{ next: 'CLOSED', label: 'Close', color: 'bg-neutral-600 hover:bg-neutral-700' }],
  CLOSED:      [],
}

export default function GuestServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [r, setR] = useState<GSRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [resolution, setResolution] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/guest-services/' + params.id)
      if (!res.ok) throw new Error('Not found')
      const j = await res.json()
      setR(j.request)
      setResolution(j.request.resolutionNotes || '')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [params.id])

  async function changeStatus(newStatus: string) {
    if (!r) return
    setSaving(true)
    try {
      const body: any = { status: newStatus }
      if (newStatus === 'RESOLVED' && resolution.trim()) body.resolutionNotes = resolution.trim()
      const res = await authedFetch('/api/wavve-si/restaurant/guest-services/' + r.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    if (!r) return
    if (!confirm('Delete this request? This cannot be undone.')) return
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/guest-services/' + r.id, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/wavve-si/modules/restaurant-hospitality/guest-services')
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin inline-block text-indigo-500" /></div>
  if (error || !r) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error || 'Request not found'}
        </div>
        <Link href="/wavve-si/modules/restaurant-hospitality/guest-services"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">
          Back to Guest Services
        </Link>
      </div>
    )
  }

  const transitions = STATUS_FLOW[r.status] || []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavve-si/modules/restaurant-hospitality/guest-services"
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{r.subject}</h1>
          <p className="text-sm text-neutral-500 mt-1">{r.requestNumber} · {r.guestName}{r.roomNumber ? ' · Room ' + r.roomNumber : ''}</p>
        </div>
        <button onClick={handleDelete}
          className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 hover:bg-red-900/30 font-bold text-sm flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow icon={BellRing} label="Status" value={r.status.replace('_', ' ')} />
          <InfoRow icon={AlertCircle} label="Priority" value={r.priority} />
          <InfoRow icon={CheckCircle2} label="Category" value={r.category.replace('_', ' ')} />
          <InfoRow icon={User} label="Assigned To" value={r.assignedToName || '—'} />
          <InfoRow icon={Calendar} label="Created" value={new Date(r.createdAt).toLocaleString('en-GB')} />
          {r.resolvedAt && <InfoRow icon={CheckCircle2} label="Resolved" value={new Date(r.resolvedAt).toLocaleString('en-GB')} />}
          {r.guestPhone && <InfoRow icon={Phone} label="Phone" value={r.guestPhone} />}
          {r.guestEmail && <InfoRow icon={Mail} label="Email" value={r.guestEmail} />}
        </div>

        {r.description && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Description</p>
            <p className="text-sm">{r.description}</p>
          </div>
        )}

        {r.resolutionNotes && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Resolution</p>
            <p className="text-sm text-green-400">{r.resolutionNotes}</p>
          </div>
        )}

        {r.status === 'IN_PROGRESS' && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Resolution Notes (optional)</p>
            <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
              placeholder="How was this resolved?"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm resize-none" />
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