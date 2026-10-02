'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Wallet, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, Receipt, FileText, Layers, Calendar,
  ChevronLeft, ChevronRight, Save, Send, Clock, TrendingUp, CheckCheck,
  DollarSign, Building2, Hash, Users, ArrowRight,
} from 'lucide-react'

interface PaymentRun {
  id: string
  runNumber: string
  paymentDate?: string
  cutoffDate?: string
  currency: string
  totalAmount: number
  invoiceCount: number
  status: string
  method: string
  bankAccountId?: string
  approvedAt?: string
  approvedByName?: string
  executedAt?: string
  failureReason?: string
  notes?: string
  createdAt: string
}

interface InvoiceLite {
  id: string
  invoiceNumber: string
  supplierName?: string
  currency: string
  total: number
  invoiceDate?: string
  dueDate?: string
  status: string
}

const RUN_STATUSES = ['DRAFT','PENDING_APPROVAL','APPROVED','EXECUTING','EXECUTED','FAILED','CANCELLED']
const RUN_METHODS = ['BANK_TRANSFER','CHEQUE','MOBILE_MONEY','MIXED']

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PENDING_APPROVAL: 'Pending Approval', APPROVED: 'Approved',
  EXECUTING: 'Executing', EXECUTED: 'Executed', FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}
const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque',
  MOBILE_MONEY: 'Mobile Money', MIXED: 'Mixed',
}

