'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, Search, Plus, Loader2, X, AlertTriangle, CheckCircle2,
  Filter, ArrowLeft, RefreshCw, ClipboardList, Inbox, Send, Clock,
  Truck, CheckCheck, Layers, ChevronLeft, ChevronRight, Save,
  Warehouse, FileText, Users, Calendar, Package2,
} from 'lucide-react'

interface GRN {
  id: string
  grnNumber: string
  purchaseOrderId: string
  status: string
  receivedAt?: string
  receivedByName?: string
  deliveryNoteNumber?: string
  totalReceived: number
  currency: string
  hasVariance: boolean
  notes?: string
  createdAt: string
  poNumber?: string
  supplierName?: string
  linesCount: number
}

interface POListItem {
  id: string
  number: string
  status: string
  supplierName?: string
  currency: string
  total: number
  amount: number
  deliveryDate?: string
}

interface POLine {
  id: string
  description: string
  quantity: number
  receivedQty: number
  unitPrice: number
  taxRate: number
  unitOfMeasure?: string
}

interface ReceiveLine {
  purchaseOrderItemId: string
  description: string
  orderedQty: number
  alreadyReceived: number
  receivedQty: number
  rejectedQty: number
  damagedQty: number
  unitPrice: number
  taxRate: number
  unitOfMeasure: string
  condition: string
  batchNumber?: string
  notes?: string
}

const STATUSES = ['DRAFT','SUBMITTED','INSPECTED','ACCEPTED','REJECTED','CANCELLED']
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  INSPECTED: 'Inspected',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}
const UOM = ['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY']
const CONDITIONS = ['GOOD','DAMAGED','REJECTED']

