'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, AlertTriangle, RefreshCw, ArrowRight,
  Calendar, DollarSign, Clock, AlertCircle, Download, CheckCircle2, Layers,
} from 'lucide-react'

interface Kpis {
  totalOutstanding: number
  totalCount: number
  overdueAmount: number
  overdueCount: number
  due7Amount: number
  due7Count: number
  due30Amount: number
  due30Count: number
  noDueDateAmount: number
  noDueDateCount: number
  bucket0_30Amount: number
  bucket0_30Count: number
  bucket31_60Amount: number
  bucket31_60Count: number
  bucket61_90Amount: number
  bucket61_90Count: number
  bucket90plusAmount: number
  bucket90plusCount: number
}

interface Row {
  id: string
  invoiceNumber?: string
  supplierName?: string
  currency: string
  total: number
  invoiceDate?: string
  dueDate?: string
  status?: string
  matchStatus?: string
  poNumber?: string
  daysOverdue: number | null
  bucket: string
}

interface Data {
  kpis: Kpis
  invoices: Row[]
  generatedAt: string
}

type BucketKey = 'all' | 'overdue' | 'due7' | '0_30' | '31_60' | '61_90' | '90plus' | 'noDueDate'

const BUCKETS: { key: BucketKey; label: string; hint: string }[] = [
  { key: 'all',       label: 'All outstanding', hint: 'Every unpaid, non-cancelled invoice' },
  { key: 'overdue',   label: 'Overdue',         hint: 'Anything past its due date' },
  { key: 'due7',      label: 'Due ≤7d',         hint: 'Falling due within the week' },
  { key: '0_30',      label: '0–30',            hint: '1 to 30 days overdue' },
  { key: '31_60',     label: '31–60',           hint: '31 to 60 days overdue' },
  { key: '61_90',     label: '61–90',           hint: '61 to 90 days overdue' },
  { key: '90plus',    label: '90+',             hint: 'More than 90 days overdue' },
  { key: 'noDueDate', label: 'No due date',     hint: 'Invoices with no due date set' },
]

