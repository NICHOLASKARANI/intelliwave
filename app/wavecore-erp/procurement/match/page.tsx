'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, AlertTriangle, Package, Package2, Receipt,
  FileWarning, CheckCircle2, Clock, RefreshCw, ArrowRight, Layers,
} from 'lucide-react'

interface Kpis {
  receivingGaps: number
  invoicingGaps: number
  noPo: number
  awaitingMatch: number
  matchExceptions: number
}

interface GapRow {
  id: string
  number?: string
  grnNumber?: string
  invoiceNumber?: string
  supplierName?: string
  poNumber?: string
  status?: string
  matchStatus?: string
  matchNotes?: string
  total?: number
  totalReceived?: number
  currency?: string
  createdAt?: string
  poDate?: string
  invoiceDate?: string
  receivedAt?: string
  supplierInvoiceRef?: string
}

interface DashboardData {
  kpis: Kpis
  receiving: GapRow[]
  invoicing: GapRow[]
  noPo: GapRow[]
  awaiting: GapRow[]
  exceptions: GapRow[]
  generatedAt: string
}

type TabKey = 'receiving' | 'invoicing' | 'noPo' | 'awaiting' | 'exceptions'

const TABS: { key: TabKey; label: string; icon: any; kpiKey: keyof Kpis; hint: string }[] = [
  { key: 'receiving',  label: 'Receiving gaps',   icon: Package,      kpiKey: 'receivingGaps',  hint: 'POs sent but no goods receipt logged' },
  { key: 'invoicing',  label: 'Invoicing gaps',   icon: Receipt,      kpiKey: 'invoicingGaps',  hint: 'Goods received but no invoice recorded' },
  { key: 'noPo',       label: 'No PO',            icon: FileWarning,  kpiKey: 'noPo',           hint: 'Invoices with no purchase order reference' },
  { key: 'awaiting',   label: 'Awaiting match',   icon: Clock,        kpiKey: 'awaitingMatch',  hint: 'Invoices not yet 3-way matched' },
  { key: 'exceptions', label: 'Match exceptions', icon: AlertTriangle,kpiKey: 'matchExceptions',hint: 'Invoices flagged with variance' },
]

const daysAgo = (iso?: string): number | null => {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (isNaN(t)) return null
  return Math.floor((Date.now() - t) / 86400000)
}

const fmtMoney = (n: any, cur?: string) => {
  if (n == null) return '—'
  return (cur || '') + ' ' + Number(n || 0).toLocaleString()
}

