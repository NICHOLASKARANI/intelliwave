'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ClipboardList, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, Users, Layers, Calendar, Clock,
  ChevronLeft, ChevronRight, Save, FileSignature, Package, FileText,
  Sparkles, TrendingUp, Award, Hash, MapPin, DollarSign,
} from 'lucide-react'

interface RFQ {
  id: string
  rfqNumber: string
  title: string
  description?: string
  type: string
  category?: string
  currency: string
  issueDate?: string
  closingDate?: string
  deliveryDate?: string
  deliveryLocation?: string
  status: string
  publishedAt?: string
  awardedAt?: string
  awardedBidId?: string
  notes?: string
  createdAt: string
  linesCount: number
  invitesCount: number
  quotesCount: number
}

interface Supplier {
  id: string
  name: string
  legalName?: string
}

interface RequisitionLite {
  id: string
  requisitionNumber: string
  title: string
  status: string
}

interface DraftLine {
  description: string
  quantity: number
  unitOfMeasure: string
  specifications: string
  targetPrice: number
}

const RFQ_TYPES = ['RFQ','RFP','RFI']
const RFQ_STATUSES = ['DRAFT','PUBLISHED','CLOSED','AWARDED','CANCELLED']
const UOM = ['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY','MONTH']

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Published', CLOSED: 'Closed',
  AWARDED: 'Awarded', CANCELLED: 'Cancelled',
}