export default function PaymentRunsPage() {
  const [runs, setRuns] = useState<PaymentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const [showWizard, setShowWizard] = useState(false)

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  // ---- Table sorting ----
  const [sortBy, setSortBy] = useState<'createdAt'|'runNumber'|'status'|'method'|'paymentDate'|'totalAmount'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortBy(key as any); setSortDir("desc") }
  }

  const sortedRuns = [...runs].sort((a: any, b: any) => {
    const dir = sortDir === "asc" ? 1 : -1
    const val = (x: any) => {
      if (sortBy === "createdAt") return new Date(x.createdAt).getTime()
      if (sortBy === "paymentDate") return x.paymentDate ? new Date(x.paymentDate).getTime() : 0
      if (sortBy === "totalAmount") return Number(x.totalAmount || 0)
      return String(x[sortBy] || "").toLowerCase()
    }
    const av = val(a); const bv = val(b)
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })

  const fetchRuns = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (statusFilter) p.set('status', statusFilter)
      if (methodFilter) p.set('method', methodFilter)
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/payment-runs?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setRuns(data.paymentRuns || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchRuns() /* eslint-disable-next-line */ }, [q, statusFilter, methodFilter, offset])

  // 30-second silent auto-refresh
  useEffect(() => {
    const t = setInterval(() => { fetchRuns({ silent: true }) }, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [q, statusFilter, methodFilter, offset])

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-800 text-neutral-300'
      case 'PENDING_APPROVAL': return 'bg-amber-900/50 text-amber-300'
      case 'APPROVED': return 'bg-blue-900/50 text-blue-300'
      case 'EXECUTING': return 'bg-cyan-900/50 text-cyan-300'
      case 'EXECUTED': return 'bg-green-900/50 text-green-300'
      case 'FAILED': return 'bg-red-900/50 text-red-300'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const clearFilters = () => { setQ(''); setStatusFilter(''); setMethodFilter(''); setOffset(0) }
  const activeFilters = [statusFilter, methodFilter].filter(Boolean).length + (q ? 1 : 0)

  const drafts = runs.filter(r => r.status === 'DRAFT').length
  const pending = runs.filter(r => r.status === 'PENDING_APPROVAL').length
  const approved = runs.filter(r => r.status === 'APPROVED').length
  const executed = runs.filter(r => r.status === 'EXECUTED').length

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Payment Runs</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Wallet className="w-8 h-8" /> Payment Runs
              </h1>
              <p className="text-white/80 text-sm">Batch payments to suppliers · {total} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/supplier-invoices" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Invoices
              </Link>
              <button onClick={() => setShowWizard(true)} className="px-5 py-3 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> New Payment Run
              </button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi icon={FileText} label="Drafts" value={drafts} color="text-neutral-500" onClick={() => { setStatusFilter('DRAFT'); setOffset(0) }} />
          <Kpi icon={Clock} label="Pending approval" value={pending} color="text-amber-500" onClick={() => { setStatusFilter('PENDING_APPROVAL'); setOffset(0) }} />
          <Kpi icon={CheckCircle2} label="Approved" value={approved} color="text-blue-500" onClick={() => { setStatusFilter('APPROVED'); setOffset(0) }} />
          <Kpi icon={CheckCheck} label="Executed" value={executed} color="text-green-500" onClick={() => { setStatusFilter('EXECUTED'); setOffset(0) }} />
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search run number, notes…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={() => fetchRuns()} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {RUN_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
              </select>
              <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All methods</option>
                {RUN_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m] || m}</option>)}
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
        ) : runs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No runs match your filters' : 'No payment runs yet'}</p>
            <button onClick={() => setShowWizard(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Run
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort('runNumber')}>Run#</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort('status')}>Status</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort('method')}>Method</th>
                    <th className="px-4 py-3 text-right">Invoices</th>
                    <th className="px-4 py-3 text-right cursor-pointer hover:text-emerald-600" onClick={() => toggleSort('totalAmount')}>Amount</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => toggleSort('paymentDate')}>Payment date</th>
                    <th className="px-4 py-3">Cutoff</th>
                    <th className="px-4 py-3">Approved by</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRuns.map((r: any) => (
                    <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                      <td className="px-4 py-3 align-top">
                        <Link href={'/wavecore-erp/procurement/payment-runs/' + r.id} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                          {r.runNumber}
                        </Link>
                        {r.failureReason && <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[180px]">{r.failureReason}</p>}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(r.status)}>{STATUS_LABELS[r.status] || r.status}</span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">{METHOD_LABELS[r.method] || r.method}</span>
                      </td>
                      <td className="px-4 py-3 align-top text-right text-xs">
                        {r.invoiceCount}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <p className="font-bold text-neutral-900 dark:text-white">{r.currency} {Number(r.totalAmount || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-neutral-500">
                        {r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-neutral-500">
                        {r.cutoffDate ? new Date(r.cutoffDate).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-neutral-500">
                        {r.approvedByName || '—'}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={'/wavecore-erp/procurement/payment-runs/' + r.id} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-900/20" title="Open">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + runs.length)} of {total}</span>
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
        <RunWizard onClose={() => setShowWizard(false)} onCreated={() => { setShowWizard(false); flash('Payment run created'); fetchRuns() }} />
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, color, onClick, title }: any) {
  const cls = 'text-left bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 w-full ' +
              (onClick ? 'hover:border-emerald-500 transition cursor-pointer' : '')
  const content = (
    <>
      <Icon className={'w-5 h-5 mb-2 ' + color} />
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} title={title || label}>
        {content}
      </button>
    )
  }
  return <div className={cls}>{content}</div>
}

function RunWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    cutoffDate: '',
    method: 'BANK_TRANSFER',
    currency: 'KES',
    bankAccountId: '',
    notes: '',
  })

  const [invoices, setInvoices] = useState<InvoiceLite[]>([])
  const [invLoading, setInvLoading] = useState(false)
  const [invQuery, setInvQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitOnSave, setSubmitOnSave] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  useEffect(() => {
    if (step !== 2) return
    setInvLoading(true)
    fetch('/api/wavecore/procurement/supplier-invoices?status=APPROVED&limit=200')
      .then(r => r.json())
      .then(d => setInvoices(d.supplierInvoices || []))
      .catch(() => setInvoices([]))
      .finally(() => setInvLoading(false))
  }, [step])

  const toggleInvoice = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedInvoices = invoices.filter(i => selectedIds.includes(i.id))
  const selectedTotal = selectedInvoices.reduce((s, i) => s + Number(i.total || 0), 0)

  const save = async (submit: boolean) => {
    if (!form.paymentDate) { setError('Payment date is required'); setStep(1); return }
    if (selectedIds.length === 0) { setError('Pick at least one invoice'); setStep(2); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        paymentDate: form.paymentDate,
        cutoffDate: form.cutoffDate || undefined,
        method: form.method,
        currency: form.currency,
        bankAccountId: form.bankAccountId || undefined,
        notes: form.notes || undefined,
        supplierInvoiceIds: selectedIds,
      }

      const res = await fetch('/api/wavecore/procurement/payment-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }

      const runId = data.paymentRun?.id
      if (submit && runId) {
        const sres = await fetch('/api/wavecore/procurement/payment-runs/' + runId + '/lifecycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
          body: JSON.stringify({ action: 'SUBMIT' }),
        })
        if (!sres.ok) {
          const sd = await sres.json()
          setError('Saved as draft, but submit failed: ' + (sd.error || ''))
          setTimeout(onCreated, 2000)
          return
        }
      }
      onCreated()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally { setSaving(false) }
  }

  const filteredInvoices = invoices.filter(i =>
    !invQuery ||
    (i.invoiceNumber || '').toLowerCase().includes(invQuery.toLowerCase()) ||
    (i.supplierName || '').toLowerCase().includes(invQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" /> New Payment Run
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3].map(n => (
            <div key={n} className={'flex-1 h-1.5 rounded-full ' + (n <= step ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800')}></div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Payment date *">
                  <input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Cutoff date">
                  <input type="date" value={form.cutoffDate} onChange={e => setForm({ ...form, cutoffDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Method">
                  <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    {RUN_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m] || m}</option>)}
                  </select>
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    {['KES','USD','EUR','GBP','ZAR','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Bank account ID (optional)">
                <input value={form.bankAccountId} onChange={e => setForm({ ...form, bankAccountId: e.target.value })} placeholder="Bank account id" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
              <Field label="Notes">
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <input value={invQuery} onChange={e => setInvQuery(e.target.value)} placeholder="Search invoice number or supplier…" className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedIds.length} selected · {form.currency} {selectedTotal.toLocaleString()}
                </span>
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                {invLoading ? <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-emerald-500" /></div>
                : filteredInvoices.length === 0 ? <p className="p-6 text-center text-sm text-neutral-500">No approved invoices available</p>
                : filteredInvoices.map(i => {
                  const picked = selectedIds.includes(i.id)
                  return (
                    <button key={i.id} onClick={() => toggleInvoice(i.id)} className={'w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition ' + (picked ? 'bg-emerald-900/10' : '')}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-[220px]">
                          <p className="text-xs font-bold text-emerald-500">{i.invoiceNumber}</p>
                          <p className="text-sm font-medium">{i.supplierName || 'Unknown supplier'}</p>
                          <p className="text-[10px] text-neutral-500">{i.invoiceDate ? 'inv ' + new Date(i.invoiceDate).toLocaleDateString('en-GB') : ''}{i.dueDate ? ' · due ' + new Date(i.dueDate).toLocaleDateString('en-GB') : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{i.currency} {Number(i.total || 0).toLocaleString()}</p>
                          {picked && <p className="text-[10px] text-emerald-500 mt-1 font-bold">✓ selected</p>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Review</h3>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
                <Row label="Payment date" value={form.paymentDate} />
                {form.cutoffDate && <Row label="Cutoff date" value={form.cutoffDate} />}
                <Row label="Method" value={METHOD_LABELS[form.method] || form.method} />
                <Row label="Currency" value={form.currency} />
                <Row label="Invoices" value={String(selectedIds.length)} />
                <Row label="Total" value={form.currency + ' ' + selectedTotal.toLocaleString()} bold />
              </div>

              <label className="flex items-center gap-2 p-4 rounded-xl bg-amber-900/10 dark:bg-amber-900/20 border border-amber-800/30 cursor-pointer">
                <input type="checkbox" checked={submitOnSave} onChange={e => setSubmitOnSave(e.target.checked)} />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Submit for approval immediately</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Otherwise saved as DRAFT.</p>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-5 border-t border-neutral-200 dark:border-neutral-800 gap-3">
          <button type="button" onClick={() => step === 1 ? onClose() : setStep(s => s - 1)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex gap-2">
            {step < 3 && (
              <button type="button" onClick={() => {
                if (step === 1 && !form.paymentDate) { setError('Payment date is required'); return }
                if (step === 2 && selectedIds.length === 0) { setError('Pick at least one invoice'); return }
                setError('')
                setStep(s => s + 1)
              }} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
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

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}>{value}</span>
    </div>
  )
}
