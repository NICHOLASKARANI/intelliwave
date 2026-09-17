'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Gauge, Loader2, Printer, X, ArrowUpDown, AlertTriangle, Activity,
  CheckCircle2, Clock, ChevronRight, Search, Layers, TrendingUp, Cog,
} from 'lucide-react'

const HORIZONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
]

const statusStyle = (s: string) => {
  switch (s) {
    case 'OVERLOADED': return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'HIGH': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'UNDERUTILIZED': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
    case 'IDLE': return 'bg-neutral-800 text-neutral-400 border border-neutral-700'
    case 'NO_CAPACITY': return 'bg-purple-900/40 text-purple-300 border border-purple-700'
    case 'OK': return 'bg-green-900/40 text-green-300 border border-green-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

const heatColor = (pct: number) => {
  if (pct === 0) return 'bg-neutral-800 text-neutral-600'
  if (pct > 100) return 'bg-red-500 text-white'
  if (pct >= 70) return 'bg-amber-500 text-white'
  if (pct >= 30) return 'bg-emerald-500 text-white'
  return 'bg-emerald-900 text-emerald-200'
}

export default function CapacityPage() {
  const [workCenters, setWorkCenters] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [dates, setDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [horizon, setHorizon] = useState(14)
  const [sortBy, setSortBy] = useState('utilization')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [detail, setDetail] = useState<any>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/capacity?horizon=' + horizon)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setWorkCenters([]) }
      else {
        setWorkCenters(data.workCenters || [])
        setSummary(data.summary || {})
        setDates(data.dates || [])
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [horizon])

  const pdf = () => window.open('/api/wavecore/manufacturing/capacity/pdf', '_blank')

  const filtered = useMemo(() => {
    let list = [...workCenters]
    if (activeKpi === 'OVERLOADED') list = list.filter(w => w.status === 'OVERLOADED')
    else if (activeKpi === 'HIGH') list = list.filter(w => w.status === 'HIGH')
    else if (activeKpi === 'UNDER') list = list.filter(w => w.status === 'UNDERUTILIZED' || w.status === 'IDLE')
    else if (activeKpi === 'OK') list = list.filter(w => w.status === 'OK')
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(w => (w.name || '').toLowerCase().includes(s) || (w.code || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? 0; const bv = b[sortBy] ?? 0
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [workCenters, activeKpi, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Capacity</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Gauge className="w-7 h-7 text-purple-500" /> Capacity Planning
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              {summary.dateRange ? summary.dateRange.start + ' → ' + summary.dateRange.end : 'Loading...'} · Heatmap analysis
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={pdf} className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40">
              <Printer className="w-5 h-5" /> Print Report
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-purple-300' : '')}>
            <Layers className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalWorkCenters || 0}</p><p className="text-xs opacity-90">Work Centers</p>
          </button>
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-fuchsia-600 to-purple-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'ALL' ? 'ring-4 ring-fuchsia-300' : '')}>
            <Gauge className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overallUtilization || 0}%</p><p className="text-xs opacity-90">Utilization</p>
          </button>
          <button onClick={() => setActiveKpi('OVERLOADED')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OVERLOADED' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.overloaded || 0}</p><p className="text-xs opacity-90">Overloaded</p>
          </button>
          <button onClick={() => setActiveKpi('HIGH')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'HIGH' ? 'ring-4 ring-yellow-300' : '')}>
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.high || 0}</p><p className="text-xs opacity-90">High Load</p>
          </button>
          <button onClick={() => setActiveKpi('UNDER')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-blue-600 to-cyan-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'UNDER' ? 'ring-4 ring-blue-300' : '')}>
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.underutilized || 0}</p><p className="text-xs opacity-90">Underused</p>
          </button>
          <button onClick={() => setActiveKpi('OK')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg transition-all hover:scale-105 ' + (activeKpi === 'OK' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalWorkCenters - summary.overloaded - summary.high - summary.underutilized || 0}</p><p className="text-xs opacity-90">Balanced</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.availableHours || 0}</p><p className="text-xs opacity-90">Available</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work center..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
          </div>
          <div className="flex gap-1 rounded-xl bg-neutral-800 p-1">
            {HORIZONS.map(h => (
              <button key={h.value} onClick={() => setHorizon(h.value)} className={'px-3 py-1.5 rounded-lg text-sm font-bold ' + (horizon === h.value ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white')}>
                {h.label}
              </button>
            ))}
          </div>
          {activeKpi !== 'ALL' && (
            <button onClick={() => setActiveKpi('ALL')} className="px-3 py-2.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold">
              Clear Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Gauge className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No work centers match filters</p>
          </div>
        ) : (
          <>
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800">
                    <tr>
                      {[['name','Work Center'],['capacityPerDay','Cap/Day'],['queue','Queue'],['utilization','Util %'],['peakPct','Peak %'],['woCount','WOs'],['status','Status']].map(([f,label]) => (
                        <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                          <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                      ))}
                      <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(w => (
                      <tr key={w.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                        <td className="p-3 text-white">
                          <div className="font-medium">{w.name}</div>
                          {w.code && <div className="text-xs text-neutral-500">{w.code}</div>}
                        </td>
                        <td className="p-3 text-right text-neutral-200">{Number(w.capacityPerDay).toFixed(1)}</td>
                        <td className="p-3 text-right text-neutral-200">{Number(w.queue).toFixed(0)}</td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-white">{w.utilization}%</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={'font-bold ' + (w.peakPct > 100 ? 'text-red-400' : w.peakPct >= 70 ? 'text-yellow-400' : 'text-green-400')}>{w.peakPct}%</span>
                        </td>
                        <td className="p-3 text-center text-neutral-300">{w.woCount}</td>
                        <td className="p-3">
                          <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(w.status)}>{w.status}</span>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => setDetail(w)} className="p-1.5 rounded-lg bg-purple-900/50 text-purple-300 hover:bg-purple-800">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HEATMAP */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide flex items-center gap-2">
                  <Cog className="w-4 h-4" /> Capacity Heatmap · Next {horizon} Days
                </h3>
                <div className="flex gap-3 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-900"></span>Low</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span>Good</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500"></span>High</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500"></span>Over</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-2 text-neutral-400 text-xs uppercase font-bold sticky left-0 bg-neutral-900 z-10">Work Center</th>
                      {dates.map(d => (
                        <th key={d} className="text-center p-1.5 text-[10px] text-neutral-500 font-normal min-w-[52px]">
                          {new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(w => (
                      <tr key={w.id}>
                        <td className="p-2 font-medium text-white text-xs sticky left-0 bg-neutral-900 z-10">{w.name}</td>
                        {w.daily.map((d: any) => (
                          <td key={d.date} className="p-1">
                            <div className={'w-full h-8 rounded-sm flex items-center justify-center text-[10px] font-bold ' + heatColor(d.pct)} title={d.date + ': ' + d.load + '/' + d.capacity + ' (' + d.pct + '%)'}>
                              {d.pct || ''}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Capacity Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <span className={'inline-block px-5 py-2 rounded-2xl text-base font-bold ' + statusStyle(detail.status)}>{detail.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', detail.name],
                  ['Code', detail.code],
                  ['Capacity', detail.capacity],
                  ['Efficiency', Math.round(Number(detail.efficiency || 0) * 100) + '%'],
                  ['Capacity/Day', detail.capacityPerDay],
                  ['Queue', detail.queue],
                  ['Utilization', detail.utilization + '%'],
                  ['Peak Load', detail.peakPct + '%'],
                  ['Avg Load', detail.avgPct + '%'],
                  ['Work Orders', detail.woCount],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.assignedWOs && detail.assignedWOs.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide mb-2">Assigned Work Orders ({detail.assignedWOs.length})</h3>
                  <div className="space-y-2">
                    {detail.assignedWOs.map((w: any, i: number) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-mono text-white">{w.number}</div>
                            <div className="text-xs text-neutral-400">{w.product}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-neutral-300">{w.remaining} left</span>
                            <div className="text-[10px] text-neutral-500">{w.status}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}