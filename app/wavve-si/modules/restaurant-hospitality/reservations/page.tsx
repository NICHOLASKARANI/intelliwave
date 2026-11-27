'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, RefreshCw, Calendar, Users, Clock, CheckCircle2 } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface Reservation {
  id: string
  customerName: string
  customerPhone: string | null
  partySize: number
  reservationAt: string
  durationMins: number
  tableName: string | null
  status: string
  notes: string | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-900/20 text-amber-400 border-amber-800/40',
  CONFIRMED: 'bg-blue-900/20 text-blue-400 border-blue-800/40',
  SEATED:    'bg-green-900/20 text-green-400 border-green-800/40',
  COMPLETED: 'bg-neutral-900/20 text-neutral-400 border-neutral-800/40',
  CANCELLED: 'bg-red-900/20 text-red-400 border-red-800/40',
  NO_SHOW:   'bg-orange-900/20 text-orange-400 border-orange-800/40',
}

export default function ReservationsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const url = '/api/wavve-si/restaurant/reservations' + (status ? '?status=' + status : '')
      const res = await authedFetch(url)
      if (!res.ok) throw new Error('Failed to load')
      const j = await res.json()
      setRows(j.reservations || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [status])

  async function setStatusFor(id: string, newStatus: string) {
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/reservations/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) load()
    } catch {}
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavve-si/modules/restaurant-hospitality" className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            Reservations
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage table reservations — parties, times, status</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
        <button onClick={() => router.push('/wavve-si/modules/restaurant-hospitality/reservations/new')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Reservation
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={'px-3 py-1.5 rounded-lg text-xs font-bold border ' +
              (status === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700')}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm">{error}</div>
      )}

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin inline-block text-indigo-500" /></td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                No reservations yet
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-t border-neutral-100 dark:border-neutral-800">
                <td className="px-4 py-3">
                  <div className="font-bold">{r.customerName}</div>
                  {r.customerPhone && <div className="text-xs text-neutral-500">{r.customerPhone}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {r.partySize}</span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(r.reservationAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {r.durationMins}m</span>
                </td>
                <td className="px-4 py-3 text-neutral-500">{r.tableName || '—'}</td>
                <td className="px-4 py-3">
                  <span className={'px-2 py-1 rounded-md text-xs font-bold border ' + (STATUS_COLORS[r.status] || '')}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  {r.status === 'PENDING' && (
                    <button onClick={() => setStatusFor(r.id, 'CONFIRMED')}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300">Confirm</button>
                  )}
                  {r.status === 'CONFIRMED' && (
                    <button onClick={() => setStatusFor(r.id, 'SEATED')}
                      className="text-xs font-bold text-green-400 hover:text-green-300">Seat</button>
                  )}
                  {r.status === 'SEATED' && (
                    <button onClick={() => setStatusFor(r.id, 'COMPLETED')}
                      className="text-xs font-bold text-neutral-400 hover:text-neutral-300">Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}