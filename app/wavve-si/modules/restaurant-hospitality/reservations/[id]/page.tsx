'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Users, Calendar, Clock, Phone, Mail, Save, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface Reservation {
  id: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  partySize: number
  reservationAt: string
  durationMins: number
  tableId: string | null
  tableName: string | null
  status: string
  notes: string | null
}

const STATUS_FLOW: Record<string, { next: string; label: string; color: string }[]> = {
  PENDING:   [{ next: 'CONFIRMED', label: 'Confirm', color: 'bg-blue-600 hover:bg-blue-700' }, { next: 'CANCELLED', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' }],
  CONFIRMED: [{ next: 'SEATED', label: 'Seat Guest', color: 'bg-green-600 hover:bg-green-700' }, { next: 'NO_SHOW', label: 'No Show', color: 'bg-orange-600 hover:bg-orange-700' }, { next: 'CANCELLED', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' }],
  SEATED:    [{ next: 'COMPLETED', label: 'Complete Meal', color: 'bg-neutral-600 hover:bg-neutral-700' }],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW:   [],
}

export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [r, setR] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/reservations/' + params.id)
      if (!res.ok) throw new Error('Not found')
      const j = await res.json()
      setR(j.reservation)
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
      const res = await authedFetch('/api/wavve-si/restaurant/reservations/' + r.id, {
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
    if (!r) return
    if (!confirm('Delete this reservation? This cannot be undone.')) return
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/reservations/' + r.id, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/wavve-si/modules/restaurant-hospitality/reservations')
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (loading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin inline-block text-indigo-500" /></div>
  }
  if (error || !r) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error || 'Reservation not found'}
        </div>
        <Link href="/wavve-si/modules/restaurant-hospitality/reservations"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">
          Back to Reservations
        </Link>
      </div>
    )
  }

  const transitions = STATUS_FLOW[r.status] || []

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavve-si/modules/restaurant-hospitality/reservations"
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{r.customerName}</h1>
          <p className="text-sm text-neutral-500 mt-1">Reservation details &amp; status</p>
        </div>
        <button onClick={handleDelete}
          className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 hover:bg-red-900/30 font-bold text-sm flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow icon={Users} label="Party Size" value={r.partySize + ' guests'} />
          <InfoRow icon={Calendar} label="When" value={new Date(r.reservationAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })} />
          <InfoRow icon={Clock} label="Duration" value={r.durationMins + ' minutes'} />
          <InfoRow icon={CheckCircle2} label="Status" value={r.status} />
          {r.customerPhone && <InfoRow icon={Phone} label="Phone" value={r.customerPhone} />}
          {r.customerEmail && <InfoRow icon={Mail} label="Email" value={r.customerEmail} />}
          {r.tableName && <InfoRow icon={CheckCircle2} label="Table" value={r.tableName} />}
        </div>

        {r.notes && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Notes</p>
            <p className="text-sm">{r.notes}</p>
          </div>
        )}
      </div>

      {transitions.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Actions</p>
          <div className="flex flex-wrap gap-3">
            {transitions.map(t => (
              <button key={t.next} onClick={() => changeStatus(t.next)} disabled={saving}
                className={'px-5 py-2.5 rounded-xl text-white font-bold text-sm ' + t.color + ' disabled:opacity-50'}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t.label}
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