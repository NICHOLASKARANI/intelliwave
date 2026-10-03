'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Target, Printer, Trash2,
  User, Mail, Phone, Building2, Calendar, Save, X, Edit3,
  UserPlus, TrendingUp, CheckCircle2, Activity as ActivityIcon,
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  source?: string
  status: string
  priority?: string
  score?: number
  notes?: string
  customerId?: string
  convertedCustomerName?: string
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

interface LinkedOpp {
  id: string
  name: string
  amount: number
  stage: string
  probability: number
  expectedCloseDate?: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  NEW:          'bg-blue-900/50 text-blue-300',
  CONTACTED:    'bg-yellow-900/50 text-yellow-300',
  QUALIFIED:    'bg-green-900/50 text-green-300',
  PROPOSAL:     'bg-purple-900/50 text-purple-300',
  NEGOTIATION:  'bg-orange-900/50 text-orange-300',
  WON:          'bg-emerald-900/50 text-emerald-300',
  LOST:         'bg-red-900/50 text-red-300',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    'bg-neutral-800 text-neutral-300',
  MEDIUM: 'bg-amber-900/50 text-amber-300',
  HIGH:   'bg-red-900/50 text-red-300',
  URGENT: 'bg-red-900/70 text-red-100',
}

const STATUSES = ['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT']

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtMoney = (n: any) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<LinkedActivity[]>([])
  const [opportunities, setOpportunities] = useState<LinkedOpp[]>([])
  const [working, setWorking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [convModal, setConvModal] = useState<null | 'customer' | 'opportunity'>(null)
  const [oppForm, setOppForm] = useState({ name: '', amount: '', stage: 'QUALIFICATION', probability: '20', expectedCloseDate: '' })

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/leads/' + id, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setLead(data.lead)
      setActivities(data.activities || [])
      setOpportunities(data.opportunities || [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const startEdit = () => {
    if (!lead) return
    setForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || '',
      status: lead.status || 'NEW',
      priority: lead.priority || 'MEDIUM',
      notes: lead.notes || '',
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/crm/leads/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          company: form.company || null,
          source: form.source || null,
          status: form.status,
          priority: form.priority,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }
      setLead({ ...lead, ...data.lead })
      setEditing(false)
      flash('Lead updated')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const convertToCustomer = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/crm/leads/' + id + '/convert-to-customer', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Convert failed'); return }
      setConvModal(null)
      flash(data.alreadyConverted ? 'Already linked to a customer' : 'Converted to customer')
      load()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const convertToOpportunity = async () => {
    if (!oppForm.name.trim()) { setError('Opportunity name is required'); return }
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/crm/leads/' + id + '/convert-to-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          name: oppForm.name,
          amount: Number(oppForm.amount) || 0,
          stage: oppForm.stage,
          probability: parseInt(oppForm.probability) || 20,
          expectedCloseDate: oppForm.expectedCloseDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Convert failed'); return }
      setConvModal(null)
      flash('Converted to opportunity')
      // Redirect to the new opportunity
      if (data.opportunity?.id) {
        router.push('/wavecore-erp/crm/opportunities/' + data.opportunity.id)
        return
      }
      load()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  const deleteLead = async () => {
    if (!lead) return
    if (!confirm('Delete lead "' + lead.name + '"? This cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/crm/leads/' + id, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Delete failed')
        return
      }
      router.push('/wavecore-erp/crm/leads')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/crm/leads" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold">Lead</span>
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

  if (!lead) return null

  const isConverted = !!lead.customerId

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm/leads" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Lead</p>
              <p className="font-bold">{lead.name}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (STATUS_COLORS[lead.status] || 'bg-neutral-800 text-neutral-300')}>
              {lead.status}
            </span>
            {isConverted && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/50 text-emerald-300">
                converted
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={'/api/wavecore/crm/leads/' + id + '/pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </a>
            {!isConverted && (
              <button
                onClick={() => setConvModal('customer')}
                disabled={working}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
              >
                <UserPlus className="w-4 h-4" /> Convert to Customer
              </button>
            )}
            <button
              onClick={() => {
                setOppForm({
                  name: (lead.company || lead.name) + ' — ' + 'Deal',
                  amount: '',
                  stage: 'QUALIFICATION',
                  probability: '20',
                  expectedCloseDate: '',
                })
                setConvModal('opportunity')
              }}
              disabled={working}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <TrendingUp className="w-4 h-4" /> Create Opportunity
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
                >
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </>
            )}
            <button
              onClick={deleteLead}
              disabled={working}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">

        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2">
                <Target className="w-8 h-8" /> {lead.name}
              </h1>
              <p className="text-white/80 text-sm">
                {lead.company || 'No company'} · {lead.source || 'Unknown source'}
              </p>
            </div>
            <div className="text-right text-sm">
              <p>Created {fmtDate(lead.createdAt)}</p>
              <p>Priority: {lead.priority || 'MEDIUM'}{lead.score ? ' · Score: ' + lead.score : ''}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-900/30 text-emerald-300 border border-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        {isConverted && lead.customerId && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-900/20 border border-emerald-800 flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Converted to customer <strong>{lead.convertedCustomerName || 'Unnamed'}</strong>
            </div>
            <Link href={'/wavecore-erp/crm/customers/' + lead.customerId} className="text-sm font-bold text-emerald-400 hover:underline">
              View customer →
            </Link>
          </div>
        )}

        {editing ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Edit lead</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Company</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Source</label>
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Contact details
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-neutral-500 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</span>
                <span className="text-right">{lead.email || '—'}</span>
                <span className="text-neutral-500 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</span>
                <span className="text-right">{lead.phone || '—'}</span>
                <span className="text-neutral-500 flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Company</span>
                <span className="text-right">{lead.company || '—'}</span>
                <span className="text-neutral-500">Source</span>
                <span className="text-right">{lead.source || '—'}</span>
              </div>
            </div>

            <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Status
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status</span>
                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (STATUS_COLORS[lead.status] || '')}>{lead.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Priority</span>
                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (PRIORITY_COLORS[lead.priority || 'MEDIUM'] || '')}>{lead.priority || 'MEDIUM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Score</span>
                  <span>{lead.score || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {lead.notes && !editing && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{lead.notes}</p>
          </div>
        )}

        {opportunities.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Linked opportunities ({opportunities.length})
            </h3>
            <div className="space-y-2">
              {opportunities.map(o => (
                <Link key={o.id} href={'/wavecore-erp/crm/opportunities/' + o.id} className="block p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{o.name}</p>
                      <p className="text-xs text-neutral-500">{o.stage} · {o.probability}%</p>
                    </div>
                    <p className="font-bold text-sm">{fmtMoney(o.amount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activities.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4" /> Activities ({activities.length})
            </h3>
            <div className="space-y-2">
              {activities.map(a => (
                <div key={a.id} className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-bold">{a.subject}</p>
                  <p className="text-xs text-neutral-500">{a.type} · {a.completed ? 'done' : 'pending'} · {fmtDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Convert modals */}
        {convModal === 'customer' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-2">Convert lead to customer?</h3>
              <p className="text-sm text-neutral-500 mb-4">
                A new customer will be created from <strong>{lead.name}</strong>&apos;s details and linked to this lead.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConvModal(null)} disabled={working} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">
                  Cancel
                </button>
                <button onClick={convertToCustomer} disabled={working} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {convModal === 'opportunity' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-lg w-full">
              <h3 className="text-lg font-bold mb-4">Create opportunity from lead</h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Opportunity name</label>
                  <input value={oppForm.name} onChange={(e) => setOppForm({ ...oppForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Amount (KSh)</label>
                    <input type="number" value={oppForm.amount} onChange={(e) => setOppForm({ ...oppForm, amount: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Probability (%)</label>
                    <input type="number" min="0" max="100" value={oppForm.probability} onChange={(e) => setOppForm({ ...oppForm, probability: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Stage</label>
                    <select value={oppForm.stage} onChange={(e) => setOppForm({ ...oppForm, stage: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                      {['QUALIFICATION','NEEDS_ANALYSIS','PROPOSAL','NEGOTIATION'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">Expected close</label>
                    <input type="date" value={oppForm.expectedCloseDate} onChange={(e) => setOppForm({ ...oppForm, expectedCloseDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConvModal(null)} disabled={working} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">
                  Cancel
                </button>
                <button onClick={convertToOpportunity} disabled={working} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />} Create
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}