'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Loader2, TrendingUp, CheckCircle2, AlertTriangle, Printer, BarChart3,
  LayoutGrid, DollarSign, GripVertical, RefreshCw, ExternalLink,
} from 'lucide-react'

// ============================================================
// Canonical stage list — matches the API's stageMap.
// ============================================================
const STAGES: { key: string; label: string; color: string; bg: string; probability: number }[] = [
  { key: 'QUALIFICATION',  label: 'Qualification',  color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-950/30',   probability: 20 },
  { key: 'NEEDS_ANALYSIS', label: 'Needs Analysis', color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-950/30',   probability: 35 },
  { key: 'PROPOSAL',       label: 'Proposal',       color: '#0ea5e9', bg: 'bg-sky-50 dark:bg-sky-950/30',         probability: 55 },
  { key: 'NEGOTIATION',    label: 'Negotiation',    color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30',     probability: 75 },
  { key: 'CLOSED_WON',     label: 'Closed Won',     color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', probability: 100 },
  { key: 'CLOSED_LOST',    label: 'Closed Lost',    color: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/30',         probability: 0 },
]

interface Opp {
  id: string
  name: string
  amount: number
  stage: string
  probability: number
  customer_name?: string
  customerName?: string
  expectedCloseDate?: string
}

const fmtMoney = (n: any) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : ''

export default function PipelinePage() {
  const [opps, setOpps] = useState<Opp[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [hoverStage, setHoverStage] = useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/crm/opportunities', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setOpps(data.opportunities || [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  useEffect(() => {
    const t = setInterval(() => { load({ silent: true }) }, 30000)
    return () => clearInterval(t)
  }, [])

  const moveToStage = async (oppId: string, newStage: string) => {
    const opp = opps.find(o => o.id === oppId)
    if (!opp || opp.stage === newStage) return

    const stageMeta = STAGES.find(s => s.key === newStage)
    const oldStage = opp.stage
    const oldProb = opp.probability

    // Optimistic update
    setOpps(prev => prev.map(o => o.id === oppId
      ? { ...o, stage: newStage, probability: stageMeta?.probability ?? o.probability }
      : o
    ))

    try {
      const res = await fetch('/api/wavecore/crm/opportunities/' + oppId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          stage: newStage,
          probability: stageMeta?.probability ?? opp.probability,
        }),
      })
      if (!res.ok) {
        // Revert
        setOpps(prev => prev.map(o => o.id === oppId
          ? { ...o, stage: oldStage, probability: oldProb }
          : o
        ))
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to move deal')
        return
      }
      flash('"' + opp.name + '" moved to ' + (stageMeta?.label || newStage))
    } catch (e) {
      setOpps(prev => prev.map(o => o.id === oppId
        ? { ...o, stage: oldStage, probability: oldProb }
        : o
      ))
      setError('Network error: ' + (e as Error).message)
    }
  }

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const onDragEnd = () => {
    setDragId(null)
    setHoverStage(null)
  }

  const onDragOver = (stageKey: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (hoverStage !== stageKey) setHoverStage(stageKey)
  }

  const onDragLeave = (stageKey: string) => (e: React.DragEvent) => {
    if (hoverStage === stageKey) setHoverStage(null)
  }

  const onDrop = (stageKey: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    setHoverStage(null)
    setDragId(null)
    if (id) moveToStage(id, stageKey)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  // Compute per-stage stats
  const grouped = STAGES.map(s => {
    const items = opps.filter(o => o.stage === s.key)
    const value = items.reduce((sum, o) => sum + Number(o.amount || 0), 0)
    return { ...s, items, value }
  })

  const totalValue = opps.reduce((sum, o) => sum + Number(o.amount || 0), 0)
  const wonOpps = opps.filter(o => o.stage === 'CLOSED_WON')
  const lostOpps = opps.filter(o => o.stage === 'CLOSED_LOST')
  const openOpps = opps.filter(o => !['CLOSED_WON','CLOSED_LOST'].includes(o.stage))
  const winRate = opps.length > 0 ? Math.round((wonOpps.length / (wonOpps.length + lostOpps.length || 1)) * 100) : 0
  const weighted = openOpps.reduce((sum, o) => sum + (Number(o.amount || 0) * Number(o.probability || 0) / 100), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
              <span className="font-bold">Pipeline Board</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" /> {showAnalytics ? 'Hide' : 'Show'} analytics
            </button>
            <button
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6">

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiTile label="Total pipeline" value={fmtMoney(totalValue)} sub={opps.length + ' deals'} color="text-blue-500" />
          <KpiTile label="Open deals" value={String(openOpps.length)} sub={fmtMoney(openOpps.reduce((s,o)=>s+Number(o.amount||0),0))} color="text-amber-500" />
          <KpiTile label="Weighted forecast" value={fmtMoney(weighted)} sub="amount × probability" color="text-purple-500" />
          <KpiTile label="Won" value={String(wonOpps.length)} sub={fmtMoney(wonOpps.reduce((s,o)=>s+Number(o.amount||0),0))} color="text-emerald-500" />
          <KpiTile label="Win rate" value={winRate + '%'} sub={lostOpps.length + ' lost'} color="text-rose-500" />
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-900/30 text-emerald-300 border border-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> {success}
          </div>
        )}

        <p className="text-xs text-neutral-500 mb-3">
          <GripVertical className="w-3 h-3 inline" /> Drag a card between columns to update the stage and probability.
        </p>

        {/* Kanban board */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {grouped.map(stage => {
            const isHover = hoverStage === stage.key
            return (
              <div
                key={stage.key}
                onDragOver={onDragOver(stage.key)}
                onDragLeave={onDragLeave(stage.key)}
                onDrop={onDrop(stage.key)}
                className={
                  'rounded-2xl border-2 transition p-3 min-h-[300px] ' +
                  (isHover
                    ? 'border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900')
                }
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300 truncate">
                      {stage.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex-shrink-0">
                    {stage.items.length}
                  </span>
                </div>

                {/* Column value */}
                <p className="text-[11px] font-bold text-neutral-500 mb-3">
                  {fmtMoney(stage.value)}
                </p>

                {/* Cards */}
                <div className="space-y-2">
                  {stage.items.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-neutral-400">
                      {isHover ? 'Drop here' : 'Empty'}
                    </div>
                  ) : (
                    stage.items.map(o => (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={onDragStart(o.id)}
                        onDragEnd={onDragEnd}
                        className={
                          'group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 p-2.5 cursor-grab active:cursor-grabbing transition ' +
                          (dragId === o.id ? 'opacity-40' : 'hover:border-blue-400 hover:shadow-sm')
                        }
                        title={'Drag to change stage'}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <Link
                            href={'/wavecore-erp/crm/opportunities/' + o.id}
                            className="text-xs font-bold text-neutral-900 dark:text-white hover:text-blue-600 truncate flex-1"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {o.name}
                          </Link>
                          <GripVertical className="w-3 h-3 text-neutral-300 group-hover:text-neutral-500 flex-shrink-0" />
                        </div>
                        {o.customer_name && (
                          <p className="text-[10px] text-neutral-500 truncate">{o.customer_name}</p>
                        )}
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          {fmtMoney(o.amount)}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-neutral-400">
                          <span>{o.probability || 0}%</span>
                          {o.expectedCloseDate && <span>{fmtDate(o.expectedCloseDate)}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legacy analytics (collapsible) */}
        {showAnalytics && (
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Stage breakdown
              </h2>
              <div className="space-y-3">
                {grouped.map(stage => {
                  const maxCount = Math.max(...grouped.map(s => s.items.length), 1)
                  const pct = (stage.items.length / maxCount) * 100
                  return (
                    <div key={stage.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{stage.label}</span>
                        <span className="font-bold">{stage.items.length} · {fmtMoney(stage.value)}</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3">
                        <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: stage.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-purple-500" /> Value distribution
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Won',       value: wonOpps.reduce((s,o)=>s+Number(o.amount||0),0), color: '#10b981' },
                  { label: 'Open',      value: openOpps.reduce((s,o)=>s+Number(o.amount||0),0), color: '#f59e0b' },
                  { label: 'Lost',      value: lostOpps.reduce((s,o)=>s+Number(o.amount||0),0), color: '#ef4444' },
                ].map(row => {
                  const pct = totalValue > 0 ? (row.value / totalValue) * 100 : 0
                  return (
                    <div key={row.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{row.label}</span>
                        <span className="font-bold">{fmtMoney(row.value)} · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3">
                        <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

function KpiTile({ label, value, sub, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
      <p className={'text-lg font-bold ' + color}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mt-1">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  )
}