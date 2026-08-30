'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Loader2, TrendingUp, Target, CheckCircle, XCircle, Clock, DollarSign, Printer, PieChart, Activity, Zap } from 'lucide-react'

interface PipelineStats {
  totalOpportunities: number
  wonOpportunities: number
  lostOpportunities: number
  openOpportunities: number
  winRate: number
  totalValue: number
  wonValue: number
  pendingValue: number
  stages: { name: string; count: number }[]
}

export default function PipelinePage() {
  const [stats, setStats] = useState<PipelineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPipeline()
  }, [])

  const fetchPipeline = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/opportunities')
      const data = await res.json()
      const opportunities = data.opportunities || []

      const won = opportunities.filter(o => o.status === 'CLOSED_WON' || o.status === 'WON')
      const lost = opportunities.filter(o => o.status === 'CLOSED_LOST' || o.status === 'LOST')
      const open = opportunities.filter(o => !['CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST'].includes(o.status))

      const totalValue = opportunities.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)
      const wonValue = won.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)
      const pendingValue = open.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)
      const winRate = opportunities.length > 0 ? Math.round((won.length / opportunities.length) * 100) : 0

      const stages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED WON', 'CLOSED LOST'].map(name => ({
        name,
        count: opportunities.filter(o => o.stage === name || o.status === name).length
      }))

      setStats({
        totalOpportunities: opportunities.length,
        wonOpportunities: won.length,
        lostOpportunities: lost.length,
        openOpportunities: open.length,
        winRate,
        totalValue,
        wonValue,
        pendingValue,
        stages
      })
    } catch (err) {
      setError('Failed to load pipeline data')
    } finally {
      setLoading(false)
    }
  }

  const printReport = () => window.print()

  // Calculate donut chart segments
  const donutSegments = stats ? [
    { name: 'Won', value: stats.wonOpportunities, color: '#16a34a' },
    { name: 'Lost', value: stats.lostOpportunities, color: '#dc2626' },
    { name: 'Open', value: stats.openOpportunities, color: '#f59e0b' },
  ].filter(s => s.value > 0) : []

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Pipeline Analytics</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" /> Sales Pipeline & Win Rate
          </h1>
          <button onClick={printReport}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : stats && (
          <>
            {/* WIN RATE HERO */}
            <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 p-6 mb-6 text-center">
              <p className="text-white/80 text-sm mb-2 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" /> WIN RATE
              </p>
              <p className="text-6xl font-bold text-white">{stats.winRate}%</p>
              <div className="w-full max-w-md mx-auto bg-white/20 rounded-full h-3 mt-4">
                <div className="h-3 rounded-full bg-white" style={{ width: `${stats.winRate}%` }} />
              </div>
              <p className="text-white/80 text-sm mt-2">
                {stats.wonOpportunities} won / {stats.lostOpportunities} lost / {stats.openOpportunities} open
              </p>
            </div>

            {/* DONUT CHART */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" /> Opportunity Distribution
                </h2>
                {donutSegments.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="15" />
                        {donutSegments.map((seg, i) => {
                          const total = donutSegments.reduce((s, x) => s + x.value, 0)
                          const offset = donutSegments.slice(0, i).reduce((s, x) => s + (x.value / total) * 100, 0)
                          const dash = (seg.value / total) * 251.2
                          return (
                            <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={seg.color} strokeWidth="15"
                              strokeDasharray={`${dash} ${251.2 - dash}`} strokeDashoffset={-offset * 2.512}
                              transform="rotate(-90 50 50)" />
                          )
                        })}
                      </svg>
                    </div>
                    <div className="space-y-2">
                      {donutSegments.map(seg => (
                        <div key={seg.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                          <span className="text-sm">{seg.name}</span>
                          <span className="font-bold">{seg.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data</p>
                )}
              </div>

              {/* STAGE BAR CHART */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Pipeline Stages
                </h2>
                <div className="space-y-3">
                  {stats.stages.map(stage => {
                    const maxCount = Math.max(...stats.stages.map(s => s.count), 1)
                    const percentage = (stage.count / maxCount) * 100
                    return (
                      <div key={stage.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{stage.name}</span>
                          <span className="font-bold">{stage.count}</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-4">
                          <div className="h-4 rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* VALUE METRICS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                <p className="text-lg font-bold text-blue-700">KSh {stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-blue-600">Total Pipeline</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-green-600" />
                <p className="text-lg font-bold text-green-700">KSh {stats.wonValue.toLocaleString()}</p>
                <p className="text-xs text-green-600">Won Value</p>
              </div>
              <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-yellow-600" />
                <p className="text-lg font-bold text-yellow-700">KSh {stats.pendingValue.toLocaleString()}</p>
                <p className="text-xs text-yellow-600">Pending Value</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}