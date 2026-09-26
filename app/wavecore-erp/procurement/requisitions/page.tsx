'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ClipboardList, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, ArrowRight, Inbox, Settings,
  Trash2, Save, Send, FileText, Calendar, DollarSign, User,
  ChevronLeft, ChevronRight, AlertCircle, Zap, Package,
} from 'lucide-react'

interface Requisition {
  id: string
  requisitionNumber: string
  title: string
  description?: string
  category: string
  priority: string
  status: string
  currency: string
  totalAmount: number
  requestedByName?: string
  neededBy?: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  createdAt: string
  linesCount: number
  pendingApprovals: number
  isEmergency: boolean
  currentApprovalStep: number
  totalApprovalSteps: number
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  unitOfMeasure: string
  specifications?: string
}

const STATUSES = ['DRAFT','SUBMITTED','APPROVED','REJECTED','CONVERTED','CANCELLED']
const PRIORITIES = ['LOW','NORMAL','HIGH','URGENT']
const CATEGORIES = ['GENERAL','IT','OFFICE','LOGISTICS','MANUFACTURING','SERVICES','RAW_MATERIALS','OTHER']
const TYPES = ['STANDARD','CAPEX','OPEX','SERVICE','INVENTORY','EMERGENCY']
const UOM = ['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY']

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Counts
  const [counts, setCounts] = useState<any>({ pending: 0, overdue: 0, totalRequisitionsAwaiting: 0, totalRequisitionsApprovedThisMonth: 0 })

  // Filters
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [mine, setMine] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  // Wizard
  const [showWizard, setShowWizard] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchRequisitions = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (statusFilter) p.set('status', statusFilter)
      if (priorityFilter) p.set('priority', priorityFilter)
      if (categoryFilter) p.set('category', categoryFilter)
      if (mine) p.set('mine', 'true')
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/requisitions?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setRequisitions(data.requisitions || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/wavecore/procurement/approvals/counts')
      if (res.ok) {
        const d = await res.json()
        setCounts(d)
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchRequisitions() /* eslint-disable-next-line */ }, [q, statusFilter, priorityFilter, categoryFilter, mine, offset])
  useEffect(() => { fetchCounts() }, [])

  const priorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'bg-red-900/50 text-red-300'
      case 'HIGH': return 'bg-orange-900/50 text-orange-300'
      case 'LOW': return 'bg-neutral-800 text-neutral-400'
      default: return 'bg-blue-900/50 text-blue-300'
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-800 text-neutral-400'
      case 'SUBMITTED': return 'bg-amber-900/50 text-amber-300'
      case 'APPROVED': return 'bg-green-900/50 text-green-300'
      case 'REJECTED': return 'bg-red-900/50 text-red-300'
      case 'CONVERTED': return 'bg-indigo-900/50 text-indigo-300'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  const clearFilters = () => {
    setQ(''); setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); setMine(false); setOffset(0)
  }

  const activeFilters = [statusFilter, priorityFilter, categoryFilter].filter(Boolean).length + (q ? 1 : 0) + (mine ? 1 : 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Requisitions</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <ClipboardList className="w-8 h-8" /> Requisitions
              </h1>
              <p className="text-white/80 text-sm">Purchase requests · approval workflow · {total} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/approvals/inbox" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Inbox className="w-4 h-4" /> Approval Inbox
              </Link>
              <Link href="/wavecore-erp/procurement/approval-rules" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Settings className="w-4 h-4" /> Rules
              </Link>
              <button onClick={() => setShowWizard(true)} className="px-5 py-3 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> New Requisition
              </button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <Inbox className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{counts.pending || 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">My pending approvals</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <AlertCircle className="w-5 h-5 text-red-500 mb-2" />
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{counts.overdue || 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Overdue</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <Zap className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{counts.totalRequisitionsAwaiting || 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Awaiting approval</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{counts.totalRequisitionsApprovedThisMonth || 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Approved this month</p>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setOffset(0) }}
                placeholder="Search requisition #, title, description…"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
              />
            </div>
            <button onClick={() => setMine(!mine)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (mine ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <User className="w-4 h-4" /> Mine
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={fetchRequisitions} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All priorities</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={clearFilters} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></div>
        ) : requisitions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No requisitions match your filters' : 'No requisitions yet'}</p>
            <button onClick={() => setShowWizard(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Requisition
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {requisitions.map(r => (
                <Link key={r.id} href={'/wavecore-erp/procurement/requisitions/' + r.id} className="block p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{r.requisitionNumber}</span>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + priorityColor(r.priority)}>{r.priority}</span>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(r.status)}>{r.status}</span>
                        {r.isEmergency && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/50 text-red-300">EMERGENCY</span>}
                        {r.status === 'SUBMITTED' && r.totalApprovalSteps > 0 && (
                          <span className="text-[10px] text-neutral-500">step {r.currentApprovalStep}/{r.totalApprovalSteps}</span>
                        )}
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white text-sm truncate">{r.title}</p>
                      {r.description && <p className="text-xs text-neutral-500 truncate mt-0.5">{r.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-500 flex-wrap">
                        {r.requestedByName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.requestedByName}</span>}
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{r.linesCount} line{r.linesCount !== 1 ? 's' : ''}</span>
                        {r.neededBy && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />by {new Date(r.neededBy).toLocaleDateString('en-GB')}</span>}
                        <span>{new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {r.currency} {Number(r.totalAmount || 0).toLocaleString()}
                      </p>
                      {r.pendingApprovals > 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">{r.pendingApprovals} pending</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + requisitions.length)} of {total}</span>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Previous</button>
                  <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showWizard && (
        <CreateWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => { setShowWizard(false); flash('Requisition created'); fetchRequisitions(); fetchCounts() }}
        />
      )}
    </div>
  )
}

// ============================================================
// Create Wizard
// ============================================================
function CreateWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitOnSave, setSubmitOnSave] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    neededBy: '',
    type: 'STANDARD',
    departmentId: '',
    projectId: '',
    costCenter: '',
    location: '',
    currency: 'KES',
    isEmergency: false,
    notes: '',
  })

  const [lines, setLines] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' },
  ])

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, patch: Partial<LineItem>) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0)
  const taxTotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * ((Number(l.taxRate) || 0) / 100), 0)
  const total = subtotal + taxTotal

  const validateStep1 = () => {
    if (!form.title.trim()) { setError('Title is required'); return false }
    setError(''); return true
  }
  const validateStep3 = () => {
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].description.trim()) { setError('Line ' + (i+1) + ': description required'); return false }
      if (!(Number(lines[i].quantity) > 0)) { setError('Line ' + (i+1) + ': quantity must be > 0'); return false }
    }
    setError(''); return true
  }

  const next = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 3 && !validateStep3()) return
    setStep(s => Math.min(4, s + 1))
  }
  const prev = () => setStep(s => Math.max(1, s - 1))

  const save = async (submit: boolean) => {
    if (!validateStep1()) { setStep(1); return }
    if (!validateStep3()) { setStep(3); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ ...form, lines }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); return }

      const reqId = data.requisition?.id
      if (submit && reqId) {
        const submitRes = await fetch('/api/wavecore/procurement/requisitions/' + reqId + '/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        })
        const submitData = await submitRes.json()
        if (!submitRes.ok) {
          setError('Saved as draft, but submit failed: ' + (submitData.error || 'unknown'))
          setTimeout(() => onCreated(), 2000)
          return
        }
      }
      onCreated()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" /> New Requisition
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3,4].map(n => (
            <div key={n} className={'flex-1 h-1.5 rounded-full ' + (n <= step ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800')}></div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-emerald-500" /> Basics</h3>
              <Field label="Title *">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
              </Field>
              <Field label="Description">
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Category">
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Needed by">
                  <input type="date" value={form.neededBy} onChange={e => setForm({ ...form, neededBy: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {['KES','USD','EUR','GBP','ZAR','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-2"><User className="w-4 h-4 text-emerald-500" /> Context</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Type">
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Department ID (optional)">
                  <input value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <Field label="Project ID (optional)">
                  <input value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <Field label="Cost Center">
                  <input value={form.costCenter} onChange={e => setForm({ ...form, costCenter: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <Field label="Location">
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <label className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={form.isEmergency} onChange={e => setForm({ ...form, isEmergency: e.target.checked })} />
                  <span className="text-sm">Mark as emergency</span>
                </label>
              </div>
              <Field label="Notes">
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"><Package className="w-4 h-4 text-emerald-500" /> Line Items</h3>
                <button type="button" onClick={addLine} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add line
                </button>
              </div>

              {lines.map((l, i) => (
                <div key={i} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-500">Line {i + 1}</span>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="p-1 rounded text-red-400 hover:bg-red-900/30">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input value={l.description} onChange={e => updateLine(i, { description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input type="number" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} placeholder="Qty" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    <select value={l.unitOfMeasure} onChange={e => updateLine(i, { unitOfMeasure: e.target.value })} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm">
                      {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="number" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} placeholder="Unit price" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    <input type="number" value={l.taxRate} onChange={e => updateLine(i, { taxRate: Number(e.target.value) })} placeholder="Tax %" min="0" max="100" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                  </div>
                  <div className="text-right text-xs text-neutral-500">
                    Line total: <span className="font-bold text-neutral-900 dark:text-white">
                      {form.currency} {((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 + (Number(l.taxRate) || 0) / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl bg-emerald-900/10 dark:bg-emerald-900/20 border border-emerald-800/30">
                <div className="flex justify-between text-sm py-1"><span className="text-neutral-500">Subtotal</span><span className="font-bold">{form.currency} {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm py-1"><span className="text-neutral-500">Tax</span><span className="font-bold">{form.currency} {taxTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-lg pt-2 border-t border-emerald-800/30 mt-2"><span className="font-bold">Total</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{form.currency} {total.toLocaleString()}</span></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Review</h3>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
                <Row label="Title" value={form.title} />
                <Row label="Category" value={form.category} />
                <Row label="Priority" value={form.priority} />
                <Row label="Type" value={form.type} />
                {form.neededBy && <Row label="Needed by" value={new Date(form.neededBy).toLocaleDateString('en-GB')} />}
                <Row label="Lines" value={String(lines.length)} />
                <Row label="Total" value={form.currency + ' ' + total.toLocaleString()} bold />
              </div>

              <label className="flex items-center gap-2 p-4 rounded-xl bg-amber-900/10 dark:bg-amber-900/20 border border-amber-800/30 cursor-pointer">
                <input type="checkbox" checked={submitOnSave} onChange={e => setSubmitOnSave(e.target.checked)} />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Submit for approval immediately</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Routes to the configured approval chain. If unchecked, saved as DRAFT.</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-5 border-t border-neutral-200 dark:border-neutral-800 gap-3">
          <button type="button" onClick={prev} disabled={step === 1} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold disabled:opacity-40 flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex gap-2">
            {step < 4 && (
              <button type="button" onClick={next} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 4 && (
              <>
                <button type="button" onClick={() => save(false)} disabled={saving} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
                </button>
                <button type="button" onClick={() => save(true)} disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Save & Submit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}>{value}</span>
    </div>
  )
}