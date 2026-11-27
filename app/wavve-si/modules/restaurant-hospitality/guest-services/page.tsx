'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Loader2, RefreshCw, BellRing, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface GSRequest {
  id: string
  requestNumber: string
  roomNumber: string | null
  guestName: string
  category: string
  priority: string
  status: string
  subject: string
  assignedToName: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:        'bg-amber-900/20 text-amber-400 border-amber-800/40',
  ASSIGNED:    'bg-blue-900/20 text-blue-400 border-blue-800/40',
  IN_PROGRESS: 'bg-indigo-900/20 text-indigo-400 border-indigo-800/40',
  RESOLVED:    'bg-green-900/20 text-green-400 border-green-800/40',
  CLOSED:      'bg-neutral-900/20 text-neutral-400 border-neutral-800/40',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    'text-neutral-400',
  NORMAL: 'text-neutral-300',
  HIGH:   'text-orange-400',
  URGENT: 'text-red-400 font-bold',
}

export default function GuestServicesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<GSRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const url = '/api/wavve-si/restaurant/guest-services' + (status ? '?status=' + status : '')
      const res = await authedFetch(url)
      if (!res.ok) throw new Error('Failed to load')
      const j = await res.json()
      setRows(j.requests || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [status])

  async function changeStatus(id: string, newStatus: string) {
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/guest-services/' + id, {
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
            <BellRing className="w-6 h-6 text-amber-500" /> Guest Services
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Guest requests, complaints, and concierge services</p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
        <button onClick={() => router.push('/wavve-si/modules/restaurant-hospitality/guest-services/new')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {['', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={'px-3 py-1.5 rounded-lg text-xs font-bold border ' +
              (status === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700')}>
            {s.replace('_', ' ') || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Guest / Room</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin inline-block text-indigo-500" /></td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" /> No guest requests yet
              </td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id}
                onClick={() => router.push('/wavve-si/modules/restaurant-hospitality/guest-services/' + r.id)}
                className="border-t border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <td className="px-4 py-3 font-mono text-xs text-indigo-400">{r.requestNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-bold">{r.guestName}</div>
                  {r.roomNumber && <div className="text-xs text-neutral-500">Room {r.roomNumber}</div>}
                </td>
                <td className="px-4 py-3">{r.subject}</td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{r.category.replace('_', ' ')}</td>
                <td className="px-4 py-3"><span className={PRIORITY_COLORS[r.priority] || ''}>{r.priority}</span></td>
                <td className="px-4 py-3">
                  <span className={'px-2 py-1 rounded-md text-xs font-bold border ' + (STATUS_COLORS[r.status] || '')}>{r.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3">
                  {r.status === 'OPEN' && (
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(r.id, 'ASSIGNED') }}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300">Assign</button>
                  )}
                  {r.status === 'ASSIGNED' && (
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(r.id, 'IN_PROGRESS') }}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Start</button>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(r.id, 'RESOLVED') }}
                      className="text-xs font-bold text-green-400 hover:text-green-300">Resolve</button>
                  )}
                  {r.status === 'RESOLVED' && (
                    <button onClick={(e) => { e.stopPropagation(); changeStatus(r.id, 'CLOSED') }}
                      className="text-xs font-bold text-neutral-400 hover:text-neutral-300">Close</button>
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