'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Receipt, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, ClipboardList, Package, Package2,
  Truck, ChevronLeft, ChevronRight, Save, Send, FileText, Layers,
  Calendar, DollarSign, Users, ShieldCheck, AlertOctagon, Sparkles,
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  supplierInvoiceRef?: string
  purchaseOrderId?: string
  goodsReceiptId?: string
  supplierId?: string
  supplierName?: string
  invoiceDate?: string
  dueDate?: string
  currency: string
  subtotal: number
  taxAmount: number
  total: number
  status: string
  matchStatus: string
  matchNotes?: string
  createdAt: string
  poNumber?: string
  grnNumber?: string
  linesCount: number
}

interface POListItem {
  id: string
  number: string
  status: string
  supplierName?: string
  supplierId?: string
  currency: string
  total: number
  amount: number
  deliveryDate?: string
}

interface POLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  unitOfMeasure?: string
}

interface DraftLine {
  description: string
  purchaseOrderItemId?: string
  quantity: number
  unitPrice: number
  taxRate: number
}

const STATUSES = ['DRAFT','SUBMITTED','MATCHED','PARTIAL_MATCH','MISMATCH','APPROVED','REJECTED','PAID','CANCELLED']
const MATCH_STATUSES = ['UNMATCHED','AUTO_MATCHED','PARTIAL','EXCEPTION']

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', MATCHED: 'Matched',
  PARTIAL_MATCH: 'Partial Match', MISMATCH: 'Mismatch',
  APPROVED: 'Approved', REJECTED: 'Rejected', PAID: 'Paid',
  CANCELLED: 'Cancelled',
}
const MATCH_LABELS: Record<string, string> = {
  UNMATCHED: 'Unmatched', AUTO_MATCHED: 'Auto Matched',
  PARTIAL: 'Partial', EXCEPTION: 'Exception',
}

