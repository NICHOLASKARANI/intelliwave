'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, RefreshCw, Trophy, TrendingUp, Users, Target,
  DollarSign, Award, AlertTriangle,
} from 'lucide-react'

interface Row {
  userId: string | null
  name: string
  email: string | null
  role: string | null
  openCount: number
  openValue: number
  wonCount: number
  wonValue: number
  lostCount: number
  lostValue: number
  winRate: number | null
  avgDealSize: number | null
  activityCount: number
}

interface Totals {
  members: number
  unassignedDeals: number
  openValue: number
  wonValue: number
  wonCount: number
  lostCount: number
  customersCreated: number
  activities: number
  winRate: number | null
}

export default function CrmReportsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    setError('')
    try {
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const res = await fetch('/api/wavecore/crm/reports/leaderboard?' + qs.toString(), { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setRows(data.rows || [])
      setTotals(data.totals || null)
    } catch { setError('Network error') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [from, to])
  useEffect(() => {
    const t = setInterval(() => load({ silent: true }), 30_000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [from, to])

  const rankBadge = (i: number) => {
    if (i === 0) return 'bg-amber-500 text-white'
    if (i === 1) return 'bg-neutral-400 text-white'
    if (i === 2) return 'bg-orange-700 text-white'
    return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">CRM</p>
              <p className="font-bold">Sales Leaderboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs" />
            </div>
            <button onClick={() => load({ silent: true })} disabled={refreshing} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Sales Leaderboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Won value and open pipeline per rep. Win rate counts only closed deals (won / won+lost).
          </p>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}

        {/* KPI tiles */}
        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <DollarSign className="w-5 h-5 mb-2 text-emerald-500" />
              <p className="text-lg font-bold">{fmt(totals.wonValue)}</p>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Won value ({totals.wonCount})</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <TrendingUp className="w-5 h-5 mb-2 text-indigo-500" />
              <p className="text-lg font-bold">{fmt(totals.openValue)}</p>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Open pipeline</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Award className="w-5 h-5 mb-2 text-amber-500" />
              <p className="text-lg font-bold">{totals.winRate != null ? totals.winRate + '%' : '—'}</p>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Team win rate</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Users className="w-5 h-5 mb-2 text-blue-500" />
              <p className="text-lg font-bold">{totals.members}</p>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Reps · {totals.customersCreated} new customers</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No members or opportunities yet</p>
            <p className="text-sm text-neutral-500 mt-1">Add team members and assign opportunities to see the leaderboard.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3 w-12">#</th>
                    <th className="px-4 py-3">Rep</th>
                    <th className="px-4 py-3 text-right">Open</th>
                    <th className="px-4 py-3 text-right">Open value</th>
                    <th className="px-4 py-3 text-right">Won</th>
                    <th className="px-4 py-3 text-right">Won value</th>
                    <th className="px-4 py-3 text-right">Win %</th>
                    <th className="px-4 py-3 text-right">Avg deal</th>
                    <th className="px-4 py-3 text-right">Activities</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.userId || 'unassigned'} className={'border-b border-neutral-100 dark:border-neutral-800 last:border-0 ' + (r.userId ? '' : 'opacity-70')}>
                      <td className="px-4 py-2">
                        <span className={'inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold ' + rankBadge(i)}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <p className="font-bold">{r.name}</p>
                        {r.email && <p className="text-[10px] text-neutral-500">{r.email}</p>}
                        {!r.userId && <p className="text-[10px] text-amber-500 italic">Not yet assigned to a member</p>}
                      </td>
                      <td className="px-4 py-2 text-right">{r.openCount}</td>
                      <td className="px-4 py-2 text-right">{fmt(r.openValue)}</td>
                      <td className="px-4 py-2 text-right text-emerald-500 font-bold">{r.wonCount}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-600">{fmt(r.wonValue)}</td>
                      <td className={'px-4 py-2 text-right ' + (r.winRate == null ? 'text-neutral-500' : r.winRate >= 50 ? 'text-emerald-500 font-bold' : 'text-red-500')}>
                        {r.winRate == null ? '—' : r.winRate + '%'}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">{r.avgDealSize == null ? '—' : fmt(r.avgDealSize)}</td>
                      <td className="px-4 py-2 text-right text-xs">{r.activityCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-6 py-3 text-[10px] text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
              Ranked by won value, then open pipeline value. Win rate excludes deals still in progress.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}