'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Target, Printer, Trash2,
  User, Mail, Phone, Building2, Calendar, DollarSign, Save, X, Edit3,
  Activity as ActivityIcon,
} from 'lucide-react'

interface Opportunity {
  id: string
  name: string
  amount: number
  stage: string
  probability: number
  expectedCloseDate?: string
  notes?: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerCompany?: string
  createdAt: string
}

interface LinkedActivity {
  id: string
  type: string
  subject: string
  description?: string
  dueDate?: string
  completed: boolean
  createdAt: string
}

const STAGE_COLORS: Record<string, string> = {
  PROSPECTING:    'bg-blue-900/50 text-blue-300',
  QUALIFICATION:  'bg-yellow-900/50 text-yellow-300',
  NEEDS_ANALYSIS: 'bg-cyan-900/50 text-cyan-300',
  PROPOSAL:       'bg-purple-900/50 text-purple-300',
  NEGOTIATION:    'bg-orange-900/50 text-orange-300',
  CLOSED_WON:     'bg-green-900/50 text-green-300',
  CLOSED_LOST:    'bg-red-900/50 text-red-300',
}

const STAGES = ['PROSPECTING','QUALIFICATION','NEEDS_ANALYSIS','PROPOSAL','NEGOTIATION','CLOSED_WON','CLOSED_LOST']

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtMoney = (n: any) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [activities, setActivities] = useState<LinkedActivity[]>([])
  const [working, setWorking] = useState(false)
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState<any>({})

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/opportunities/' + id, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setOpportunity(data.opportunity)
      setActivities(data.activities || [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const startEdit = () => {
    if (!opportunity) return
    setForm({
      name: opportunity.name || '',
      amount: opportunity.amount ?? 0,
      stage: opportunity.stage || 'QUALIFICATION',
      probability: opportunity.probability ?? 0,
      expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.slice(0, 10) : '',
      notes: opportunity.notes || '',
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/crm/opportunities/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          name: form.name,
          amount: Number(form.amount) || 0,
          stage: form.stage,
          probability: parseInt(form.probability) || 0,
          expectedCloseDate: form.expectedCloseDate || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      setOpportunity(data.opportunity)
      setEditing(false)
      flash('Opportunity updated')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const deleteOpportunity = async () => {
    if (!opportunity) return
    if (!confirm('Delete opportunity "' + opportunity.name + '"? This cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/crm/opportunities/' + id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Delete failed')
        return
      }
      router.push('/wavecore-erp/crm/opportunities')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error && !opportunity) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/crm/opportunities" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold">Opportunity</span>
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

  if (!opportunity) return null

  const weighted = (Number(opportunity.amount || 0) * Number(opportunity.probability || 0)) / 100

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm/opportunities" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Opportunity</p>
              <p className="font-bold">{opportunity.name}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (STAGE_COLORS[opportunity.stage] || 'bg-neutral-800 text-neutral-300')}>
              {opportunity.stage}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={'/api/wavecore/crm/opportunities/' + id + '/pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </a>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            )}
            <button
              onClick={deleteOpportunity}
              disabled={working}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">

        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
                <Target className="w-8 h-8" /> {opportunity.name}
              </h1>
              <p className="text-white/80 text-sm">Weighted value: {fmtMoney(weighted)} · {opportunity.probability}% probability</p>
            </div>
            <div className="text-right text-sm">
              <p>Created {fmtDate(opportunity.createdAt)}</p>
              {opportunity.expectedCloseDate && <p>Expected close {fmtDate(opportunity.expectedCloseDate)}</p>}
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
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Edit opportunity</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Amount (KSh)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Probability (%)</label>
                <input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Stage</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Expected close date</label>
                <input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 mb-6">

            <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Customer
              </h3>
              {opportunity.customerId ? (
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-neutral-900 dark:text-white">{opportunity.customerName || 'Unknown'}</p>
                  {opportunity.customerCompany && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Building2 className="w-3.5 h-3.5" /> {opportunity.customerCompany}</p>}
                  {opportunity.customerEmail && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5" /> {opportunity.customerEmail}</p>}
                  {opportunity.customerPhone && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Phone className="w-3.5 h-3.5" /> {opportunity.customerPhone}</p>}
                  <Link href={'/wavecore-erp/crm/customers/' + opportunity.customerId} className="inline-block text-xs text-indigo-500 hover:underline pt-2">
                    View customer →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No customer linked</p>
              )}
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Summary
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-neutral-500">Amount</span>
                <span className="text-right font-medium">{fmtMoney(opportunity.amount)}</span>

                <span className="text-neutral-500">Probability</span>
                <span className="text-right font-medium">{opportunity.probability}%</span>

                <span className="text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-3">Weighted value</span>
                <span className="text-right font-bold text-lg border-t border-neutral-100 dark:border-neutral-800 pt-3">{fmtMoney(weighted)}</span>

                <span className="text-neutral-500">Stage</span>
                <span className="text-right">
                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (STAGE_COLORS[opportunity.stage] || '')}>{opportunity.stage}</span>
                </span>

                <span className="text-neutral-500">Expected close</span>
                <span className="text-right">{fmtDate(opportunity.expectedCloseDate)}</span>
              </div>
            </div>
          </div>
        )}

        {opportunity.notes && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{opportunity.notes}</p>
          </div>
        )}

        {activities.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4" /> Linked activities ({activities.length})
            </h3>
            <div className="space-y-2">
              {activities.map(a => (
                <div key={a.id} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold">{a.subject}</p>
                      <p className="text-xs text-neutral-500">{a.type} · {a.completed ? 'done' : 'pending'} · {fmtDate(a.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}