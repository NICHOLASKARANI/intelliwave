'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

const TASK_TYPES = ['CLEANING', 'DEEP_CLEAN', 'MAINTENANCE', 'INSPECTION', 'TURNDOWN', 'VACANT_CLEAN']
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Conference', 'Common Area']

export default function NewHousekeepingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [roomNumber, setRoomNumber] = useState('')
  const [roomType, setRoomType] = useState('Standard')
  const [taskType, setTaskType] = useState('CLEANING')
  const [priority, setPriority] = useState('NORMAL')
  const [assignedToName, setAssignedToName] = useState('')
  const [notes, setNotes] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')

  async function handleSave() {
    setError('')
    if (!roomNumber.trim()) { setError('Room number is required'); return }

    setSaving(true)
    try {
      const res = await authedFetch('/api/wavve-si/restaurant/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: roomNumber.trim(),
          roomType: roomType || null,
          taskType,
          priority,
          assignedToName: assignedToName.trim() || null,
          notes: notes.trim() || null,
          scheduledFor: scheduledFor || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to create task')
      }
      router.push('/wavve-si/modules/restaurant-hospitality/housekeeping')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavve-si/modules/restaurant-hospitality/housekeeping"
          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> New Housekeeping Task
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Assign a cleaning or maintenance task</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Room Number *">
            <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
              placeholder="e.g., 204 or Suite A"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <Field label="Room Type">
            <select value={roomType} onChange={e => setRoomType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Task Type *">
            <select value={taskType} onChange={e => setTaskType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
              {TASK_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Assign To (staff name)">
          <input value={assignedToName} onChange={e => setAssignedToName(e.target.value)}
            placeholder="e.g., Mary Wanjiku"
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
        </Field>

        <Field label="Scheduled For (optional)">
          <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
        </Field>

        <Field label="Notes">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Special instructions, e.g., VIP guest, allergies, etc."
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm resize-none" />
        </Field>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Task
          </button>
          <Link href="/wavve-si/modules/restaurant-hospitality/housekeeping"
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