export default function MatchDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [tab, setTab] = useState<TabKey>('receiving')

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/procurement/match/dashboard', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to load'); return }
      setData(json)
      setError('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  // 60-second silent auto-refresh
  useEffect(() => {
    const t = setInterval(() => { load({ silent: true }) }, 60000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [])

  const kpis: Kpis = data?.kpis || {
    receivingGaps: 0, invoicingGaps: 0, noPo: 0, awaitingMatch: 0, matchExceptions: 0,
  }

  const rows: GapRow[] = data ? data[tab] : []

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/procurement" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold">Match Dashboard</span>
          </div>
          <button
            onClick={() => load({ silent: true })}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40"
          >
            <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">

        <div className="rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Layers className="w-8 h-8" /> Three-Way Match Gaps
              </h1>
              <p className="text-white/80 text-sm">
                Cross-document view — PO → GRN → Invoice. Updated {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString('en-GB') : 'just now'}.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* KPI strip — clickable, sets tab */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiTile
            icon={Package} label="Receiving gaps" value={kpis.receivingGaps}
            color="text-pink-500"
            active={tab === 'receiving'}
            onClick={() => setTab('receiving')}
          />
          <KpiTile
            icon={Receipt} label="Invoicing gaps" value={kpis.invoicingGaps}
            color="text-indigo-500"
            active={tab === 'invoicing'}
            onClick={() => setTab('invoicing')}
          />
          <KpiTile
            icon={FileWarning} label="No PO" value={kpis.noPo}
            color="text-amber-500"
            active={tab === 'noPo'}
            onClick={() => setTab('noPo')}
          />
          <KpiTile
            icon={Clock} label="Awaiting match" value={kpis.awaitingMatch}
            color="text-cyan-500"
            active={tab === 'awaiting'}
            onClick={() => setTab('awaiting')}
          />
          <KpiTile
            icon={AlertTriangle} label="Match exceptions" value={kpis.matchExceptions}
            color="text-red-500"
            active={tab === 'exceptions'}
            onClick={() => setTab('exceptions')}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map(t => {
            const Icon = t.icon
            const count = kpis[t.kpiKey]
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ' +
                  (isActive
                    ? 'bg-white dark:bg-neutral-900 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-neutral-400')
                }
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (isActive ? 'bg-emerald-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Hint */}
        <p className="text-xs text-neutral-500 mb-3 px-1">
          {TABS.find(t => t.key === tab)?.hint}
        </p>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-500">Nothing here — all clear</p>
              <p className="text-xs text-neutral-400 mt-1">This category has no outstanding items.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Age</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const age = daysAgo(r.createdAt || r.poDate || r.invoiceDate || r.receivedAt)
                    const ageClass = age == null ? '' : age > 60 ? 'text-red-500 font-bold' : age > 30 ? 'text-amber-500 font-bold' : 'text-neutral-500'
                    const amount = r.total != null ? r.total : r.totalReceived
                    const href = docHref(tab, r.id)
                    const docLabel = docLabelFn(tab, r)
                    return (
                      <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                        <td className="px-4 py-3 align-top">
                          <Link href={href} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                            {docLabel}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top text-xs max-w-[220px] truncate">
                          {r.supplierName || '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-neutral-500">
                          {r.poNumber && <p>PO {r.poNumber}</p>}
                          {r.grnNumber && <p>GRN {r.grnNumber}</p>}
                          {r.supplierInvoiceRef && <p>ref {r.supplierInvoiceRef}</p>}
                          {!r.poNumber && !r.grnNumber && !r.supplierInvoiceRef && '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {r.matchStatus ? (
                            <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + matchPill(r.matchStatus)}>
                              {r.matchStatus}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">
                              {r.status || '—'}
                            </span>
                          )}
                          {r.matchNotes && <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px] truncate">{r.matchNotes}</p>}
                        </td>
                        <td className="px-4 py-3 align-top text-right text-xs font-bold">
                          {fmtMoney(amount, r.currency)}
                        </td>
                        <td className={'px-4 py-3 align-top text-right text-xs ' + ageClass}>
                          {age == null ? '—' : age + 'd'}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-900/20 text-xs font-bold"
                            title="Open"
                          >
                            Open <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[11px] text-neutral-500 text-center mt-6">
          Read-only view. Nothing on this page writes to your data.
        </p>
      </main>
    </div>
  )
}

// ============================================================
// KPI tile — clickable, sets active tab
// ============================================================
function KpiTile({ icon: Icon, label, value, color, active, onClick }: any) {
  const cls = 'text-left w-full bg-white dark:bg-neutral-900 rounded-2xl border p-4 transition cursor-pointer ' +
    (active
      ? 'border-emerald-500 ring-1 ring-emerald-500/30'
      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400')
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Icon className={'w-4 h-4 mb-2 ' + color} />
      <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
    </button>
  )
}

// ============================================================
// Helpers
// ============================================================
function docHref(tab: TabKey, id: string): string {
  switch (tab) {
    case 'receiving':  return '/wavecore-erp/procurement/orders/' + id
    case 'invoicing':  return '/wavecore-erp/procurement/goods-receipts/' + id
    case 'noPo':       return '/wavecore-erp/procurement/supplier-invoices/' + id
    case 'awaiting':   return '/wavecore-erp/procurement/supplier-invoices/' + id
    case 'exceptions': return '/wavecore-erp/procurement/supplier-invoices/' + id
  }
}

function docLabelFn(tab: TabKey, r: GapRow): string {
  switch (tab) {
    case 'receiving':  return r.number || '(no number)'
    case 'invoicing':  return r.grnNumber || '(no number)'
    case 'noPo':       return r.invoiceNumber || '(no number)'
    case 'awaiting':   return r.invoiceNumber || '(no number)'
    case 'exceptions': return r.invoiceNumber || '(no number)'
  }
}

function matchPill(s: string): string {
  switch (s) {
    case 'AUTO_MATCHED': return 'bg-green-900/50 text-green-300'
    case 'PARTIAL':      return 'bg-orange-900/50 text-orange-300'
    case 'EXCEPTION':    return 'bg-red-900/50 text-red-300'
    case 'UNMATCHED':    return 'bg-neutral-800 text-neutral-400'
    default:             return 'bg-neutral-800 text-neutral-400'
  }
}