export default function RFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const [showWizard, setShowWizard] = useState(false)

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchRFQs = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (statusFilter) p.set('status', statusFilter)
      if (typeFilter) p.set('type', typeFilter)
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/rfqs?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setRfqs(data.rfqs || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchRFQs() /* eslint-disable-next-line */ }, [q, statusFilter, typeFilter, offset])

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-800 text-neutral-300'
      case 'PUBLISHED': return 'bg-blue-900/50 text-blue-300'
      case 'CLOSED': return 'bg-amber-900/50 text-amber-300'
      case 'AWARDED': return 'bg-green-900/50 text-green-300'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const clearFilters = () => { setQ(''); setStatusFilter(''); setTypeFilter(''); setOffset(0) }
  const activeFilters = [statusFilter, typeFilter].filter(Boolean).length + (q ? 1 : 0)

  const daysUntil = (d?: string) => {
    if (!d) return null
    return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const drafts = rfqs.filter(r => r.status === 'DRAFT').length
  const published = rfqs.filter(r => r.status === 'PUBLISHED').length
  const closingSoon = rfqs.filter(r => {
    if (r.status !== 'PUBLISHED') return false
    const d = daysUntil(r.closingDate)
    return d != null && d >= 0 && d <= 7
  }).length
  const awarded = rfqs.filter(r => r.status === 'AWARDED').length

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · RFQs</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <ClipboardList className="w-8 h-8" /> RFQs
              </h1>
              <p className="text-white/80 text-sm">Request for Quotes / Proposals / Information · {total} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/contracts" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <FileSignature className="w-4 h-4" /> Contracts
              </Link>
              <Link href="/wavecore-erp/procurement/suppliers" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Users className="w-4 h-4" /> Suppliers
              </Link>
              <button onClick={() => setShowWizard(true)} className="px-5 py-3 rounded-xl bg-white text-purple-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> New RFQ
              </button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi icon={Sparkles} label="Drafts" value={drafts} color="text-neutral-500" />
          <Kpi icon={TrendingUp} label="Published" value={published} color="text-blue-500" />
          <Kpi icon={Clock} label="Closing ≤7d" value={closingSoon} color="text-amber-500" />
          <Kpi icon={Award} label="Awarded" value={awarded} color="text-green-500" />
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search RFQ number, title, description…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-purple-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={fetchRFQs} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {RFQ_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
              </select>
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All types</option>
                {RFQ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={clearFilters} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : rfqs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No RFQs match your filters' : 'No RFQs yet'}</p>
            <button onClick={() => setShowWizard(true)} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First RFQ
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {rfqs.map(r => {
                const dLeft = daysUntil(r.closingDate)
                const closingWarn = r.status === 'PUBLISHED' && dLeft != null && dLeft >= 0 && dLeft <= 7
                return (
                  <Link key={r.id} href={'/wavecore-erp/procurement/rfqs/' + r.id} className="block p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[260px]">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{r.rfqNumber || '—'}</span>
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(r.status)}>{STATUS_LABELS[r.status] || r.status}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">{r.type}</span>
                          {r.category && <span className="text-[10px] text-neutral-500">{r.category}</span>}
                          {closingWarn && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/50 text-amber-300">closes in {dLeft}d</span>}
                        </div>
                        <p className="font-bold text-neutral-900 dark:text-white text-sm truncate">{r.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 flex-wrap">
                          {r.closingDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />closes {new Date(r.closingDate).toLocaleDateString('en-GB')}</span>}
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{r.linesCount} line{r.linesCount !== 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.invitesCount} invited</span>
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{r.quotesCount} quote{r.quotesCount !== 1 ? 's' : ''}</span>
                          {r.deliveryLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.deliveryLocation}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-neutral-500">{r.currency}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">{new Date(r.createdAt).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + rfqs.length)} of {total}</span>
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
        <RFQWizard onClose={() => setShowWizard(false)} onCreated={() => { setShowWizard(false); flash('RFQ created'); fetchRFQs() }} />
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      <Icon className={'w-5 h-5 mb-2 ' + color} />
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
    </div>
  )
}

function RFQWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierQuery, setSupplierQuery] = useState('')
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([])

  const [requisitions, setRequisitions] = useState<RequisitionLite[]>([])
  const [reqQuery, setReqQuery] = useState('')
  const [loadingReqs, setLoadingReqs] = useState(false)
  const [selectedReq, setSelectedReq] = useState<RequisitionLite | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'RFQ',
    category: '',
    currency: 'KES',
    issueDate: new Date().toISOString().slice(0, 10),
    closingDate: '',
    deliveryDate: '',
    deliveryLocation: '',
    paymentTerms: '',
    notes: '',
  })

  const [lines, setLines] = useState<DraftLine[]>([
    { description: '', quantity: 1, unitOfMeasure: 'UNIT', specifications: '', targetPrice: 0 },
  ])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  useEffect(() => {
    if (step !== 2) return
    setLoadingSuppliers(true)
    fetch('/api/wavecore/procurement/suppliers?status=ACTIVE&limit=200')
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoadingSuppliers(false))

    setLoadingReqs(true)
    fetch('/api/wavecore/procurement/requisitions?status=APPROVED&limit=50')
      .then(r => r.json())
      .then(d => setRequisitions(d.requisitions || []))
      .catch(() => setRequisitions([]))
      .finally(() => setLoadingReqs(false))
  }, [step])

  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unitOfMeasure: 'UNIT', specifications: '', targetPrice: 0 }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, patch: Partial<DraftLine>) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))

  const toggleSupplier = (s: Supplier) => {
    setSelectedSuppliers(prev =>
      prev.find(x => x.id === s.id)
        ? prev.filter(x => x.id !== s.id)
        : [...prev, s]
    )
  }

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required'); setStep(1); return }
    const cleanLines = lines.filter(l => l.description.trim())
    if (cleanLines.length === 0) { setError('At least one line is required'); setStep(2); return }
    if (selectedSuppliers.length === 0) { setError('Invite at least one supplier'); setStep(2); return }

    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        category: form.category || undefined,
        currency: form.currency,
        requisitionId: selectedReq?.id || undefined,
        issueDate: form.issueDate || undefined,
        closingDate: form.closingDate || undefined,
        deliveryDate: form.deliveryDate || undefined,
        deliveryLocation: form.deliveryLocation || undefined,
        paymentTerms: form.paymentTerms || undefined,
        notes: form.notes || undefined,
        lines: cleanLines.map(l => ({
          description: l.description,
          quantity: Number(l.quantity) || 0,
          unitOfMeasure: l.unitOfMeasure,
          specifications: l.specifications || undefined,
          targetPrice: Number(l.targetPrice) || 0,
        })),
        supplierIds: selectedSuppliers.map(s => s.id),
      }

      const res = await fetch('/api/wavecore/procurement/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }
      onCreated()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally { setSaving(false) }
  }

  const filteredSuppliers = suppliers.filter(s =>
    !supplierQuery ||
    s.name.toLowerCase().includes(supplierQuery.toLowerCase()) ||
    (s.legalName || '').toLowerCase().includes(supplierQuery.toLowerCase())
  )
  const filteredReqs = requisitions.filter(r =>
    !reqQuery ||
    r.requisitionNumber.toLowerCase().includes(reqQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(reqQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-500" /> New RFQ
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3].map(n => (
            <div key={n} className={'flex-1 h-1.5 rounded-full ' + (n <= step ? 'bg-purple-500' : 'bg-neutral-200 dark:bg-neutral-800')}></div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

          {step === 1 && (
            <div className="space-y-5">
              <Field label="Title *">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Office furniture supply Q1 2026" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
              <Field label="Description">
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Scope, expectations, general terms…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Type">
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    {RFQ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Category">
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. IT, Facilities" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    {['KES','USD','EUR','GBP','ZAR','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500" /> Link to approved requisition (optional)</h3>
                {selectedReq ? (
                  <div className="p-4 rounded-xl bg-purple-900/10 dark:bg-purple-900/20 border border-purple-500/30 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-purple-500">{selectedReq.requisitionNumber}</p>
                      <p className="text-sm font-medium">{selectedReq.title}</p>
                    </div>
                    <button onClick={() => setSelectedReq(null)} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <input value={reqQuery} onChange={e => setReqQuery(e.target.value)} placeholder="Search requisitions…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mb-2 text-sm" />
                    <div className="max-h-32 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                      {loadingReqs ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-purple-500" /></div>
                      : filteredReqs.length === 0 ? <p className="p-4 text-center text-sm text-neutral-500">No approved requisitions found</p>
                      : filteredReqs.map(r => (
                        <button key={r.id} onClick={() => setSelectedReq(r)} className="w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                          <p className="text-xs font-bold text-purple-500">{r.requisitionNumber}</p>
                          <p className="text-sm font-medium">{r.title}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Issue date">
                  <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Closing date">
                  <input type="date" value={form.closingDate} onChange={e => setForm({ ...form, closingDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Delivery date">
                  <input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Delivery location">
                  <input value={form.deliveryLocation} onChange={e => setForm({ ...form, deliveryLocation: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Payment terms">
                  <input value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g. 30 days net" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
              </div>

              {/* Lines */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500" /> Line items ({lines.length})</h3>
                  <button type="button" onClick={addLine} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add line
                  </button>
                </div>
                {lines.map((l, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">Line {i + 1}</span>
                      {lines.length > 1 && (
                        <button type="button" onClick={() => removeLine(i)} className="p-1 rounded text-red-400 hover:bg-red-900/30"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    <input value={l.description} onChange={e => updateLine(i, { description: e.target.value })} placeholder="Description *" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} placeholder="Qty" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                      <select value={l.unitOfMeasure} onChange={e => updateLine(i, { unitOfMeasure: e.target.value })} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm">
                        {UOM.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input type="number" value={l.targetPrice} onChange={e => updateLine(i, { targetPrice: Number(e.target.value) })} placeholder="Target price" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                      <input value={l.specifications} onChange={e => updateLine(i, { specifications: e.target.value })} placeholder="Specs" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Supplier invites */}
              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> Invited suppliers ({selectedSuppliers.length})</h3>
                {selectedSuppliers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSuppliers.map(s => (
                      <button key={s.id} onClick={() => toggleSupplier(s)} className="px-3 py-1.5 rounded-full bg-purple-900/30 text-purple-300 text-xs font-bold flex items-center gap-1 hover:bg-purple-900/50">
                        {s.name} <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
                <input value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="Search suppliers…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mb-2 text-sm" />
                <div className="max-h-44 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {loadingSuppliers ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-purple-500" /></div>
                  : filteredSuppliers.length === 0 ? <p className="p-4 text-center text-sm text-neutral-500">No suppliers found</p>
                  : filteredSuppliers.map(s => {
                    const picked = !!selectedSuppliers.find(x => x.id === s.id)
                    return (
                      <button key={s.id} onClick={() => toggleSupplier(s)} className={'w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 ' + (picked ? 'bg-purple-900/10' : '')}>
                        <p className="text-sm font-medium">{s.name}</p>
                        {s.legalName && <p className="text-xs text-neutral-500">{s.legalName}</p>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Field label="Notes">
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Review</h3>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
                <Row label="Title" value={form.title} />
                <Row label="Type" value={form.type} />
                {form.category && <Row label="Category" value={form.category} />}
                <Row label="Currency" value={form.currency} />
                {selectedReq && <Row label="Linked requisition" value={selectedReq.requisitionNumber} />}
                {form.closingDate && <Row label="Closing" value={form.closingDate} />}
                <Row label="Lines" value={String(lines.filter(l => l.description.trim()).length)} />
                <Row label="Suppliers invited" value={String(selectedSuppliers.length)} bold />
              </div>
              <p className="text-xs text-neutral-500">After creating, the RFQ will be in DRAFT state. Publish from the RFQ detail page.</p>
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
                if (step === 1 && !form.title.trim()) { setError('Title is required'); return }
                if (step === 2) {
                  if (lines.filter(l => l.description.trim()).length === 0) { setError('At least one line required'); return }
                  if (selectedSuppliers.length === 0) { setError('Invite at least one supplier'); return }
                }
                setError('')
                setStep(s => s + 1)
              }} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button type="button" onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create RFQ
              </button>
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
      <span className={bold ? 'font-bold text-purple-600 dark:text-purple-400' : 'font-medium'}>{value}</span>
    </div>
  )
}