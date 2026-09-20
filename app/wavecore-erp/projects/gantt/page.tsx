'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar, Loader2, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, Printer, Target, Clock, GanttChartSquare,
} from 'lucide-react'

const DAY_WIDTH = 36

export default function GanttPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dayOffset, setDayOffset] = useState(0)
  const [filterStatus, setFilterStatus] = useState('ALL')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const statusColor = (s: string, overdue: boolean) => {
    if (overdue) return '#dc2626'
    switch (s) {
      case 'ACTIVE': return '#0891b2'
      case 'COMPLETED': return '#16a34a'
      case 'PLANNING': return '#ca8a04'
      case 'ON_HOLD': return '#ea580c'
      default: return '#6b7280'
    }
  }

  // 30-day viewport
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const viewStart = new Date(today)
  viewStart.setDate(viewStart.getDate() + dayOffset)

  const days = useMemo(() => {
    const arr: Date[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(viewStart)
      d.setDate(d.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [dayOffset])

  const filtered = useMemo(() => {
    let list = projects.filter(p => p.startDate || p.endDate)
    if (filterStatus !== 'ALL') list = list.filter(p => p.status === filterStatus)
    return list
  }, [projects, filterStatus])

  const dayIndex = (d: Date | string) => {
    const dd = new Date(d)
    dd.setHours(0, 0, 0, 0)
    const diff = Math.floor((dd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const isToday = (d: Date) => d.toDateString() === today.toDateString()

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Projects · Gantt Timeline</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <GanttChartSquare className="w-7 h-7 text-purple-400" /> Gantt Timeline
            </h1>
            <p className="text-sm text-neutral-400 mt-1">30-day project timeline view</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDayOffset(dayOffset - 7)} className="px-3 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setDayOffset(0)} className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Today
            </button>
            <button onClick={() => setDayOffset(dayOffset + 7)} className="px-3 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
            </button>
            <button onClick={() => window.open('/api/wavecore/projects/pdf', '_blank')} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Report
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} projects visible</span>
          <div className="ml-auto flex gap-3 text-xs">
            <Legend color="#0891b2" label="Active" />
            <Legend color="#16a34a" label="Completed" />
            <Legend color="#ca8a04" label="Planning" />
            <Legend color="#ea580c" label="On Hold" />
            <Legend color="#dc2626" label="Overdue" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No projects with dates to display</p>
            <Link href="/wavecore-erp/projects" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold inline-flex items-center gap-2">
              <Target className="w-4 h-4" /> Create a Project
            </Link>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header row with days */}
                <div className="flex border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
                  <div className="w-56 flex-shrink-0 p-3 border-r border-neutral-800 text-xs uppercase tracking-wide text-neutral-400 font-bold">
                    Project
                  </div>
                  <div className="flex-1 flex">
                    {days.map((d, i) => (
                      <div
                        key={i}
                        className={'flex-shrink-0 border-r border-neutral-800 py-2 text-center ' + (isToday(d) ? 'bg-purple-900/30' : '')}
                        style={{ width: DAY_WIDTH + 'px' }}
                      >
                        <p className={'text-[9px] uppercase ' + (isToday(d) ? 'text-purple-300 font-bold' : 'text-neutral-500')}>
                          {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </p>
                        <p className={'text-xs font-bold ' + (isToday(d) ? 'text-purple-300' : 'text-neutral-300')}>
                          {d.getDate()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project rows */}
                {filtered.map(p => {
                  const startIdx = p.startDate ? dayIndex(p.startDate) : 0
                  const endIdx = p.endDate ? dayIndex(p.endDate) : startIdx + 7
                  const visibleStart = Math.max(0, startIdx)
                  const visibleEnd = Math.min(29, endIdx)
                  const spanDays = Math.max(1, visibleEnd - visibleStart + 1)
                  const leftPx = visibleStart * DAY_WIDTH
                  const widthPx = spanDays * DAY_WIDTH
                  const color = statusColor(p.status, p.isOverdue)
                  const isOverdue = p.isOverdue

                  return (
                    <div key={p.id} className="flex border-b border-neutral-800 hover:bg-neutral-800/30">
                      <div className="w-56 flex-shrink-0 p-3 border-r border-neutral-800">
                        <p className="text-sm text-white font-medium truncate">{p.title}</p>
                        <p className="text-[10px] text-neutral-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {p.startDate ? new Date(p.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                          {' → '}
                          {p.endDate ? new Date(p.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                          {isOverdue && <AlertTriangle className="w-3 h-3 text-red-400 ml-1" />}
                        </p>
                      </div>
                      <div className="flex-1 relative" style={{ height: '56px' }}>
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex">
                          {days.map((d, i) => (
                            <div key={i} className={'flex-shrink-0 border-r border-neutral-800 ' + (isToday(d) ? 'bg-purple-900/20' : '')} style={{ width: DAY_WIDTH + 'px' }} />
                          ))}
                        </div>
                        {/* Bar */}
                        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: leftPx + 'px', width: widthPx + 'px' }}>
                          <div
                            className="h-6 rounded-md flex items-center justify-end px-2 relative shadow-lg"
                            style={{ backgroundColor: color }}
                            title={`${p.title} · ${p.progress}% complete`}
                          >
                            <span className="text-[10px] text-white font-bold">{p.progress}%</span>
                            <div
                              className="absolute inset-0 bg-white/20 rounded-md"
                              style={{ width: (100 - p.progress) + '%', marginLeft: 'auto' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-5 rounded-2xl bg-purple-900/20 border border-purple-800/50 flex gap-3">
          <Clock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-200 space-y-1">
            <p><b>Navigation:</b> Use the arrow buttons to move the 30-day window. Click "Today" to jump back to the current date.</p>
            <p><b>Bar color:</b> Status-based. Red = overdue. Progress % shown at the end of each bar.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-neutral-400">
      <span className="w-3 h-3 rounded" style={{ backgroundColor: color }}></span>
      {label}
    </span>
  )
}