export default function GoodsReceiptsPage() {
  const [grns, setGrns] = useState<GRN[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const [showWizard, setShowWizard] = useState(false)

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchGRNs = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (statusFilter) p.set('status', statusFilter)
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/goods-receipts?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setGrns(data.goodsReceipts || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchGRNs() /* eslint-disable-next-line */ }, [q, statusFilter, offset])

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-800 text-neutral-300'
      case 'SUBMITTED': return 'bg-blue-900/50 text-blue-300'
      case 'INSPECTED': return 'bg-amber-900/50 text-amber-300'
      case 'ACCEPTED': return 'bg-green-900/50 text-green-300'
      case 'REJECTED': return 'bg-red-900/50 text-red-300'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const clearFilters = () => { setQ(''); setStatusFilter(''); setOffset(0) }
  const activeFilters = [statusFilter].filter(Boolean).length + (q ? 1 : 0)

  const drafts = grns.filter(g => g.status === 'DRAFT').length
  const submitted = grns.filter(g => g.status === 'SUBMITTED').length
  const inspected = grns.filter(g => g.status === 'INSPECTED').length
  const accepted = grns.filter(g => g.status === 'ACCEPTED').length

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Goods Receipts</span>
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
                <Package2 className="w-8 h-8" /> Goods Receipts
              </h1>
              <p className="text-white/80 text-sm">GRN · {total} total</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/wavecore-erp/procurement/orders" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Package className="w-4 h-4" /> Purchase Orders
              </Link>
              <Link href="/wavecore-erp/procurement/requisitions" className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Requisitions
              </Link>
              <button onClick={() => setShowWizard(true)} className="px-5 py-3 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg">
                <Plus className="w-4 h-4" /> Receive Goods
              </button>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi icon={FileText} label="Drafts" value={drafts} color="text-neutral-500" />
          <Kpi icon={Clock} label="Submitted" value={submitted} color="text-blue-500" />
          <Kpi icon={Truck} label="Inspected" value={inspected} color="text-amber-500" />
          <Kpi icon={CheckCheck} label="Accepted" value={accepted} color="text-green-500" />
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search GRN number, delivery note, notes…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={fetchGRNs} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
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
        ) : grns.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Package2 className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 mb-4">{activeFilters > 0 ? 'No GRNs match your filters' : 'No goods receipts yet'}</p>
            <button onClick={() => setShowWizard(true)} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Receive First GRN
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {grns.map(g => (
                <Link key={g.id} href={'/wavecore-erp/procurement/goods-receipts/' + g.id} className="block p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{g.grnNumber}</span>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(g.status)}>{STATUS_LABELS[g.status] || g.status}</span>
                        {g.hasVariance && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/50 text-amber-300">variance</span>}
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white text-sm truncate flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-neutral-400" /> PO {g.poNumber || '—'} · {g.supplierName || 'Unknown supplier'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 flex-wrap">
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{g.linesCount} line{g.linesCount !== 1 ? 's' : ''}</span>
                        {g.deliveryNoteNumber && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />DN {g.deliveryNoteNumber}</span>}
                        {g.receivedAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />received {new Date(g.receivedAt).toLocaleDateString('en-GB')}</span>}
                        {g.receivedByName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{g.receivedByName}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {g.currency} {Number(g.totalReceived || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-neutral-500">{new Date(g.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + grns.length)} of {total}</span>
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
        <ReceiveWizard onClose={() => setShowWizard(false)} onCreated={() => { setShowWizard(false); flash('Goods receipt created'); fetchGRNs() }} />
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
// Receive Wizard — 3 steps
// ============================================================
function ReceiveWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)

  const [pos, setPos] = useState<POListItem[]>([])
  const [poQuery, setPoQuery] = useState('')
  const [loadingPos, setLoadingPos] = useState(false)
  const [selectedPO, setSelectedPO] = useState<POListItem | null>(null)

  const [lines, setLines] = useState<ReceiveLine[]>([])
  const [loadingLines, setLoadingLines] = useState(false)

  const [form, setForm] = useState({
    deliveryNoteNumber: '',
    vehicleNumber: '',
    driverName: '',
    warehouseId: '',
    receivedAt: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitOnSave, setSubmitOnSave] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  // Load receivable POs
  useEffect(() => {
    if (step !== 1) return
    setLoadingPos(true)
    // Fetch all, filter client-side to receivable statuses
    fetch('/api/wavecore/procurement/purchase-orders?limit=100&sort=createdAt&order=desc')
      .then(r => r.json())
      .then(d => {
        const receivable = ['APPROVED','SENT','ACKNOWLEDGED','PARTIALLY_RECEIVED']
        const list = (d.purchaseOrders || []).filter((p: POListItem) => receivable.includes(p.status))
        setPos(list)
      })
      .catch(() => setPos([]))
      .finally(() => setLoadingPos(false))
  }, [step])

  // Load PO lines when PO picked
  const pickPO = async (po: POListItem) => {
    setSelectedPO(po)
    setLoadingLines(true)
    try {
      const res = await fetch('/api/wavecore/procurement/purchase-orders/' + po.id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load PO'); return }
      const poLines: POLine[] = data.lines || []
      setLines(poLines.map(l => {
        const remaining = Math.max(0, Number(l.quantity) - Number(l.receivedQty || 0))
        return {
          purchaseOrderItemId: l.id,
          description: l.description,
          orderedQty: Number(l.quantity),
          alreadyReceived: Number(l.receivedQty || 0),
          receivedQty: remaining,
          rejectedQty: 0,
          damagedQty: 0,
          unitPrice: Number(l.unitPrice || 0),
          taxRate: Number(l.taxRate || 0),
          unitOfMeasure: l.unitOfMeasure || 'UNIT',
          condition: 'GOOD',
        }
      }))
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setLoadingLines(false)
    }
  }

  const updateLine = (i: number, patch: Partial<ReceiveLine>) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }

  const acceptedOf = (l: ReceiveLine) =>
    Math.max(0, Number(l.receivedQty) - Number(l.rejectedQty) - Number(l.damagedQty))
  const lineTotalOf = (l: ReceiveLine) =>
    acceptedOf(l) * Number(l.unitPrice) * (1 + Number(l.taxRate) / 100)

  const subtotal = lines.reduce((s, l) => s + lineTotalOf(l), 0)
  const totalQty = lines.reduce((s, l) => s + acceptedOf(l), 0)

  const save = async (submit: boolean) => {
    if (!selectedPO) { setError('Pick a purchase order'); setStep(1); return }
    if (lines.length === 0) { setError('No lines to receive'); return }
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      if (Number(l.receivedQty) < 0 || Number(l.rejectedQty) < 0 || Number(l.damagedQty) < 0) {
        setError('Line ' + (i+1) + ': quantities cannot be negative')
        setStep(2)
        return
      }
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        purchaseOrderId: selectedPO.id,
        deliveryNoteNumber: form.deliveryNoteNumber || undefined,
        vehicleNumber: form.vehicleNumber || undefined,
        driverName: form.driverName || undefined,
        warehouseId: form.warehouseId || undefined,
        receivedAt: form.receivedAt || undefined,
        notes: form.notes || undefined,
        lines: lines.map(l => ({
          purchaseOrderItemId: l.purchaseOrderItemId,
          receivedQty: Number(l.receivedQty),
          rejectedQty: Number(l.rejectedQty),
          damagedQty: Number(l.damagedQty),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
          unitOfMeasure: l.unitOfMeasure,
          condition: l.condition,
          batchNumber: l.batchNumber || undefined,
          notes: l.notes || undefined,
        })),
      }

      const res = await fetch('/api/wavecore/procurement/goods-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }

      const grnId = data.goodsReceipt?.id
      if (submit && grnId) {
        const sres = await fetch('/api/wavecore/procurement/goods-receipts/' + grnId + '/submit', {
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

  const filteredPOs = pos.filter(p =>
    !poQuery ||
    (p.number || '').toLowerCase().includes(poQuery.toLowerCase()) ||
    (p.supplierName || '').toLowerCase().includes(poQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">

        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package2 className="w-5 h-5 text-emerald-500" /> Receive Goods
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

          {/* Step 1 — Pick PO */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-emerald-500" /> Pick a Purchase Order to receive against</h3>
              <input value={poQuery} onChange={e => setPoQuery(e.target.value)} placeholder="Search PO number or supplier…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                {loadingPos ? <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-emerald-500" /></div>
                : filteredPOs.length === 0 ? <p className="p-6 text-center text-sm text-neutral-500">No receivable POs found (must be APPROVED, SENT, ACKNOWLEDGED or PARTIALLY_RECEIVED)</p>
                : filteredPOs.map(p => (
                  <button key={p.id} onClick={() => pickPO(p)} className={'w-full text-left p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition ' + (selectedPO?.id === p.id ? 'bg-emerald-900/20' : '')}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-emerald-500">{p.number}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">{p.status}</span>
                        </div>
                        <p className="text-sm font-medium">{p.supplierName || 'Unknown supplier'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{p.currency} {Number(p.total || p.amount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Lines + delivery info */}
          {step === 2 && (
            <div className="space-y-5">
              {selectedPO && (
                <div className="p-3 rounded-xl bg-emerald-900/10 dark:bg-emerald-900/20 border border-emerald-800/30">
                  <p className="text-xs text-neutral-500">Receiving against</p>
                  <p className="text-sm font-bold">{selectedPO.number} · {selectedPO.supplierName}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Delivery Note #">
                  <input value={form.deliveryNoteNumber} onChange={e => setForm({ ...form, deliveryNoteNumber: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Received date">
                  <input type="date" value={form.receivedAt} onChange={e => setForm({ ...form, receivedAt: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Vehicle number">
                  <input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Driver name">
                  <input value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Warehouse ID">
                  <input value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })} placeholder="optional" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
              </div>

              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2"><Layers className="w-4 h-4 text-emerald-500" /> Lines ({lines.length})</h3>
                {loadingLines ? (
                  <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-emerald-500" /></div>
                ) : lines.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-4 text-center">No lines to receive</p>
                ) : (
                  <div className="space-y-3">
                    {lines.map((l, i) => (
                      <div key={i} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-[220px]">
                            <p className="text-sm font-bold">{l.description}</p>
                            <p className="text-[10px] text-neutral-500">
                              Ordered {l.orderedQty} · Already received {l.alreadyReceived} · Remaining {Math.max(0, l.orderedQty - l.alreadyReceived)} {l.unitOfMeasure}
                            </p>
                          </div>
                          <div className="text-right text-xs">
                            <p className="text-neutral-500">Unit {Number(l.unitPrice).toLocaleString()} · Tax {l.taxRate}%</p>
                            <p className="font-bold text-emerald-500 mt-1">Line total: {acceptedOf(l) * l.unitPrice * (1 + l.taxRate / 100) > 0 ? (acceptedOf(l) * l.unitPrice * (1 + l.taxRate / 100)).toLocaleString() : '0'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Field label="Received">
                            <input type="number" value={l.receivedQty} onChange={e => updateLine(i, { receivedQty: Number(e.target.value) })} min="0" step="0.01" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                          </Field>
                          <Field label="Rejected">
                            <input type="number" value={l.rejectedQty} onChange={e => updateLine(i, { rejectedQty: Number(e.target.value) })} min="0" step="0.01" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                          </Field>
                          <Field label="Damaged">
                            <input type="number" value={l.damagedQty} onChange={e => updateLine(i, { damagedQty: Number(e.target.value) })} min="0" step="0.01" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" />
                          </Field>
                          <Field label="Condition">
                            <select value={l.condition} onChange={e => updateLine(i, { condition: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm">
                              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Notes">
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Review</h3>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2 text-sm">
                <Row label="PO" value={selectedPO?.number || '—'} />
                <Row label="Supplier" value={selectedPO?.supplierName || '—'} />
                {form.deliveryNoteNumber && <Row label="Delivery note" value={form.deliveryNoteNumber} />}
                <Row label="Received date" value={form.receivedAt} />
                <Row label="Lines" value={String(lines.length)} />
                <Row label="Total qty accepted" value={String(totalQty)} />
                <Row label="Total value" value={(selectedPO?.currency || 'KES') + ' ' + subtotal.toLocaleString()} bold />
              </div>

              <label className="flex items-center gap-2 p-4 rounded-xl bg-amber-900/10 dark:bg-amber-900/20 border border-amber-800/30 cursor-pointer">
                <input type="checkbox" checked={submitOnSave} onChange={e => setSubmitOnSave(e.target.checked)} />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Submit immediately</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Applies receivedQty to the PO, auto-advances PO status, and auto-creates Quality Inspection records. Otherwise saved as DRAFT.</p>
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
                if (step === 1 && !selectedPO) { setError('Pick a purchase order'); return }
                if (step === 2 && lines.length === 0) { setError('No lines to receive'); return }
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