'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar, Loader2, Search, Printer, X, ArrowUpDown, CheckCircle2,
  AlertTriangle, Activity, Clock, ChevronRight, Sparkles, Gauge, Layers, TrendingUp,
} from 'lucide-react'

const STATUSES = ['ALL', 'DRAFT', 'RELEASED', 'IN_PROGRESS']

const scheduleStatusStyle = (s: string) => {
  switch (s) {
    case 'ON_TRACK': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'AT_RISK': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'DELAYED': return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'NO_WC': return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}
const priorityStyle = (p: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-900/60 text-red-200'
    case 'HIGH': return 'bg-orange-900/50 text-orange-300'
    case 'MEDIUM': return 'bg-yellow-900/40 text-yellow-300'
    case 'LOW': return 'bg-blue-900/40 text-blue-300'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function SchedulingPage() {
  const [scheduled, setScheduled] = useState<any[]>([])
  const [workCenterLoad, setWorkCenterLoad] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('order')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [detail, setDetail] = useState<any>(null)
  const [view, setView] = useState<'list' | 'gantt'>('list')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/scheduling')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); setScheduled([]) }
      else {
        setScheduled(data.scheduled || [])
        setWorkCenterLoad(data.workCenterLoad || [])
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const summary = useMemo(() => {
    const total = scheduled.length
    const onTrack = scheduled.filter(s => s.scheduleStatus === 'ON_TRACK').length
    const atRisk = scheduled.filter(s => s.scheduleStatus === 'AT_RISK').length
    const delayed = scheduled.filter(s => s.scheduleStatus === 'DELAYED').length
    const noWc = scheduled.filter(s => s.scheduleStatus === 'NO_WC').length
    const totalDuration = scheduled.reduce((s, x) => s + Number(x.estimatedDays || 0), 0)
    const avgLoad = workCenterLoad.length > 0
      ? Math.round(workCenterLoad.reduce((s, w) => s + w.utilization, 0) / workCenterLoad.length)
      : 0
    const bottleneck = workCenterLoad[0]?.name || '—'
    return { total, onTrack, atRisk, delayed, noWc, totalDuration, avgLoad, bottleneck }
  }, [scheduled, workCenterLoad])

  const filtered = useMemo(() => {
    let list = [...scheduled]
    if (activeKpi === 'ON_TRACK') list = list.filter(s => s.scheduleStatus === 'ON_TRACK')
    else if (activeKpi === 'AT_RISK') list = list.filter(s => s.scheduleStatus === 'AT_RISK')
    else if (activeKpi === 'DELAYED') list = list.filter(s => s.scheduleStatus === 'DELAYED')
    else if (activeKpi === 'NO_WC') list = list.filter(s => s.scheduleStatus === 'NO_WC')
    if (filterStatus !== 'ALL') list = list.filter(s => s.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(x =>
        (x.number || '').toLowerCase().includes(s) ||
        (x.product || '').toLowerCase().includes(s) ||
        (x.workCenterName || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      let av: any = a[sortBy] ?? ''
      let bv: any = b[sortBy] ?? ''
      if (sortBy === 'order') { av = a.order ?? 0; bv = b.order ?? 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [scheduled, activeKpi, filterStatus, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }

  // Gantt range: from earliest start to latest end
  const ganttRange = useMemo(() => {
    if (filtered.length === 0) return { min: new Date(), max: new Date(), days: 1 }
    const dates: number[] = []
    for (const s of filtered) {
      if (s.startDate) dates.push(new Date(s.startDate).getTime())
      if (s.endDate) dates.push(new Date(s.endDate).getTime())
    }
    const min = Math.min(...dates)
    const max = Math.max(...dates)
    const days = Math.max(1, Math.ceil((max - min) / (1000 * 60 * 60 * 24)))
    return { min: new Date(min), max: new Date(max), days }
  }, [filtered])

  const dayLabels = useMemo(() => {
    const labels: { date: Date; label: string }[] = []
    for (let i = 0; i <= ganttRange.days; i++) {
      const d = new Date(ganttRange.min)
      d.setDate(d.getDate() + i)
      labels.push({ date: d, label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) })
    }
    return labels
  }, [ganttRange])

  const barPosition = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime()
    const end = new Date(endStr).getTime()
    const min = ganttRange.min.getTime()
    const totalMs = ganttRange.max.getTime() - min + 86400000
    const leftPct = ((start - min) / totalMs) * 100
    const widthPct = Math.max(2, ((end - start) / totalMs) * 100)
    return { left: Math.max(0, leftPct), width: widthPct }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Scheduling</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Calendar className="w-7 h-7 text-blue-500" /> Production Scheduling
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Timeline · Load balance · Bottleneck detection</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={() => window.open('/api/wavecore/manufacturing/scheduling/pdf', '_blank')} className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40">
              <Printer className="w-5 h-5" /> Print Schedule
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-blue-300' : '')}>
            <Calendar className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Scheduled</p>
          </button>
          <button onClick={() => setActiveKpi('ON_TRACK')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'ON_TRACK' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.onTrack}</p><p className="text-xs opacity-90">On Track</p>
          </button>
          <button onClick={() => setActiveKpi('AT_RISK')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg ' + (activeKpi === 'AT_RISK' ? 'ring-4 ring-yellow-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.atRisk}</p><p className="text-xs opacity-90">At Risk</p>
          </button>
          <button onClick={() => setActiveKpi('DELAYED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg ' + (activeKpi === 'DELAYED' ? 'ring-4 ring-red-300' : '')}>
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.delayed}</p><p className="text-xs opacity-90">Delayed</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg">
            <Gauge className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.avgLoad}%</p><p className="text-xs opacity-90">Avg Load</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalDuration}d</p><p className="text-xs opacity-90">Total Days</p>
          </div>
          <button onClick={() => setActiveKpi('NO_WC')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-slate-600 to-neutral-800 text-white shadow-lg ' + (activeKpi === 'NO_WC' ? 'ring-4 ring-slate-300' : '')}>
            <Layers className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.noWc}</p><p className="text-xs opacity-90">No WC</p>
          </button>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by WO, product or work center..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
            </select>
            <div className="flex gap-1 rounded-xl bg-neutral-800 p-1">
              <button onClick={() => setView('list')} className={'px-3 py-1.5 rounded-lg text-sm font-bold ' + (view === 'list' ? 'bg-blue-600 text-white' : 'text-neutral-400')}>List</button>
              <button onClick={() => setView('gantt')} className={'px-3 py-1.5 rounded-lg text-sm font-bold ' + (view === 'gantt' ? 'bg-blue-600 text-white' : 'text-neutral-400')}>Gantt</button>
            </div>
          </div>
        </div>

        {workCenterLoad.length > 0 && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Work Center Load
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {workCenterLoad.slice(0, 6).map(w => {
                const color = w.utilization > 90 ? 'bg-red-500' : w.utilization > 70 ? 'bg-amber-500' : 'bg-green-500'
                return (
                  <div key={w.name} className="bg-neutral-800 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">{w.name}</span>
                      <span className="text-xs text-neutral-400">{w.count} WOs · {w.totalQty} units</span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div className={'h-2 rounded-full ' + color} style={{ width: Math.min(100, w.utilization) + '%' }}></div>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1">{w.utilization}% utilized</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No work orders to schedule</p>
          </div>
        ) : view === 'list' ? (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['number','Number'],['product','Product'],['workCenterName','Work Center'],['priority','Priority'],['quantity','Qty'],['remaining','Remaining'],['startDate','Start'],['endDate','End'],['estimatedDays','Days'],['scheduleStatus','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3 font-mono text-white text-xs">{s.number}</td>
                      <td className="p-3 text-neutral-200">{s.product}</td>
                      <td className="p-3 text-neutral-300">{s.workCenterName || <span className="text-neutral-500 italic">Unassigned</span>}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + priorityStyle(s.priority)}>{s.priority}</span></td>
                      <td className="p-3 text-right text-white">{s.quantity}</td>
                      <td className="p-3 text-right text-blue-300 font-bold">{s.remaining}</td>
                      <td className="p-3 text-center text-xs text-neutral-400">{s.startDate ? new Date(s.startDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-center text-xs text-neutral-400">{s.endDate ? new Date(s.endDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3 text-center text-white font-bold">{s.estimatedDays}d</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + scheduleStatusStyle(s.scheduleStatus)}>{s.scheduleStatus.replace('_', ' ')}</span></td>
                      <td className="p-3 text-center">
                        <button onClick={() => setDetail(s)} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="Details">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <div style={{ minWidth: '800px' }}>
                <div className="flex border-b border-neutral-800 bg-neutral-800 sticky top-0">
                  <div className="w-48 shrink-0 p-3 text-xs uppercase tracking-wide text-neutral-400 font-bold border-r border-neutral-700">Work Order</div>
                  <div className="flex-1 relative flex">
                    {dayLabels.map((d, i) => (
                      <div key={i} className="flex-1 text-center text-[10px] text-neutral-500 py-2 border-r border-neutral-700">{d.label}</div>
                    ))}
                  </div>
                </div>
                {filtered.map(s => {
                  const pos = barPosition(s.startDate, s.endDate)
                  const color = s.scheduleStatus === 'ON_TRACK' ? 'from-green-600 to-emerald-500'
                    : s.scheduleStatus === 'AT_RISK' ? 'from-yellow-600 to-amber-500'
                    : s.scheduleStatus === 'DELAYED' ? 'from-red-600 to-rose-500'
                    : 'from-neutral-700 to-neutral-600'
                  return (
                    <div key={s.id} className="flex border-b border-neutral-800 hover:bg-neutral-800/50">
                      <div className="w-48 shrink-0 p-3 border-r border-neutral-800">
                        <div className="text-xs font-mono text-white truncate">{s.number}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{s.product}</div>
                      </div>
                      <div className="flex-1 relative h-12">
                        <div
                          className={'absolute top-2 h-8 rounded-md bg-gradient-to-r ' + color + ' shadow-lg cursor-pointer hover:scale-105 transition-transform'}
                          style={{ left: pos.left + '%', width: pos.width + '%' }}
                          onClick={() => setDetail(s)}
                        >
                          <div className="px-2 py-1 text-[10px] font-bold text-white truncate">{s.workCenterName || 'Unassigned'}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Schedule Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <span className={'inline-block px-5 py-2 rounded-2xl text-base font-bold ' + scheduleStatusStyle(detail.scheduleStatus)}>{detail.scheduleStatus.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Number', detail.number],
                  ['Product', detail.product],
                  ['Work Center', detail.workCenterName],
                  ['Priority', detail.priority],
                  ['Status', detail.status],
                  ['Quantity', detail.quantity],
                  ['Completed', detail.completedQty],
                  ['Remaining', detail.remaining],
                  ['Capacity/day', detail.capacity],
                  ['Efficiency', Math.round(Number(detail.efficiency || 0) * 100) + '%'],
                  ['Estimated Days', detail.estimatedDays + 'd'],
                  ['Load', detail.loadPct + '%'],
                  ['Start', detail.startDate ? new Date(detail.startDate).toLocaleDateString('en-GB') : '—'],
                  ['End', detail.endDate ? new Date(detail.endDate).toLocaleDateString('en-GB') : '—'],
                  ['Due Date', detail.dueDate ? new Date(detail.dueDate).toLocaleDateString('en-GB') : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.scheduleStatus === 'DELAYED' && (
                <div className="p-4 rounded-xl bg-red-900/30 border border-red-800">
                  <div className="text-xs uppercase tracking-wide text-red-300 font-bold mb-1">⚠ Delayed</div>
                  <div className="text-sm text-white">This work order is past its due date. Consider reassigning to a faster work center or prioritizing it.</div>
                </div>
              )}
              {detail.scheduleStatus === 'AT_RISK' && (
                <div className="p-4 rounded-xl bg-yellow-900/30 border border-yellow-800">
                  <div className="text-xs uppercase tracking-wide text-yellow-300 font-bold mb-1">⚠ At Risk</div>
                  <div className="text-sm text-white">Calculated completion ({new Date(detail.endDate).toLocaleDateString('en-GB')}) is later than due date ({detail.dueDate ? new Date(detail.dueDate).toLocaleDateString('en-GB') : '—'}).</div>
                </div>
              )}
              {detail.scheduleStatus === 'NO_WC' && (
                <div className="p-4 rounded-xl bg-neutral-800 border border-neutral-700">
                  <div className="text-xs uppercase tracking-wide text-neutral-400 font-bold mb-1">No Work Center</div>
                  <div className="text-sm text-white">Assign a work center to this work order for accurate scheduling.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}