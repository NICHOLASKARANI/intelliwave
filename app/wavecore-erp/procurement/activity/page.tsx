'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Activity, Search, Loader2, Filter, ArrowLeft, RefreshCw, X,
  ChevronLeft, ChevronRight, FileText, Users, Package, Package2,
  Receipt, FileSignature, ClipboardList, Wallet, ShieldCheck, Award,
  TrendingUp, CheckCheck, AlertCircle, Plus, Edit, Trash2, Send,
  Check, XCircle, Ban, Clock, Play, Pause, PenTool, DollarSign,
  Microscope, GitBranch, Shield,
} from 'lucide-react'

const ICONS: Record<string, any> = {
  Activity, FileText, Users, Package, Package2, Receipt, FileSignature,
  ClipboardList, Wallet, ShieldCheck, Award, TrendingUp, CheckCheck,
  AlertCircle, Plus, Edit, Trash2, Send, Check, XCircle, Ban, Clock,
  Play, Pause, PenTool, DollarSign, Microscope, GitBranch, Shield,
}

interface Event {
  id: string
  eventType: string
  entityType: string
  entityId: string
  summary?: string
  actorId?: string
  actorName?: string
  metadata?: any
  createdAt: string
}

const ENTITY_TYPES = [
  'PurchaseOrder','GoodsReceipt','QualityInspection','SupplierInvoice',
  'RFQ','SupplierContract','PaymentRun','ProcurementRole','ApprovalChain',
  'PurchaseRequisition','Supplier',
]

const ENTITY_ROUTES: Record<string, string> = {
  PurchaseOrder: '/wavecore-erp/procurement/orders/',
  GoodsReceipt: '/wavecore-erp/procurement/goods-receipts/',
  SupplierInvoice: '/wavecore-erp/procurement/supplier-invoices/',
  RFQ: '/wavecore-erp/procurement/rfqs/',
  SupplierContract: '/wavecore-erp/procurement/contracts/',
  PaymentRun: '/wavecore-erp/procurement/payment-runs/',
  PurchaseRequisition: '/wavecore-erp/procurement/requisitions/',
  Supplier: '/wavecore-erp/procurement/suppliers/',
}