const money = (n: number, cur?: string) =>
  (cur ? cur + ' ' : '') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const shortMoney = (n: number) => {
  const x = Number(n || 0)
  if (x >= 1e9) return (x / 1e9).toFixed(2) + 'B'
  if (x >= 1e6) return (x / 1e6).toFixed(2) + 'M'
  if (x >= 1e3) return (x / 1e3).toFixed(1) + 'K'
  return String(Math.round(x))
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'

const ageLabel = (days: number | null): string => {
  if (days == null) return '—'
  if (days < 0) return 'in ' + Math.abs(days) + 'd'
  if (days === 0) return 'due today'
  return days + 'd over'
}

const ageClass = (days: number | null): string => {
  if (days == null) return 'text-neutral-500'
  if (days > 90) return 'text-red-500 font-bold'
  if (days > 60) return 'text-orange-500 font-bold'
  if (days > 30) return 'text-amber-500 font-bold'
  if (days > 0)  return 'text-amber-400'
  if (days >= -7) return 'text-cyan-500 font-bold'
  return 'text-neutral-500'
}

export default function AgingReportPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [bucket, setBucket] = useState<BucketKey>('overdue')

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/procurement/aging', { cache: 'no-store' })
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

  useEffect(() => {
    const t = setInterval(() => { load({ silent: true }) }, 60000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [])

  const kpis: Kpis = data?.kpis || {
    totalOutstanding: 0, totalCount: 0,
    overdueAmount: 0, overdueCount: 0,
    due7Amount: 0, due7Count: 0,
    due30Amount: 0, due30Count: 0,
    noDueDateAmount: 0, noDueDateCount: 0,
    bucket0_30Amount: 0, bucket0_30Count: 0,
    bucket31_60Amount: 0, bucket31_60Count: 0,
    bucket61_90Amount: 0, bucket61_90Count: 0,
    bucket90plusAmount: 0, bucket90plusCount: 0,
  }

  const allRows: Row[] = data?.invoices || []

  const rows = allRows.filter(r => {
    switch (bucket) {
      case 'all':       return true
      case 'overdue':   return r.daysOverdue != null && r.daysOverdue > 0
      case 'due7':      return r.daysOverdue != null && r.daysOverdue < 0 && r.daysOverdue >= -7
      case '0_30':      return r.bucket === '0_30'
      case '31_60':     return r.bucket === '31_60'
      case '61_90':     return r.bucket === '61_90'
      case '90plus':    return r.bucket === '90plus'
      case 'noDueDate': return r.bucket === 'noDueDate'
    }
  })

  const bucketCount = (k: BucketKey): number => {
    switch (k) {
      case 'all':       return kpis.totalCount
      case 'overdue':   return kpis.overdueCount
      case 'due7':      return kpis.due7Count
      case '0_30':      return kpis.bucket0_30Count
      case '31_60':     return kpis.bucket31_60Count
      case '61_90':     return kpis.bucket61_90Count
      case '90plus':    return kpis.bucket90plusCount
      case 'noDueDate': return kpis.noDueDateCount
    }
  }

  const bucketAmount = (k: BucketKey): number => {
    switch (k) {
      case 'all':       return kpis.totalOutstanding
      case 'overdue':   return kpis.overdueAmount
      case 'due7':      return kpis.due7Amount
      case '0_30':      return kpis.bucket0_30Amount
      case '31_60':     return kpis.bucket31_60Amount
      case '61_90':     return kpis.bucket61_90Amount
      case '90plus':    return kpis.bucket90plusAmount
      case 'noDueDate': return kpis.noDueDateAmount
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
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
            <span className="font-bold">Aging Report</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/wavecore/procurement/aging/export"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
            <button
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">

        <div className="rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-orange-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Calendar className="w-8 h-8" /> Invoice Aging
              </h1>
              <p className="text-white/80 text-sm">
                What is outstanding, what is overdue, what to pay next. Updated {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString('en-GB') : 'just now'}.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiTile
            icon={DollarSign} label="Total outstanding" color="text-emerald-500"
            value={shortMoney(kpis.totalOutstanding)} sub={kpis.totalCount + ' invoices'}
            active={bucket === 'all'} onClick={() => setBucket('all')}
          />
          <KpiTile
            icon={AlertCircle} label="Overdue" color="text-red-500"
            value={shortMoney(kpis.overdueAmount)} sub={kpis.overdueCount + ' overdue'}
            active={bucket === 'overdue'} onClick={() => setBucket('overdue')}
          />
          <KpiTile
            icon={Clock} label="Due ≤7 days" color="text-cyan-500"
            value={shortMoney(kpis.due7Amount)} sub={kpis.due7Count + ' coming up'}
            active={bucket === 'due7'} onClick={() => setBucket('due7')}
          />
          <KpiTile
            icon={AlertTriangle} label="90+ days" color="text-orange-500"
            value={shortMoney(kpis.bucket90plusAmount)} sub={kpis.bucket90plusCount + ' critical'}
            active={bucket === '90plus'} onClick={() => setBucket('90plus')}
          />
        </div>

        {/* Bucket pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {BUCKETS.map(b => {
            const count = bucketCount(b.key)
            const amount = bucketAmount(b.key)
            const isActive = bucket === b.key
            return (
              <button
                key={b.key}
                onClick={() => setBucket(b.key)}
                className={
                  'flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition min-w-[140px] ' +
                  (isActive
                    ? 'bg-white dark:bg-neutral-900 border-2 border-rose-500'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400')
                }
              >
                <span className="flex items-center gap-2">
                  <Layers className={'w-3.5 h-3.5 ' + (isActive ? 'text-rose-500' : 'text-neutral-400')} />
                  <span className={isActive ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500'}>{b.label}</span>
                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (isActive ? 'bg-rose-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800')}>
                    {count}
                  </span>
                </span>
                <span className="text-xs text-neutral-500 font-normal">{shortMoney(amount)}</span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-neutral-500 mb-3 px-1">
          {BUCKETS.find(b => b.key === bucket)?.hint}
        </p>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-500">Nothing here — all clear</p>
              <p className="text-xs text-neutral-400 mt-1">No invoices fall in this bucket.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3">Invoice#</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">PO</th>
                    <th className="px-4 py-3">Invoice date</th>
                    <th className="px-4 py-3">Due date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Age</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const href = '/wavecore-erp/procurement/supplier-invoices/' + r.id
                    return (
                      <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                        <td className="px-4 py-3 align-top">
                          <Link href={href} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {r.invoiceNumber || '(no number)'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-top text-xs max-w-[220px] truncate">{r.supplierName || '—'}</td>
                        <td className="px-4 py-3 align-top text-xs text-neutral-500">
                          {r.poNumber ? 'PO ' + r.poNumber : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-neutral-500">{fmtDate(r.invoiceDate)}</td>
                        <td className="px-4 py-3 align-top text-xs text-neutral-500">{fmtDate(r.dueDate)}</td>
                        <td className="px-4 py-3 align-top">
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusPill(r.status)}>
                            {r.status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-right font-bold">
                          {money(r.total, r.currency)}
                        </td>
                        <td className={'px-4 py-3 align-top text-right text-xs ' + ageClass(r.daysOverdue)}>
                          {ageLabel(r.daysOverdue)}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-900/20 text-xs font-bold"
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
// KPI tile — clickable, sets active bucket
// ============================================================
function KpiTile({ icon: Icon, label, value, sub, color, active, onClick }: any) {
  const cls = 'text-left w-full bg-white dark:bg-neutral-900 rounded-2xl border p-4 transition cursor-pointer ' +
    (active ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400')
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Icon className={'w-4 h-4 mb-2 ' + color} />
      <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>}
    </button>
  )
}

function statusPill(s?: string): string {
  switch (s) {
    case 'DRAFT':         return 'bg-neutral-800 text-neutral-300'
    case 'SUBMITTED':     return 'bg-amber-900/50 text-amber-300'
    case 'MATCHED':       return 'bg-green-900/50 text-green-300'
    case 'PARTIAL_MATCH': return 'bg-orange-900/50 text-orange-300'
    case 'MISMATCH':      return 'bg-red-900/50 text-red-300'
    case 'APPROVED':      return 'bg-emerald-900/50 text-emerald-300'
    case 'REJECTED':      return 'bg-red-900/50 text-red-300'
    case 'PAID':          return 'bg-purple-900/50 text-purple-300'
    case 'CANCELLED':     return 'bg-neutral-800 text-neutral-500'
    default:              return 'bg-neutral-800 text-neutral-400'
  }
}