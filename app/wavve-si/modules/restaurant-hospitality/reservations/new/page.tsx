'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Calendar, Users, Clock, AlertCircle } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface Table { id: string; name: string; capacity: number; location?: string }

export default function NewReservationPage() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [partySize, setPartySize] = useState<number>(2)
  const [reservationAt, setReservationAt] = useState('')
  const [durationMins, setDurationMins] = useState<number>(90)
  const [tableId, setTableId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    authedFetch('/api/wavve-si/restaurant/tables')
      .then(r => r.json())
      .then(d => setTables(d.tables || []))
      .catch(() => {})
  }, [])

  async function handleSave() {
    setError('')
    if (!customerName.trim()) { setError('Customer name is required'); return }
    if (partySize < 1)        { setError('Party size must be at least 1'); return }
    if (!reservationAt)       { setError('Reservation date/time is required'); return }

    setSaving(true)
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          customerEmail: customerEmail.trim() || null,
          partySize: Number(partySize),
          reservationAt,
          durationMins: Number(durationMins),
          tableId: tableId || null,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to create reservation')
      }
      router.push('/wavve-si/modules/restaurant-hospitality/reservations')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavve-si/modules/restaurant-hospitality/reservations"
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-500" /> New Reservation
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Book a table for a customer</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
        <Field label="Customer Name *">
          <input value={customerName} onChange={e => setCustomerName(e.target.value)}
            placeholder="e.g., John Mwangi"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Phone">
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <Field label="Email">
            <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Party Size *">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="number" min={1} value={partySize} onChange={e => setPartySize(parseInt(e.target.value) || 1)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
          </Field>
          <Field label="Duration (mins)">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="number" min={15} step={15} value={durationMins} onChange={e => setDurationMins(parseInt(e.target.value) || 90)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
          </Field>
          <Field label="Table (optional)">
            <select value={tableId} onChange={e => setTableId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
              <option value="">— No table yet —</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.capacity} seats)</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Reservation Date &amp; Time *">
          <input type="datetime-local" value={reservationAt} onChange={e => setReservationAt(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
        </Field>

        <Field label="Notes">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Special requests, allergies, occasion..."
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm resize-none" />
        </Field>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Reservation
          </button>
          <Link href="/wavve-si/modules/restaurant-hospitality/reservations"
            className="px-6 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}