export default function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [matchFilter, setMatchFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const [showWizard, setShowWizard] = useState(false)

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (statusFilter) p.set('status', statusFilter)
      if (matchFilter) p.set('matchStatus', matchFilter)
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/supplier-invoices?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setInvoices(data.supplierInvoices || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchInvoices() /* eslint-disable-next-line */ }, [q, statusFilter, matchFilter, offset])

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-800 text-neutral-300'
      case 'SUBMITTED': return 'bg-amber-900/50 text-amber-300'
      case 'MATCHED': return 'bg-green-900/50 text-green-300'
      case 'PARTIAL_MATCH': return 'bg-orange-900/50 text-orange-300'
      case 'MISMATCH': return 'bg-red-900/50 text-red-300'
      case 'APPROVED': return 'bg-emerald-900/50 text-emerald-300'
      case 'REJECTED': return 'bg-red-900/50 text-red-300'
      case 'PAID': return 'bg-purple-900/50 text-purple-300'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const matchColor = (s: string) => {
    switch (s) {
      case 'AUTO_MATCHED': return 'bg-green-900/50 text-green-300'
      case 'PARTIAL': return 'bg-orange-900/50 text-orange-300'
      case 'EXCEPTION': return 'bg-red-900/50 text-red-300'
      case 'UNMATCHED': return 'bg-neutral-800 text-neutral-400'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  const clearFilters = () => { setQ(''); setStatusFilter(''); setMatchFilter(''); setOffset(0) }
  const activeFilters = [statusFilter, matchFilter].filter(Boolean).length + (q ? 1 : 0)

  const drafts = invoices.filter(i => i.status === 'DRAFT').length
  const submitted = invoices.filter(i => i.status === 'SUBMITTED').length
  const matched = invoices.filter(i => i.matchStatus === 'AUTO_MATCHED' || i.status === 'MATCHED').length
  const exceptions = invoices.filter(i => i.matchStatus === 'EXCEPTION' || i.status === 'MISMATCH').length

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Supplier Invoices</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Receipt className="w-8 h-8" /> Supplier Invoices
              </h1>
              <p className="text-white/80 text-sm">3-way match · {total} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/orders" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Package className="w-4 h-4" /> POs
              </Link>
              <Link href="/wavecore-erp/procurement/goods-receipts" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Package2 className="w-4 h-4" /> GRNs
              </Link>
              <button onClick={() => setShowWizard(true)} className="px-5 py-3 rounded-xl bg-white text-indigo-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> New Invoice
              </button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi icon={FileText} label="Drafts" value={drafts} color="text-neutral-500" />
          <Kpi icon={Send} label="Submitted" value={submitted} color="text-amber-500" />
          <Kpi icon={ShieldCheck} label="Matched" value={matched} color="text-green-500" />
          <Kpi icon={AlertOctagon} label="Exceptions" value={exceptions} color="text-red-500" />
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search invoice number, supplier ref, supplier…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={fetchInvoices} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
              </select>
              <select value={matchFilter} onChange={e => { setMatchFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All match states</option>
                {MATCH_STATUSES.map(s => <option key={s} value={s}>{MATCH_LABELS[s] || s}</option>)}
              </select>
              <button onClick={clearFilters} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No invoices match your filters' : 'No supplier invoices yet'}</p>
            <button onClick={() => setShowWizard(true)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Invoice
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {invoices.map(inv => (
                <Link key={inv.id} href={'/wavecore-erp/procurement/supplier-invoices/' + inv.id} className="block p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{inv.invoiceNumber}</span>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(inv.status)}>{STATUS_LABELS[inv.status] || inv.status}</span>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + matchColor(inv.matchStatus)}>{MATCH_LABELS[inv.matchStatus] || inv.matchStatus}</span>
                        {inv.supplierInvoiceRef && <span className="text-[10px] text-neutral-500">ref {inv.supplierInvoiceRef}</span>}
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white text-sm truncate flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-neutral-400" /> {inv.supplierName || 'Unknown supplier'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 flex-wrap">
                        {inv.poNumber && <span className="flex items-center gap-1"><Package className="w-3 h-3" />PO {inv.poNumber}</span>}
                        {inv.grnNumber && <span className="flex items-center gap-1"><Package2 className="w-3 h-3" />GRN {inv.grnNumber}</span>}
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{inv.linesCount} line{inv.linesCount !== 1 ? 's' : ''}</span>
                        {inv.invoiceDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(inv.invoiceDate).toLocaleDateString('en-GB')}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {inv.currency} {Number(inv.total || 0).toLocaleString()}
                      </p>
                      {inv.dueDate && <p className="text-[10px] text-neutral-500 mt-1">due {new Date(inv.dueDate).toLocaleDateString('en-GB')}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + invoices.length)} of {total}</span>
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
        <InvoiceWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => { setShowWizard(false); flash('Supplier invoice created'); fetchInvoices() }}
        />
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

function InvoiceWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [source, setSource] = useState<'from-po' | 'manual' | null>(null)

  const [pos, setPos] = useState<POListItem[]>([])
  const [poQuery, setPoQuery] = useState('')
  const [loadingPos, setLoadingPos] = useState(false)
  const [selectedPO, setSelectedPO] = useState<POListItem | null>(null)
  const [loadingLines, setLoadingLines] = useState(false)

  const [form, setForm] = useState({
    supplierInvoiceRef: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    currency: 'KES',
    notes: '',
    supplierNameManual: '',
  })

  const [lines, setLines] = useState<DraftLine[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
  ])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitOnSave, setSubmitOnSave] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  useEffect(() => {
    if (step !== 2 || source !== 'from-po') return
    setLoadingPos(true)
    fetch('/api/wavecore/procurement/purchase-orders?limit=100')
      .then(r => r.json())
      .then(d => {
        const receivable = ['APPROVED', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED']
        setPos((d.purchaseOrders || []).filter((p: POListItem) => receivable.includes(p.status)))
      })
      .catch(() => setPos([]))
      .finally(() => setLoadingPos(false))
  }, [step, source])

  const pickPO = async (po: POListItem) => {
    setSelectedPO(po)
    setLoadingLines(true)
    try {
      const res = await fetch('/api/wavecore/procurement/purchase-orders/' + po.id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load PO'); return }
      const poLines: POLine[] = data.lines || []
      setLines(poLines.length > 0
        ? poLines.map(l => ({
            description: l.description,
            purchaseOrderItemId: l.id,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            taxRate: Number(l.taxRate || 0),
          }))
        : [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]
      )
      setForm(f => ({ ...f, currency: po.currency || 'KES' }))
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setLoadingLines(false)
    }
  }

  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, patch: Partial<DraftLine>) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0)
  const taxTotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * ((Number(l.taxRate) || 0) / 100), 0)
  const total = subtotal + taxTotal

  const save = async (submit: boolean) => {
    if (source === 'from-po' && !selectedPO) { setError('Pick a purchase order'); setStep(2); return }
    if (source === 'manual' && !form.supplierNameManual.trim() && !selectedPO) {
      setError('Supplier name is required for manual invoices'); setStep(2); return
    }
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].description.trim()) { setError('Line ' + (i+1) + ': description required'); setStep(2); return }
      if (!(Number(lines[i].quantity) >= 0)) { setError('Line ' + (i+1) + ': quantity must be >= 0'); setStep(2); return }
      if (!(Number(lines[i].unitPrice) >= 0)) { setError('Line ' + (i+1) + ': unit price must be >= 0'); setStep(2); return }
    }

    setSaving(true)
    setError('')
    try {
      const payload: any = {
        supplierInvoiceRef: form.supplierInvoiceRef || undefined,
        invoiceDate: form.invoiceDate || undefined,
        dueDate: form.dueDate || undefined,
        currency: form.currency || 'KES',
        notes: form.notes || undefined,
        lines: lines.map(l => ({
          description: l.description,
          purchaseOrderItemId: l.purchaseOrderItemId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
        })),
      }
      if (selectedPO) {
        payload.purchaseOrderId = selectedPO.id
        if (selectedPO.supplierId) payload.supplierId = selectedPO.supplierId
      } else if (source === 'manual') {
        payload.supplierName = form.supplierNameManual
      }

      const res = await fetch('/api/wavecore/procurement/supplier-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }

      const invoiceId = data.supplierInvoice?.id
      if (submit && invoiceId) {
        const sres = await fetch('/api/wavecore/procurement/supplier-invoices/' + invoiceId + '/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
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

  const filteredPOs = pos.filter(p =>
    !poQuery ||
    (p.number || '').toLowerCase().includes(poQuery.toLowerCase()) ||
    (p.supplierName || '').toLowerCase().includes(poQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-500" /> New Supplier Invoice
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3].map(n => (
            <div key={n} className={'flex-1 h-1.5 rounded-full ' + (n <= step ? 'bg-indigo-500' : 'bg-neutral-200 dark:bg-neutral-800')}></div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> How do you want to create this invoice?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button onClick={() => setSource('from-po')} className={'p-6 rounded-2xl border-2 text-left transition ' + (source === 'from-po' ? 'border-indigo-500 bg-indigo-900/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300')}>
                  <Package className="w-8 h-8 text-indigo-500 mb-3" />
                  <p className="font-bold text-sm mb-1">From Purchase Order</p>
                  <p className="text-xs text-neutral-500">Pick a PO — lines auto-fill with PO qty/price for 3-way match</p>
                </button>
                <button onClick={() => setSource('manual')} className={'p-6 rounded-2xl border-2 text-left transition ' + (source === 'manual' ? 'border-indigo-500 bg-indigo-900/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300')}>
                  <FileText className="w-8 h-8 text-neutral-500 mb-3" />
                  <p className="font-bold text-sm mb-1">Manual entry</p>
                  <p className="text-xs text-neutral-500">Enter supplier + lines by hand (no 3-way match)</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {source === 'from-po' && (
                <div>
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-500" /> Purchase Order *</h3>
                  {selectedPO ? (
                    <div className="p-4 rounded-xl bg-indigo-900/10 dark:bg-indigo-900/20 border border-indigo-500/30 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-indigo-500">{selectedPO.number}</p>
                        <p className="font-bold text-sm">{selectedPO.supplierName}</p>
                        <p className="text-xs text-neutral-500">{selectedPO.currency} {Number(selectedPO.total || selectedPO.amount || 0).toLocaleString()} · {selectedPO.status}</p>
                      </div>
                      <button onClick={() => { setSelectedPO(null); setLines([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]) }} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <>
                      <input value={poQuery} onChange={e => setPoQuery(e.target.value)} placeholder="Search PO number or supplier…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mb-2 text-sm" />
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                        {loadingPos ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-indigo-500" /></div>
                        : filteredPOs.length === 0 ? <p className="p-4 text-center text-sm text-neutral-500">No receivable POs found</p>
                        : filteredPOs.map(p => (
                          <button key={p.id} onClick={() => pickPO(p)} className="w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                            <p className="text-xs font-bold text-indigo-500">{p.number}</p>
                            <p className="text-sm font-medium">{p.supplierName}</p>
                            <p className="text-xs text-neutral-500">{p.currency} {Number(p.total || p.amount || 0).toLocaleString()} · {p.status}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {source === 'manual' && (
                <Field label="Supplier name *">
                  <input value={form.supplierNameManual} onChange={e => setForm({ ...form, supplierNameManual: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Supplier invoice ref #">
                  <input value={form.supplierInvoiceRef} onChange={e => setForm({ ...form, supplierInvoiceRef: e.target.value })} placeholder="e.g. INV-2026-00123" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                    {['KES','USD','EUR','GBP','ZAR','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Invoice date">
                  <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Due date">
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" /> Lines {source === 'from-po' && selectedPO ? <span className="text-xs text-neutral-500">(from PO — edit as needed)</span> : null}</h3>
                  <button type="button" onClick={addLine} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add line
                  </button>
                </div>
                {loadingLines ? <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-indigo-500" /></div>
                : lines.map((l, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">Line {i + 1}{l.purchaseOrderItemId && <span className="ml-2 text-indigo-500">· linked to PO line</span>}</span>
                      {lines.length > 1 && (
                        <button type="button" onClick={() => removeLine(i)} className="p-1 rounded text-red-400 hover:bg-red-900/30">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input value={l.description} onChange={e => updateLine(i, { description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} placeholder="Qty" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                      <input type="number" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} placeholder="Unit price" min="0" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                      <input type="number" value={l.taxRate} onChange={e => updateLine(i, { taxRate: Number(e.target.value) })} placeholder="Tax %" min="0" max="100" step="0.01" className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-indigo-900/10 dark:bg-indigo-900/20 border border-indigo-800/30">
                <div className="flex justify-between text-sm py-1"><span className="text-neutral-500">Subtotal</span><span className="font-bold">{form.currency} {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm py-1"><span className="text-neutral-500">Tax</span><span className="font-bold">{form.currency} {taxTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-lg pt-2 border-t border-indigo-800/30 mt-2"><span className="font-bold">Total</span><span className="font-bold text-indigo-600 dark:text-indigo-400">{form.currency} {total.toLocaleString()}</span></div>
              </div>

              <Field label="Notes">
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Review</h3>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
                {selectedPO && <Row label="Purchase Order" value={selectedPO.number} />}
                <Row label="Supplier" value={selectedPO?.supplierName || form.supplierNameManual || '—'} />
                {form.supplierInvoiceRef && <Row label="Supplier ref" value={form.supplierInvoiceRef} />}
                <Row label="Invoice date" value={form.invoiceDate} />
                {form.dueDate && <Row label="Due date" value={form.dueDate} />}
                <Row label="Currency" value={form.currency} />
                <Row label="Lines" value={String(lines.length)} />
                <Row label="Total" value={form.currency + ' ' + total.toLocaleString()} bold />
              </div>

              <label className="flex items-center gap-2 p-4 rounded-xl bg-amber-900/10 dark:bg-amber-900/20 border border-amber-800/30 cursor-pointer">
                <input type="checkbox" checked={submitOnSave} onChange={e => setSubmitOnSave(e.target.checked)} />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Submit immediately</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Locks the header + lines. Otherwise saved as DRAFT.</p>
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
                if (step === 1 && !source) { setError('Choose a source'); return }
                if (step === 2) {
                  if (source === 'from-po' && !selectedPO) { setError('Pick a purchase order'); return }
                  for (let i = 0; i < lines.length; i++) {
                    if (!lines[i].description.trim()) { setError('Line ' + (i+1) + ': description required'); return }
                  }
                }
                setError('')
                setStep(s => s + 1)
              }} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <>
                <button type="button" onClick={() => save(false)} disabled={saving} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
                </button>
                <button type="button" onClick={() => save(true)} disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
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
      <span className={bold ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'font-medium'}>{value}</span>
    </div>
  )
}