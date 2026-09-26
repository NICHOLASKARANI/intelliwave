'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, ArrowRight, FileText, Calendar,
  DollarSign, User, Package2, ClipboardList, Inbox, Send, Clock,
  Truck, CheckCheck, FileSpreadsheet, Trash2, ChevronLeft, ChevronRight,
  Save, Users, Layers,
} from 'lucide-react'

interface PO {
  id: string
  number: string
  date: string
  status: string
  type: string
  total: number
  amount: number
  currency: string
  supplierId?: string
  supplierName?: string
  requisitionId?: string
  deliveryDate?: string
  sentAt?: string
  acknowledgedAt?: string
  closedAt?: string
  linesCount: number
  fullyReceivedLines: number
  createdAt: string
}

interface Supplier {
  id: string
  name: string
  legalName?: string
  currency?: string
  paymentTerms?: number
}

interface ApprovedRequisition {
  id: string
  requisitionNumber: string
  title: string
  currency: string
  totalAmount: number
  category: string
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  unitOfMeasure: string
  productId?: string
  specifications?: string
}

const PO_STATUSES = [
  'DRAFT','SUBMITTED','APPROVED','REJECTED','SENT','ACKNOWLEDGED',
  'PARTIALLY_RECEIVED','FULLY_RECEIVED','INVOICED','MATCHED','CLOSED','CANCELLED',
]

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SENT: 'Sent',
  ACKNOWLEDGED: 'Acknowledged',
  PARTIALLY_RECEIVED: 'Partial',
  FULLY_RECEIVED: 'Received',
  INVOICED: 'Invoiced',
  MATCHED: 'Matched',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