// Inline meta resolver (mirrors lib/wavecore/procurement-activity.ts)
function meta(type: string): { label: string; icon: string; color: string } {
  const t = String(type || '').toUpperCase()
  // Minimal but pragmatic mapping for display
  const M: Record<string, any> = {
    PO_CREATED: { label: 'PO created', icon: 'Package', color: 'text-pink-500' },
    PO_SUBMITTED: { label: 'PO submitted', icon: 'Send', color: 'text-amber-500' },
    PO_APPROVED: { label: 'PO approved', icon: 'Check', color: 'text-green-500' },
    PO_REJECTED: { label: 'PO rejected', icon: 'XCircle', color: 'text-red-500' },
    PO_SENT: { label: 'PO sent', icon: 'Send', color: 'text-blue-500' },
    PO_ACKNOWLEDGED: { label: 'PO acknowledged', icon: 'CheckCheck', color: 'text-cyan-500' },
    GOODS_RECEIPT_CREATED: { label: 'GRN created', icon: 'Package2', color: 'text-emerald-500' },
    GOODS_RECEIPT_SUBMITTED: { label: 'GRN submitted', icon: 'Send', color: 'text-emerald-500' },
    QUALITY_INSPECTION_DECIDED: { label: 'Inspection decided', icon: 'Microscope', color: 'text-amber-500' },
    SUPPLIER_INVOICE_CREATED: { label: 'Invoice created', icon: 'Receipt', color: 'text-indigo-500' },
    SUPPLIER_INVOICE_MATCHED: { label: 'Invoice matched', icon: 'ShieldCheck', color: 'text-purple-500' },
    SUPPLIER_INVOICE_APPROVED: { label: 'Invoice approved', icon: 'Check', color: 'text-green-500' },
    SUPPLIER_INVOICE_PAID: { label: 'Invoice paid', icon: 'DollarSign', color: 'text-purple-500' },
    RFQ_CREATED: { label: 'RFQ created', icon: 'ClipboardList', color: 'text-fuchsia-500' },
    RFQ_PUBLISHED: { label: 'RFQ published', icon: 'Send', color: 'text-blue-500' },
    RFQ_AWARDED: { label: 'RFQ awarded', icon: 'Award', color: 'text-green-500' },
    RFQ_QUOTE_SUBMITTED: { label: 'Quote submitted', icon: 'TrendingUp', color: 'text-purple-500' },
    SUPPLIER_CONTRACT_CREATED: { label: 'Contract created', icon: 'FileSignature', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_ACTIVATED: { label: 'Contract activated', icon: 'Play', color: 'text-green-500' },
    PAYMENT_RUN_CREATED: { label: 'Payment run created', icon: 'Wallet', color: 'text-emerald-500' },
    PAYMENT_RUN_EXECUTED: { label: 'Payment run executed', icon: 'CheckCheck', color: 'text-green-500' },
    PROCUREMENT_ROLE_ASSIGNED: { label: 'Role assigned', icon: 'ShieldCheck', color: 'text-cyan-500' },
    APPROVAL_CHAIN_CREATED: { label: 'Approval chain created', icon: 'GitBranch', color: 'text-cyan-500' },
  }
  return M[t] || { label: t.replace(/_/g, ' '), icon: 'Activity', color: 'text-neutral-400' }
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return sec + 's ago'
  const min = Math.floor(sec / 60); if (min < 60) return min + 'm ago'
  const hr = Math.floor(min / 60); if (hr < 24) return hr + 'h ago'
  const day = Math.floor(hr / 24); if (day < 30) return day + 'd ago'
  const mon = Math.floor(day / 30); if (mon < 12) return mon + 'mo ago'
  return Math.floor(mon / 12) + 'y ago'
}

export default function ActivityPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [entityType, setEntityType] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [total, setTotal] = useState(0)
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (entityType) p.set('entityType', entityType)
      if (fromDate) p.set('fromDate', fromDate)
      if (toDate) p.set('toDate', toDate)
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/activity?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setEvents(data.events || [])
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchEvents() /* eslint-disable-next-line */ }, [q, entityType, fromDate, toDate, offset])

  const clearFilters = () => {
    setQ(''); setEntityType(''); setFromDate(''); setToDate(''); setOffset(0)
  }
  const activeFilters = [entityType, fromDate, toDate].filter(Boolean).length + (q ? 1 : 0)

  const linkFor = (e: Event): string | null => {
    const base = ENTITY_ROUTES[e.entityType]
    if (!base || !e.entityId) return null
    return base + e.entityId
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Activity</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        <div className="rounded-3xl bg-gradient-to-br from-slate-700 via-neutral-700 to-slate-800 p-6 lg:p-8 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Activity className="w-8 h-8" /> Activity
          </h1>
          <p className="text-white/80 text-sm">Full procurement audit trail · {total} event{total !== 1 ? 's' : ''}</p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search summary, actor, event type…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-slate-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              <Filter className="w-4 h-4" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{activeFilters}</span>}
            </button>
            <button onClick={fetchEvents} className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={entityType} onChange={e => { setEntityType(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                <option value="">All entities</option>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              <button onClick={clearFilters} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-500" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Activity className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500">{activeFilters > 0 ? 'No events match your filters' : 'No activity yet'}</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {events.map(e => {
                const m = meta(e.eventType)
                const Icon = ICONS[m.icon] || Activity
                const link = linkFor(e)
                const isExpanded = expanded === e.id
                return (
                  <div key={e.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <button onClick={() => setExpanded(isExpanded ? null : e.id)} className="w-full text-left p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition flex items-start gap-3">
                      <div className={'w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 ' + m.color}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-medium truncate">{e.summary || m.label}</p>
                          <span className="text-[10px] text-neutral-500 font-mono">{e.eventType}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 flex-wrap">
                          <span>{e.actorName || 'System'}</span>
                          <span>·</span>
                          <span>{timeAgo(e.createdAt)}</span>
                          <span>·</span>
                          <span className="font-mono">{e.entityType}</span>
                        </div>
                      </div>
                      {link && (
                        <Link href={link} onClick={ev => ev.stopPropagation()} className="text-[10px] px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-1 flex-shrink-0">
                          open
                        </Link>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-16">
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                          <div className="flex justify-between"><span className="text-neutral-500">Entity ID</span><span className="font-mono">{e.entityId}</span></div>
                          <div className="flex justify-between"><span className="text-neutral-500">Timestamp</span><span>{new Date(e.createdAt).toLocaleString('en-GB')}</span></div>
                          {e.metadata && (
                            <div>
                              <p className="text-neutral-500 mb-1">Metadata</p>
                              <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap p-2 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">{JSON.stringify(e.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + events.length)} of {total}</span>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Previous</button>
                  <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}