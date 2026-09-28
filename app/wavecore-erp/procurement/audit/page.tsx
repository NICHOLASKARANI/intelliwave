'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Shield, Search, Loader2, Filter, ArrowLeft, RefreshCw, X,
  ChevronLeft, ChevronRight, FileDown, ExternalLink, AlertCircle,
  Activity, CheckCircle2,
} from 'lucide-react'

interface Ev {
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
  'ProcurementSettings','PurchaseRequisition','Supplier','Unknown',
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

export default function AuditPage() {
  const [events, setEvents] = useState<Ev[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [entityType, setEntityType] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [total, setTotal] = useState(0)
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)

  const buildQuery = () => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (entityType) p.set('entityType', entityType)
    if (eventTypeFilter) p.set('eventType', eventTypeFilter)
    if (fromDate) p.set('fromDate', fromDate)
    if (toDate) p.set('toDate', toDate)
    return p
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const p = buildQuery()
      p.set('limit', String(limit))
      p.set('offset', String(offset))

      const res = await fetch('/api/wavecore/procurement/audit?' + p.toString())
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setEvents(data.events || [])
      setCounts(data.counts || {})
      setTotal(data.total || 0)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchEvents() /* eslint-disable-next-line */ }, [q, entityType, eventTypeFilter, fromDate, toDate, offset])

  const exportCSV = () => {
    const p = buildQuery()
    window.open('/api/wavecore/procurement/audit/export?' + p.toString(), '_blank')
  }

  const clearFilters = () => {
    setQ(''); setEntityType(''); setEventTypeFilter(''); setFromDate(''); setToDate(''); setOffset(0)
  }

  const activeFilters = [entityType, eventTypeFilter, fromDate, toDate].filter(Boolean).length + (q ? 1 : 0)

  const linkFor = (e: Ev): string | null => {
    const base = ENTITY_ROUTES[e.entityType]
    if (!base || !e.entityId) return null
    return base + e.entityId
  }

  const totalCounts = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Audit Log</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Procurement
        </Link>

        <div className="rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-neutral-800 p-6 lg:p-8 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Shield className="w-8 h-8" /> Audit Log
              </h1>
              <p className="text-white/80 text-sm">Compliance-grade record of every procurement action · {total} event{total !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={exportCSV} className="px-5 py-3 rounded-xl bg-white text-slate-700 font-bold flex items-center gap-2 shadow-lg">
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}

        {/* Summary pills */}
        {totalCounts > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            <button onClick={() => { setEntityType(''); setOffset(0) }} className={'px-3 py-1.5 rounded-full text-xs font-bold ' + (!entityType ? 'bg-slate-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
              All ({totalCounts})
            </button>
            {Object.entries(counts).map(([et, n]) => (
              <button key={et} onClick={() => { setEntityType(et); setOffset(0) }} className={'px-3 py-1.5 rounded-full text-xs font-bold ' + (entityType === et ? 'bg-slate-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>
                {et} ({n})
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={e => { setQ(e.target.value); setOffset(0) }} placeholder="Search summary, actor, event type…" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (showFilters ? 'bg-slate-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
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
              <input value={eventTypeFilter} onChange={e => { setEventTypeFilter(e.target.value); setOffset(0) }} placeholder="Event type (prefix ok)" className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setOffset(0) }} className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              <button onClick={clearFilters} className="col-span-2 md:col-span-4 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Table */}
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
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      <th className="px-3 py-3 whitespace-nowrap">Timestamp</th>
                      <th className="px-3 py-3">Event</th>
                      <th className="px-3 py-3">Entity</th>
                      <th className="px-3 py-3">Actor</th>
                      <th className="px-3 py-3">Summary</th>
                      <th className="px-3 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(e => {
                      const link = linkFor(e)
                      return (
                        <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-3 py-2 whitespace-nowrap text-neutral-500 font-mono text-[10px]">
                            {new Date(e.createdAt).toLocaleString('en-GB')}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">{e.eventType}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                            {e.entityType}
                            <div className="text-[9px] text-neutral-500 font-mono">{e.entityId?.slice(0, 12)}…</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{e.actorName || 'System'}</td>
                          <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{e.summary || '—'}</td>
                          <td className="px-3 py-2 text-right">
                            {link && (
                              <a href={link} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-slate-600 inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {total > limit && (
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-xs text-neutral-500">Showing {offset + 1}–{Math.min(offset + limit, offset + events.length)} of {total}</span>
                <div className="flex gap-2">
                  <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40 flex items-center gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold disabled:opacity-40 flex items-center gap-1">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}