const PO_TYPES = ['STANDARD','BLANKET','FRAMEWORK','CONTRACT','SERVICE','INVENTORY','ASSET','PROJECT','DROP_SHIP','CONSIGNMENT','RECURRING','EMERGENCY']
const UOM = ['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY']

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filters
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  // Wizard
  const [showWizard, setShowWizard] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (statusFilter) p.set('status', statusFilter)
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/purchase-orders?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setOrders(data.purchaseOrders || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchOrders() /* eslint-disable-next-line */ }, [q, statusFilter, offset])

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-800 text-neutral-300'
      case 'SUBMITTED': return 'bg-amber-900/50 text-amber-300'
      case 'APPROVED': return 'bg-green-900/50 text-green-300'
      case 'REJECTED': return 'bg-red-900/50 text-red-300'
      case 'SENT': return 'bg-blue-900/50 text-blue-300'
      case 'ACKNOWLEDGED': return 'bg-cyan-900/50 text-cyan-300'
      case 'PARTIALLY_RECEIVED': return 'bg-orange-900/50 text-orange-300'
      case 'FULLY_RECEIVED': return 'bg-emerald-900/50 text-emerald-300'
      case 'INVOICED': return 'bg-indigo-900/50 text-indigo-300'
      case 'MATCHED': return 'bg-purple-900/50 text-purple-300'
      case 'CLOSED': return 'bg-neutral-700 text-neutral-400'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const clearFilters = () => { setQ(''); setStatusFilter(''); setOffset(0) }
  const activeFilters = [statusFilter].filter(Boolean).length + (q ? 1 : 0)

  // KPI counters
  const drafts = orders.filter(o => o.status === 'DRAFT').length
  const awaiting = orders.filter(o => o.status === 'SUBMITTED').length
  const sent = orders.filter(o => o.status === 'SENT').length
  const acknowledged = orders.filter(o => o.status === 'ACKNOWLEDGED').length

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Purchase Orders</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Package className="w-8 h-8" /> Purchase Orders
              </h1>
              <p className="text-white/80 text-sm">PO lifecycle · {total} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/requisitions" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Requisitions
              </Link>
              <Link href="/wavecore-erp/procurement/approvals/inbox" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Inbox className="w-4 h-4" /> Approvals
              </Link>
              <button onClick={() => setShowWizard(true)} className="px-5 py-3 rounded-xl bg-white text-rose-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> New PO
              </button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi icon={FileText} label="Drafts" value={drafts} color="text-neutral-500" />
          <Kpi icon={Clock} label="Awaiting approval" value={awaiting} color="text-amber-500" />
          <Kpi icon={Send} label="Sent to supplier" value={sent} color="text-blue-500" />
          <Kpi icon={CheckCheck} label="Acknowledged" value={acknowledged} color="text-cyan-500" />
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search PO number, supplier, notes…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-rose-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={fetchOrders} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {PO_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
              </select>
              <button onClick={clearFilters} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-rose-500" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Package className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No POs match your filters' : 'No purchase orders yet'}</p>
            <button onClick={() => setShowWizard(true)} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First PO
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {orders.map(o => (
                <Link key={o.id} href={'/wavecore-erp/procurement/orders/' + o.id} className="block p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{o.number}</span>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(o.status)}>{STATUS_LABELS[o.status] || o.status}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">{o.type}</span>
                        {o.requisitionId && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/50 text-indigo-300">from req</span>}
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white text-sm truncate flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-neutral-400" /> {o.supplierName || 'Unknown supplier'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 flex-wrap">
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{o.linesCount} line{o.linesCount !== 1 ? 's' : ''}</span>
                        {o.deliveryDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />delivery {new Date(o.deliveryDate).toLocaleDateString('en-GB')}</span>}
                        <span>{new Date(o.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {o.currency} {Number(o.total || o.amount || 0).toLocaleString()}
                      </p>
                      {o.fullyReceivedLines > 0 && o.fullyReceivedLines < o.linesCount && (
                        <p className="text-[10px] text-orange-500 font-bold mt-1">{o.fullyReceivedLines}/{o.linesCount} received</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + orders.length)} of {total}</span>
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
        <POWizard onClose={() => setShowWizard(false)} onCreated={() => { setShowWizard(false); flash('Purchase order created'); fetchOrders() }} />
      )}
    </div>
  )
}

// ============================================================
// KPI tile
// ============================================================
function Kpi({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      <Icon className={'w-5 h-5 mb-2 ' + color} />
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
    </div>
  )
}

// ============================================================
// Create Wizard — supports "new" and "from requisition"
// ============================================================
function POWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [source, setSource] = useState<'new' | 'from-req' | null>(null)

  // Supplier
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierQuery, setSupplierQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  // Requisition picker
  const [approvedReqs, setApprovedReqs] = useState<ApprovedRequisition[]>([])
  const [reqQuery, setReqQuery] = useState('')
  const [selectedReq, setSelectedReq] = useState<ApprovedRequisition | null>(null)
  const [loadingReqs, setLoadingReqs] = useState(false)

  // Header form
  const [form, setForm] = useState({
    type: 'STANDARD',
    currency: 'KES',
    paymentTerms: 30,
    deliveryDate: '',
    deliveryLocation: '',
    incoterms: '',
    notes: '',
  })

  // Lines
  const [lines, setLines] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' },
  ])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitOnSave, setSubmitOnSave] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  // ---- Load suppliers ----
  useEffect(() => {
    if (step !== 2) return
    setLoadingSuppliers(true)
    fetch('/api/wavecore/procurement/suppliers?status=ACTIVE&limit=50')
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
      .catch(() => {})
      .finally(() => setLoadingSuppliers(false))
  }, [step])

  // ---- Load approved requisitions ----
  useEffect(() => {
    if (step !== 2 || source !== 'from-req') return
    setLoadingReqs(true)
    fetch('/api/wavecore/procurement/requisitions?status=APPROVED&limit=50')
      .then(r => r.json())
      .then(d => setApprovedReqs(d.requisitions || []))
      .catch(() => {})
      .finally(() => setLoadingReqs(false))
  }, [step, source])

  // ---- When requisition selected, load preview + auto-fill lines + suggested supplier ----
  const pickRequisition = async (req: ApprovedRequisition) => {
    setSelectedReq(req)
    try {
      const res = await fetch('/api/wavecore/procurement/purchase-orders/from-requisition/' + req.id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load preview'); return }

      // Auto-fill lines
      setLines((data.candidateLines || []).map((l: any) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        taxRate: Number(l.taxRate || 0),
        unitOfMeasure: l.unitOfMeasure || 'UNIT',
        productId: l.productId,
        specifications: l.specifications,
      })))

      // Auto-select suggested supplier
      if (data.suggestedSupplierId && data.suggestedSuppliers?.length > 0) {
        const sup = data.suggestedSuppliers[0]
        setSelectedSupplier({
          id: sup.id,
          name: sup.name,
          legalName: sup.legalName,
          currency: sup.currency,
          paymentTerms: sup.paymentTerms,
        })
        setForm(f => ({
          ...f,
          currency: sup.currency || req.currency || 'KES',
          paymentTerms: sup.paymentTerms || 30,
          notes: 'Auto-converted from requisition ' + req.requisitionNumber,
        }))
      } else {
        setForm(f => ({
          ...f,
          currency: req.currency || 'KES',
          notes: 'Auto-converted from requisition ' + req.requisitionNumber,
        }))
      }
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    }
  }

  // ---- Line helpers ----
  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' }])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))
  const updateLine = (i: number, patch: Partial<LineItem>) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0)
  const taxTotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * ((Number(l.taxRate) || 0) / 100), 0)
  const total = subtotal + taxTotal

  // ---- Save ----
  const save = async (submit: boolean) => {
    if (!selectedSupplier) { setError('Please pick a supplier'); setStep(2); return }
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].description.trim()) { setError('Line ' + (i+1) + ': description required'); setStep(3); return }
      if (!(Number(lines[i].quantity) > 0)) { setError('Line ' + (i+1) + ': quantity must be > 0'); setStep(3); return }
    }

    setSaving(true)
    setError('')
    try {
      let url = '/api/wavecore/procurement/purchase-orders'
      let payload: any = {
        supplierId: selectedSupplier.id,
        type: form.type,
        currency: form.currency,
        paymentTerms: form.paymentTerms,
        deliveryDate: form.deliveryDate || undefined,
        deliveryLocation: form.deliveryLocation || undefined,
        incoterms: form.incoterms || undefined,
        notes: form.notes || undefined,
      }

      if (source === 'from-req' && selectedReq) {
        url = '/api/wavecore/procurement/purchase-orders/from-requisition/' + selectedReq.id
        // For from-req, lines come from server, but we also pass edited lines via the standard endpoint if needed.
        // Simpler: use from-req endpoint with no lineIds (= all), so it copies as-is.
      } else {
        payload.lines = lines
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }

      const poId = data.purchaseOrder?.id
      if (submit && poId) {
        const sres = await fetch('/api/wavecore/procurement/purchase-orders/' + poId + '/submit', {
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
    } finally {
      setSaving(false)
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    !supplierQuery || s.name.toLowerCase().includes(supplierQuery.toLowerCase()) ||
    (s.legalName || '').toLowerCase().includes(supplierQuery.toLowerCase())
  )
  const filteredReqs = approvedReqs.filter(r =>
    !reqQuery || r.requisitionNumber.toLowerCase().includes(reqQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(reqQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-500" /> New Purchase Order
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3,4].map(n => (
            <div key={n} className={'flex-1 h-1.5 rounded-full ' + (n <= step ? 'bg-rose-500' : 'bg-neutral-200 dark:bg-neutral-800')}></div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-start gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}</div>}

          {/* Step 1 — Source */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-rose-500" /> Where does this PO come from?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button onClick={() => setSource('new')} className={'p-6 rounded-2xl border-2 text-left transition ' + (source === 'new' ? 'border-rose-500 bg-rose-900/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300')}>
                  <Package className="w-8 h-8 text-rose-500 mb-3" />
                  <p className="font-bold text-sm mb-1">Create new PO</p>
                  <p className="text-xs text-neutral-500">Pick a supplier and add line items manually</p>
                </button>
                <button onClick={() => setSource('from-req')} className={'p-6 rounded-2xl border-2 text-left transition ' + (source === 'from-req' ? 'border-rose-500 bg-rose-900/10' : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300')}>
                  <ClipboardList className="w-8 h-8 text-indigo-500 mb-3" />
                  <p className="font-bold text-sm mb-1">Convert from requisition</p>
                  <p className="text-xs text-neutral-500">Pick an approved requisition — lines auto-copied</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Header (supplier + requisition picker) */}
          {step === 2 && (
            <div className="space-y-5">
              {source === 'from-req' && (
                <div>
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-500" /> Approved Requisition *</h3>
                  <input value={reqQuery} onChange={e => setReqQuery(e.target.value)} placeholder="Search requisition…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mb-2 text-sm" />
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                    {loadingReqs ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-indigo-500" /></div>
                    : filteredReqs.length === 0 ? <p className="p-4 text-center text-sm text-neutral-500">No approved requisitions found</p>
                    : filteredReqs.map(r => (
                      <button key={r.id} onClick={() => pickRequisition(r)} className={'w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition ' + (selectedReq?.id === r.id ? 'bg-indigo-900/20' : '')}>
                        <p className="text-xs font-bold text-indigo-500">{r.requisitionNumber}</p>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-neutral-500">{r.currency} {Number(r.totalAmount || 0).toLocaleString()} · {r.category}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-rose-500" /> Supplier *</h3>
                {selectedSupplier ? (
                  <div className="p-4 rounded-xl bg-rose-900/10 dark:bg-rose-900/20 border border-rose-500/30 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{selectedSupplier.name}</p>
                      {selectedSupplier.legalName && <p className="text-xs text-neutral-500">{selectedSupplier.legalName}</p>}
                    </div>
                    <button onClick={() => setSelectedSupplier(null)} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <input value={supplierQuery} onChange={e => setSupplierQuery(e.target.value)} placeholder="Search supplier…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mb-2 text-sm" />
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                      {loadingSuppliers ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-rose-500" /></div>
                      : filteredSuppliers.length === 0 ? <p className="p-4 text-center text-sm text-neutral-500">No suppliers found</p>
                      : filteredSuppliers.map(s => (
                        <button key={s.id} onClick={() => setSelectedSupplier(s)} className="w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                          <p className="text-sm font-medium">{s.name}</p>
                          {s.legalName && <p className="text-xs text-neutral-500">{s.legalName}</p>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Type">
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {PO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {['KES','USD','EUR','GBP','ZAR','UGX','TZS'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Payment terms (days)">
                  <input type="number" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <Field label="Delivery date">
                  <input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <Field label="Delivery location">
                  <input value={form.deliveryLocation} onChange={e => setForm({ ...form, deliveryLocation: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
                <Field label="Incoterms">
                  <input value={form.incoterms} onChange={e => setForm({ ...form, incoterms: e.target.value })} placeholder="EXW, FOB, CIF…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
                </Field>
              </div>
              <Field label="Notes">
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
              </Field>
            </div>
          )}

          {/* Step 3 — Lines */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-rose-500" /> Line Items {source === 'from-req' && selectedReq ? <span className="text-xs text-neutral-500">(auto-filled — edit as needed)</span> : null}</h3>
                <button type="button" onClick={addLine} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1">
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
                </div>
              ))}

              <div className="p-4 rounded-xl bg-rose-900/10 dark:bg-rose-900/20 border border-rose-800/30">
                <div className="flex justify-between text-sm py-1"><span className="text-neutral-500">Subtotal</span><span className="font-bold">{form.currency} {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm py-1"><span className="text-neutral-500">Tax</span><span className="font-bold">{form.currency} {taxTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-lg pt-2 border-t border-rose-800/30 mt-2"><span className="font-bold">Total</span><span className="font-bold text-rose-600 dark:text-rose-400">{form.currency} {total.toLocaleString()}</span></div>
              </div>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Review</h3>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
                <Row label="Supplier" value={selectedSupplier?.name || '—'} />
                {source === 'from-req' && selectedReq && <Row label="From requisition" value={selectedReq.requisitionNumber} />}
                <Row label="Type" value={form.type} />
                <Row label="Currency" value={form.currency} />
                <Row label="Lines" value={String(lines.length)} />
                <Row label="Total" value={form.currency + ' ' + total.toLocaleString()} bold />
              </div>

              <label className="flex items-center gap-2 p-4 rounded-xl bg-amber-900/10 dark:bg-amber-900/20 border border-amber-800/30 cursor-pointer">
                <input type="checkbox" checked={submitOnSave} onChange={e => setSubmitOnSave(e.target.checked)} />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Submit for approval immediately</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Routes to the configured PO approval chain. Otherwise saved as DRAFT.</p>
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
            {step < 4 && (
              <button type="button" onClick={() => {
                if (step === 1 && !source) { setError('Choose a source'); return }
                if (step === 2 && !selectedSupplier) { setError('Pick a supplier'); return }
                if (step === 3) {
                  for (let i = 0; i < lines.length; i++) {
                    if (!lines[i].description.trim()) { setError('Line ' + (i+1) + ': description required'); return }
                    if (!(Number(lines[i].quantity) > 0)) { setError('Line ' + (i+1) + ': quantity must be > 0'); return }
                  }
                }
                setError('')
                setStep(s => s + 1)
              }} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 4 && (
              <>
                <button type="button" onClick={() => save(false)} disabled={saving} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
                </button>
                <button type="button" onClick={() => save(true)} disabled={saving} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
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
      <span className={bold ? 'font-bold text-rose-600 dark:text-rose-400' : 'font-medium'}>{value}</span>
    </div>
  )
}