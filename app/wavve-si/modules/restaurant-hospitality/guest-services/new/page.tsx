'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, BellRing, AlertCircle } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

const CATEGORIES = ['HOUSEKEEPING', 'ROOM_SERVICE', 'MAINTENANCE', 'CONCIERGE', 'TRANSPORT', 'COMPLAINT', 'FEEDBACK', 'OTHER']
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

export default function NewGuestServicePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [roomNumber, setRoomNumber] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [category, setCategory] = useState('OTHER')
  const [priority, setPriority] = useState('NORMAL')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [assignedToName, setAssignedToName] = useState('')

  async function handleSave() {
    setError('')
    if (!guestName.trim()) { setError('Guest name is required'); return }
    if (!subject.trim())   { setError('Subject is required'); return }

    setSaving(true)
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/guest-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: roomNumber.trim() || null,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || null,
          guestEmail: guestEmail.trim() || null,
          category, priority,
          subject: subject.trim(),
          description: description.trim() || null,
          assignedToName: assignedToName.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to create request')
      }
      router.push('/wavve-si/modules/restaurant-hospitality/guest-services')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavve-si/modules/restaurant-hospitality/guest-services"
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BellRing className="w-6 h-6 text-amber-500" /> New Guest Request
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Log a guest service request</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Guest Name *">
            <input value={guestName} onChange={e => setGuestName(e.target.value)}
              placeholder="e.g., Jane Wanjiru"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <Field label="Room Number">
            <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
              placeholder="e.g., 305"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Phone">
            <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <Field label="Email">
            <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
              placeholder="guest@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Category">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Subject *">
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Short summary, e.g., Extra towels requested"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
        </Field>

        <Field label="Assign To (staff name)">
          <input value={assignedToName} onChange={e => setAssignedToName(e.target.value)}
            placeholder="e.g., Grace Kimani"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="Full details of the request"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm resize-none" />
        </Field>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Request
          </button>
          <Link href="/wavve-si/modules/restaurant-hospitality/guest-services"
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