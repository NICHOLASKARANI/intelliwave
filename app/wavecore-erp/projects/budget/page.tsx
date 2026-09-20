'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  DollarSign, Loader2, RefreshCw, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Printer, BarChart3, Target, Activity,
} from 'lucide-react'

export default function BudgetPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/wavecore/projects'),
        fetch('/api/wavecore/projects/time-entries'),
      ])
      const pData = await pRes.json()
      const tData = await tRes.json()
      setProjects(pData.projects || [])
      setEntries(tData.entries || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const costPerProject = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      if (!map[e.projectId]) map[e.projectId] = 0
      map[e.projectId] += Number(e.hours || 0) * 2500 // default hourly rate assumption
    }
    return map
  }, [entries])

  const rows = useMemo(() => {
    return projects.map(p => {
      const budget = Number(p.budget || 0)
      const spent = costPerProject[p.id] || 0
      const variance = budget - spent
      const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0
      return {
        ...p,
        budget,
        spent,
        variance,
        utilization,
        status: variance < 0 ? 'OVER' : utilization > 80 ? 'WARNING' : 'HEALTHY',
      }
    }).sort((a, b) => b.budget - a.budget)
  }, [projects, costPerProject])

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0)
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0)
  const totalVariance = totalBudget - totalSpent
  const overBudgetCount = rows.filter(r => r.variance < 0).length
  const avgUtilization = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.utilization, 0) / rows.length) : 0

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/projects" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Projects · Budget</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <DollarSign className="w-7 h-7 text-emerald-400" /> Budget Overview
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Planned vs actual · Variance · Utilization</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={() => window.open('/api/wavecore/projects/pdf', '_blank')} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40">
              <Printer className="w-4 h-4" /> Report
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{Math.round(totalBudget).toLocaleString()}</p><p className="text-xs opacity-90">Total Budget</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg">
            <TrendingDown className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{Math.round(totalSpent).toLocaleString()}</p><p className="text-xs opacity-90">Total Spent</p>
          </div>
          <div className={'p-4 rounded-2xl text-white shadow-lg bg-gradient-to-br ' + (totalVariance >= 0 ? 'from-green-600 to-emerald-800' : 'from-red-600 to-rose-800')}>
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{Math.round(totalVariance).toLocaleString()}</p><p className="text-xs opacity-90">Variance</p>
          </div>
          <div className={'p-4 rounded-2xl text-white shadow-lg bg-gradient-to-br ' + (overBudgetCount > 0 ? 'from-red-600 to-rose-800' : 'from-slate-600 to-neutral-800')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{overBudgetCount}</p><p className="text-xs opacity-90">Over Budget</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white shadow-lg">
            <BarChart3 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{avgUtilization}%</p><p className="text-xs opacity-90">Avg Utilization</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No projects yet</p>
            <Link href="/wavecore-erp/projects" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-2">
              <Target className="w-4 h-4" /> Create a Project
            </Link>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Project</th>
                    <th className="text-right p-3 text-xs uppercase tracking-wide text-neutral-400">Budget</th>
                    <th className="text-right p-3 text-xs uppercase tracking-wide text-neutral-400">Spent</th>
                    <th className="text-right p-3 text-xs uppercase tracking-wide text-neutral-400">Variance</th>
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Utilization</th>
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3 text-white font-medium">{r.title}</td>
                      <td className="p-3 text-right text-white font-bold">{r.budget.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-400 font-bold">{Math.round(r.spent).toLocaleString()}</td>
                      <td className={'p-3 text-right font-bold ' + (r.variance >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {r.variance >= 0 ? '+' : ''}{Math.round(r.variance).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-24 bg-neutral-700 rounded-full h-2">
                            <div className={'h-2 rounded-full ' + (r.utilization > 100 ? 'bg-red-500' : r.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500')} style={{ width: Math.min(r.utilization, 100) + '%' }}></div>
                          </div>
                          <span className="text-xs font-bold text-white">{r.utilization}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={'px-2 py-1 rounded-full text-[10px] font-bold border ' + (
                          r.status === 'OVER' ? 'bg-red-900/40 text-red-300 border-red-700' :
                          r.status === 'WARNING' ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700' :
                          'bg-green-900/40 text-green-300 border-green-700'
                        )}>
                          {r.status === 'OVER' ? 'OVER BUDGET' : r.status === 'WARNING' ? 'AT RISK' : 'HEALTHY'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 p-5 rounded-2xl bg-blue-900/20 border border-blue-800/50 flex gap-3">
          <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200 space-y-1">
            <p><b>How cost is calculated:</b> Total hours logged × KES 2,500/hr default rate. Configure actual rates per member on the Resources page.</p>
            <p><b>What to do if over budget:</b> Review project scope, reduce allocated hours, or request budget increase.</p>
          </div>
        </div>
      </main>
    </div>
  )
}