'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, AlertTriangle, TrendingUp, RefreshCw,
  BarChart3, DollarSign, Calendar, Layers, Printer,
} from 'lucide-react'

interface Bucket {
  month: string
  label: string
  gross: number
  weighted: number
  count: number
  deals: { id: string; name: string; amount: number; probability: number; stage: string }[]
}

interface StageRow {
  stage: string
  gross: number
  weighted: number
  count: number
}

interface Data {
  months: number
  buckets: Bucket[]
  noCloseDate: { gross: number; weighted: number; count: number }
  pastDue: { gross: number; weighted: number; count: number }
  stageRollup: StageRow[]
  totals: { gross: number; weighted: number; count: number }
  generatedAt: string
}

const fmtMoney = (n: any) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtShort = (n: number) => {
  const x = Number(n || 0)
  if (x >= 1e9) return (x / 1e9).toFixed(2) + 'B'
  if (x >= 1e6) return (x / 1e6).toFixed(2) + 'M'
  if (x >= 1e3) return (x / 1e3).toFixed(1) + 'K'
  return String(Math.round(x))
}

const STAGE_COLORS: Record<string, string> = {
  PROSPECTING:    '#0ea5e9',
  QUALIFICATION:  '#6366f1',
  NEEDS_ANALYSIS: '#8b5cf6',
  PROPOSAL:       '#a855f7',
  NEGOTIATION:    '#f59e0b',
  CLOSED_WON:     '#10b981',
  CLOSED_LOST:    '#ef4444',
}

export default function ForecastPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Data | null>(null)
  const [months, setMonths] = useState(6)

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/crm/forecast?months=' + months, { cache: 'no-store' })
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

  useEffect(() => { load() /* eslint-disable-next-line */ }, [months])

  useEffect(() => {
    const t = setInterval(() => { load({ silent: true }) }, 60000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [months])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  const buckets = data?.buckets || []
  const stageRollup = data?.stageRollup || []
  const totals = data?.totals || { gross: 0, weighted: 0, count: 0 }
  const noCloseDate = data?.noCloseDate || { gross: 0, weighted: 0, count: 0 }
  const pastDue = data?.pastDue || { gross: 0, weighted: 0, count: 0 }

  const maxWeighted = Math.max(...buckets.map(b => b.weighted), 1)

  // Best case = sum of all weighted; Commit = deals in Proposal+Negotiation weighted
  const commitWeighted = stageRollup
    .filter(s => ['PROPOSAL','NEGOTIATION'].includes(s.stage))
    .reduce((sum, s) => sum + s.weighted, 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold">Revenue Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold"
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
            <button
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">

        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
                <TrendingUp className="w-8 h-8" /> Revenue Forecast
              </h1>
              <p className="text-white/80 text-sm">
                Weighted pipeline across the next {months} months. Updated {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString('en-GB') : 'just now'}.
              </p>
            </div>
            <div className="text-right text-sm">
              <p>Open deals: <strong>{totals.count}</strong></p>
              <p>Gross pipeline: {fmtMoney(totals.gross)}</p>
              <p>Weighted: <strong>{fmtMoney(totals.weighted)}</strong></p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Tile label="Best case" value={fmtMoney(totals.weighted)} sub="all open, weighted" color="text-emerald-500" />
          <Tile label="Commit" value={fmtMoney(commitWeighted)} sub="Proposal + Negotiation" color="text-blue-500" />
          <Tile label="Gross pipeline" value={fmtMoney(totals.gross)} sub={totals.count + ' open deals'} color="text-amber-500" />
          <Tile label="Past due close" value={fmtMoney(pastDue.weighted)} sub={pastDue.count + ' deals overdue'} color="text-red-500" />
        </div>

        {/* Monthly bars */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Weighted forecast by month
          </h2>
          {buckets.every(b => b.weighted === 0) ? (
            <p className="text-sm text-neutral-500 text-center py-8">No forecastable deals in this window</p>
          ) : (
            <div className="space-y-3">
              {buckets.map(b => (
                <div key={b.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{b.label}</span>
                    <span className="font-bold">
                      {fmtMoney(b.weighted)}
                      <span className="text-xs font-normal text-neutral-500 ml-2">
                        ({b.count} deal{b.count === 1 ? '' : 's'} · gross {fmtShort(b.gross)})
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: Math.max(2, (b.weighted / maxWeighted) * 100) + '%' }}
                    />
                  </div>
                  {b.deals.length > 0 && (
                    <details className="mt-1">
                      <summary className="text-[11px] text-neutral-500 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
                        {b.deals.length} deal{b.deals.length === 1 ? '' : 's'}
                      </summary>
                      <div className="mt-2 space-y-1 pl-3 border-l-2 border-neutral-200 dark:border-neutral-800">
                        {b.deals.map(d => (
                          <Link
                            key={d.id}
                            href={'/wavecore-erp/crm/opportunities/' + d.id}
                            className="block text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-emerald-600"
                          >
                            · {d.name} — {fmtShort(d.amount)} @ {d.probability}%
                          </Link>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stage rollup */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Stage breakdown
          </h2>
          {stageRollup.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">No open deals</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 dark:border-neutral-800">
                <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                  <th className="px-2 py-2">Stage</th>
                  <th className="px-2 py-2 text-right">Deals</th>
                  <th className="px-2 py-2 text-right">Gross</th>
                  <th className="px-2 py-2 text-right">Weighted</th>
                </tr>
              </thead>
              <tbody>
                {stageRollup.map(s => (
                  <tr key={s.stage} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <td className="px-2 py-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[s.stage] || '#6b7280' }} />
                      <span className="font-medium">{s.stage}</span>
                    </td>
                    <td className="px-2 py-2 text-right text-xs">{s.count}</td>
                    <td className="px-2 py-2 text-right text-xs">{fmtMoney(s.gross)}</td>
                    <td className="px-2 py-2 text-right font-bold text-xs">{fmtMoney(s.weighted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* No close date + past due summary */}
        {(noCloseDate.count > 0 || pastDue.count > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {noCloseDate.count > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> No close date
                </h3>
                <p className="text-lg font-bold">{fmtMoney(noCloseDate.weighted)}</p>
                <p className="text-xs text-neutral-500 mt-1">{noCloseDate.count} deal{noCloseDate.count === 1 ? '' : 's'} without an expected close date</p>
              </div>
            )}
            {pastDue.count > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-amber-300 dark:border-amber-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Past expected close
                </h3>
                <p className="text-lg font-bold">{fmtMoney(pastDue.weighted)}</p>
                <p className="text-xs text-neutral-500 mt-1">{pastDue.count} deal{pastDue.count === 1 ? '' : 's'} past their expected close date — review or update</p>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-neutral-500 text-center mt-8">
          Read-only view. Weighted = amount × probability. Nothing on this page writes to your data.
        </p>
      </main>
    </div>
  )
}

function Tile({ label, value, sub, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
      <p className={'text-xl font-bold ' + color}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mt-1">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  )
}