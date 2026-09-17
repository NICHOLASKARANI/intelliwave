'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Monitor, Loader2, Printer, X, CheckCircle2, AlertTriangle, Activity,
  Clock, PlayCircle, PauseCircle, ChevronRight, Gauge, Layers,
  TrendingUp, Cog, Search,
} from 'lucide-react'

const priorityStyle = (p: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-900/60 text-red-200 border border-red-700'
    case 'HIGH': return 'bg-orange-900/50 text-orange-300 border border-orange-700'
    case 'MEDIUM': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'LOW': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

const kpiActiveRing: Record<string, string> = {
  ALL: 'ring-4 ring-emerald-300',
  RUNNING: 'ring-4 ring-yellow-300',
  QUEUED: 'ring-4 ring-blue-300',
  TODAY: 'ring-4 ring-green-300',
  OVERDUE: 'ring-4 ring-red-300',
  OUTPUT: 'ring-4 ring-purple-300',
  ONTIME: 'ring-4 ring-teal-300',
}

export default function ShopFloorPage() {
  const [running, setRunning] = useState<any[]>([])
  const [queued, setQueued] = useState<any[]>([])
  const [completed, setCompleted] = useState<any[]>([])
  const [workCenters, setWorkCenters] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [busy, setBusy] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [wcFilter, setWcFilter] = useState('ALL')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/shop-floor')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load') }
      else {
        setRunning(data.running || [])
        setQueued(data.queued || [])
        setCompleted(data.completedToday || [])
        setWorkCenters(data.workCenters || [])
        setActivity(data.recentActivity || [])
        setSummary(data.summary || {})
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 15000)
    return () => clearInterval(t)
  }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const act = async (id: string, action: string, label: string) => {
    setBusy(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/shop-floor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (res.ok) { flash(label); fetchAll() }
    } finally { setBusy('') }
  }

  const pdf = () => window.open('/api/wavecore/manufacturing/shop-floor/pdf', '_blank')

  // ============ FILTERING LOGIC ============
  const matchesSearch = (w: any) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (w.number || '').toLowerCase().includes(s)
      || (w.product || '').toLowerCase().includes(s)
      || (w.workCenterName || '').toLowerCase().includes(s)
  }
  const matchesWC = (w: any) => wcFilter === 'ALL' || w.workCenterName === wcFilter

  const filteredRunning = useMemo(() => {
    let list = running.filter(w => matchesSearch(w) && matchesWC(w))
    if (activeKpi === 'QUEUED' || activeKpi === 'TODAY') return []
    if (activeKpi === 'OVERDUE') list = list.filter(w => w.overdue || (w.dueDate && new Date(w.dueDate) < new Date()))
    return list
  }, [running, search, wcFilter, activeKpi])

  const filteredQueued = useMemo(() => {
    let list = queued.filter(w => matchesSearch(w) && matchesWC(w))
    if (activeKpi === 'RUNNING' || activeKpi === 'TODAY') return []
    if (activeKpi === 'OVERDUE') list = list.filter(w => w.overdue || (w.dueDate && new Date(w.dueDate) < new Date()))
    return list
  }, [queued, search, wcFilter, activeKpi])

  const filteredCompleted = useMemo(() => {
    let list = completed.filter(w => matchesSearch(w) && matchesWC(w))
    if (activeKpi === 'RUNNING' || activeKpi === 'QUEUED' || activeKpi === 'OVERDUE') return []
    return list
  }, [completed, search, wcFilter, activeKpi])

  const filteredActivity = useMemo(() => {
    let list = activity
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(a => (a.number || '').toLowerCase().includes(s) || (a.product || '').toLowerCase().includes(s))
    }
    return list
  }, [activity, search])

  // Unique work centers for dropdown
  const wcOptions = useMemo(() => {
    const set = new Set<string>()
    for (const w of [...running, ...queued, ...completed]) {
      if (w.workCenterName) set.add(w.workCenterName)
    }
    return Array.from(set).sort()
  }, [running, queued, completed])

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Shop Floor</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Monitor className="w-7 h-7 text-emerald-500" /> Shop Floor
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Live production · Auto-refresh every 15s
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40">
              <Printer className="w-5 h-5" /> Print Snapshot
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* ============ CLICKABLE KPI CARDS ============ */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? kpiActiveRing.ALL : '')}>
            <Layers className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.total || 0}</p>
            <p className="text-xs opacity-90">Total WOs</p>
          </button>

          <button onClick={() => setActiveKpi('RUNNING')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'RUNNING' ? kpiActiveRing.RUNNING : '')}>
            <Activity className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.running || 0}</p>
            <p className="text-xs opacity-90">Running</p>
          </button>

          <button onClick={() => setActiveKpi('QUEUED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'QUEUED' ? kpiActiveRing.QUEUED : '')}>
            <Clock className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.queued || 0}</p>
            <p className="text-xs opacity-90">Queued</p>
          </button>

          <button onClick={() => setActiveKpi('TODAY')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'TODAY' ? kpiActiveRing.TODAY : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.completedToday || 0}</p>
            <p className="text-xs opacity-90">Today</p>
          </button>

          <button onClick={() => setActiveKpi('OVERDUE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OVERDUE' ? kpiActiveRing.OVERDUE : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.overdue || 0}</p>
            <p className="text-xs opacity-90">Overdue</p>
          </button>

          <button onClick={() => setActiveKpi('OUTPUT')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OUTPUT' ? kpiActiveRing.OUTPUT : '')}>
            <TrendingUp className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.throughput || 0}</p>
            <p className="text-xs opacity-90">Units Output</p>
          </button>

          <button onClick={() => setActiveKpi('ONTIME')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ONTIME' ? kpiActiveRing.ONTIME : '')}>
            <Gauge className="w-5 h-5 mb-2" />
            <p className="text-2xl font-bold">{summary.onTimePct || 100}%</p>
            <p className="text-xs opacity-90">On-Time</p>
          </button>
        </div>

        {/* ============ FILTER BAR ============ */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search WO #, product or work center..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full"
            />
          </div>
          <select value={wcFilter} onChange={e => setWcFilter(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Work Centers</option>
            {wcOptions.map(wc => <option key={wc} value={wc}>{wc}</option>)}
          </select>
          {(activeKpi !== 'ALL' || search || wcFilter !== 'ALL') && (
            <button onClick={() => { setActiveKpi('ALL'); setSearch(''); setWcFilter('ALL') }} className="px-3 py-2.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold">
              Clear Filters
            </button>
          )}
          <span className="text-sm text-neutral-400 ml-auto">
            Showing: <b className="text-white">{filteredRunning.length + filteredQueued.length + filteredCompleted.length}</b>
            {' / '}
            <b className="text-white">{running.length + queued.length + completed.length}</b>
          </span>
        </div>

        {/* ============ WORK CENTER FLOOR MAP ============ */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-6">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Cog className="w-4 h-4" /> Work Center Floor Map
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workCenters.length === 0 ? (
              <div className="col-span-3 text-center py-4 text-neutral-500">No work centers configured</div>
            ) : workCenters.map(wc => {
              const color = wc.status === 'RUNNING' ? 'border-yellow-500/50 bg-yellow-900/20'
                : wc.status === 'QUEUED' ? 'border-blue-500/50 bg-blue-900/20'
                : 'border-neutral-800 bg-neutral-800/50'
              return (
                <div key={wc.id} className={'rounded-xl p-3 border-2 ' + color}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">{wc.name}</div>
                      {wc.code && <div className="text-xs text-neutral-500">{wc.code}</div>}
                    </div>
                    <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                      wc.status === 'RUNNING' ? 'bg-yellow-900/60 text-yellow-300'
                      : wc.status === 'QUEUED' ? 'bg-blue-900/60 text-blue-300'
                      : 'bg-neutral-800 text-neutral-400'
                    )}>{wc.status}</span>
                  </div>
                  {wc.activeWO && (
                    <div className="text-xs text-neutral-300 mb-1">
                      <span className="text-yellow-400 font-mono">{wc.activeWO.number}</span> — {wc.activeWO.product}
                    </div>
                  )}
                  <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                    <div className={'h-2 rounded-full ' + (wc.utilization > 90 ? 'bg-red-500' : wc.utilization > 70 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: Math.min(100, wc.utilization) + '%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                    <span>{wc.queuedCount} queued</span>
                    <span>{wc.utilization}% load</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* RUNNING COLUMN */}
            <div className={'bg-neutral-900 rounded-2xl border p-4 transition-all ' + ((activeKpi === 'RUNNING' || activeKpi === 'ALL') ? 'border-yellow-800' : 'border-neutral-800 opacity-50')}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-yellow-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Running ({filteredRunning.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredRunning.length === 0 ? (
                  <p className="text-center py-8 text-neutral-500 text-sm">Nothing running</p>
                ) : filteredRunning.map(w => (
                  <div key={w.id} className="p-3 rounded-xl bg-yellow-900/20 border border-yellow-800/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-mono text-xs text-yellow-400 font-bold">{w.number}</div>
                        <div className="text-sm text-white mt-0.5">{w.product}</div>
                        <div className="text-xs text-neutral-400">{w.workCenterName}</div>
                      </div>
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + priorityStyle(w.priority)}>{w.priority}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 mb-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: w.pct + '%' }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400 mb-2">
                      <span>{w.completedQty}/{w.quantity} ({w.pct}%)</span>
                      <span>{w.estimatedDays}d left</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => act(w.id, 'pause', 'Paused ' + w.number)} disabled={busy === w.id} className="flex-1 py-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800 text-xs font-bold" title="Pause">
                        {busy === w.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <PauseCircle className="w-4 h-4 mx-auto" />}
                      </button>
                      <button onClick={() => act(w.id, 'complete', 'Completed ' + w.number)} disabled={busy === w.id} className="flex-1 py-1.5 rounded-lg bg-green-900/50 text-green-300 hover:bg-green-800 text-xs font-bold" title="Complete">
                        {busy === w.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <CheckCircle2 className="w-4 h-4 mx-auto" />}
                      </button>
                      <button onClick={() => setDetail(w)} className="flex-1 py-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800 text-xs font-bold" title="Detail">
                        <ChevronRight className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUEUED COLUMN */}
            <div className={'bg-neutral-900 rounded-2xl border p-4 transition-all ' + ((activeKpi === 'QUEUED' || activeKpi === 'ALL' || activeKpi === 'OVERDUE') ? 'border-blue-800' : 'border-neutral-800 opacity-50')}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-blue-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Queued ({filteredQueued.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredQueued.length === 0 ? (
                  <p className="text-center py-8 text-neutral-500 text-sm">Nothing queued</p>
                ) : filteredQueued.map(w => (
                  <div key={w.id} className={'p-3 rounded-xl bg-blue-900/10 border ' + (w.overdue ? 'border-red-700' : 'border-blue-800/50')}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-mono text-xs text-blue-400 font-bold">{w.number}</div>
                        <div className="text-sm text-white mt-0.5">{w.product}</div>
                        <div className="text-xs text-neutral-400">{w.workCenterName}</div>
                      </div>
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + priorityStyle(w.priority)}>{w.priority}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400 mb-2">
                      <span>Remaining: {w.remaining}</span>
                      {w.overdue && <span className="text-red-400 font-bold">OVERDUE</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => act(w.id, 'start', 'Started ' + w.number)} disabled={busy === w.id} className="flex-1 py-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800 text-xs font-bold" title="Start">
                        {busy === w.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <PlayCircle className="w-4 h-4 mx-auto" />}
                      </button>
                      <button onClick={() => setDetail(w)} className="flex-1 py-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800 text-xs font-bold">
                        <ChevronRight className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COMPLETED + ACTIVITY */}
            <div className="space-y-4">
              <div className={'bg-neutral-900 rounded-2xl border p-4 transition-all ' + ((activeKpi === 'TODAY' || activeKpi === 'ALL') ? 'border-green-800' : 'border-neutral-800 opacity-50')}>
                <h3 className="font-bold text-green-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4" /> Completed Today ({filteredCompleted.length})
                </h3>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {filteredCompleted.length === 0 ? (
                    <p className="text-center py-4 text-neutral-500 text-sm">Nothing today</p>
                  ) : filteredCompleted.map(w => (
                    <div key={w.id} className="p-2 rounded-lg bg-green-900/10 border border-green-800/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-mono text-xs text-green-400">{w.number}</div>
                          <div className="text-xs text-neutral-400">{w.product}</div>
                        </div>
                        <div className="text-xs text-green-300">{w.quantity} units</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
                <h3 className="font-bold text-neutral-300 flex items-center gap-2 mb-3 text-sm">
                  <Activity className="w-4 h-4" /> Recent Activity
                </h3>
                <div className="space-y-1 max-h-[240px] overflow-y-auto">
                  {filteredActivity.length === 0 ? (
                    <p className="text-center py-4 text-neutral-500 text-xs">No recent activity</p>
                  ) : filteredActivity.map((a, i) => (
                    <div key={i} className="text-xs py-1.5 border-b border-neutral-800/50 last:border-0">
                      <div className="flex justify-between">
                        <span className="font-mono text-neutral-300">{a.number}</span>
                        <span className="text-neutral-500">{a.updatedAt ? new Date(a.updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <div className="text-neutral-500">{a.product} · <span className="text-neutral-400">{a.status}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">WO Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Number', detail.number],
                  ['Product', detail.product],
                  ['Work Center', detail.workCenterName],
                  ['Status', detail.status],
                  ['Priority', detail.priority],
                  ['Quantity', detail.quantity],
                  ['Completed', detail.completedQty],
                  ['Remaining', detail.remaining],
                  ['Estimated Days', detail.estimatedDays + 'd'],
                  ['Progress', detail.pct + '%'],
                  ['Start', detail.startDate ? new Date(detail.startDate).toLocaleDateString('en-GB') : '—'],
                  ['Due', detail.dueDate ? new Date(detail.dueDate).toLocaleDateString('en-GB') : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.notes && (
                <div className="bg-neutral-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Notes</div>
                  <div className="text-sm text-white whitespace-pre-wrap">{detail.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}