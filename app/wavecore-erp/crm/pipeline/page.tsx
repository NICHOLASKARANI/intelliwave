'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, Loader2, TrendingUp, Target, CheckCircle, XCircle, Clock, DollarSign, Printer } from 'lucide-react'

interface PipelineStats {
  totalOpportunities: number
  wonOpportunities: number
  lostOpportunities: number
  openOpportunities: number
  winRate: number
  totalValue: number
  wonValue: number
  pendingValue: number
  stages: {
    name: string
    count: number
    value: number
  }[]
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
      const [oppRes] = await Promise.all([
        fetch('/api/wavecore/crm/opportunities')
      ])
      const oppData = await oppRes.json()
      const opportunities = oppData.opportunities || []

      const won = opportunities.filter(o => o.status === 'CLOSED_WON' || o.status === 'WON')
      const lost = opportunities.filter(o => o.status === 'CLOSED_LOST' || o.status === 'LOST')
      const open = opportunities.filter(o => o.status !== 'CLOSED_WON' && o.status !== 'CLOSED_LOST' && o.status !== 'WON' && o.status !== 'LOST')

      const totalValue = opportunities.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)
      const wonValue = won.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)
      const pendingValue = open.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)

      const winRate = opportunities.length > 0 ? (won.length / opportunities.length) * 100 : 0

      setStats({
        totalOpportunities: opportunities.length,
        wonOpportunities: won.length,
        lostOpportunities: lost.length,
        openOpportunities: open.length,
        winRate: Math.round(winRate),
        totalValue,
        wonValue,
        pendingValue,
        stages: [
          { name: 'PROSPECTING', count: opportunities.filter(o => o.stage === 'PROSPECTING').length, value: 0 },
          { name: 'QUALIFICATION', count: opportunities.filter(o => o.stage === 'QUALIFICATION').length, value: 0 },
          { name: 'PROPOSAL', count: opportunities.filter(o => o.stage === 'PROPOSAL').length, value: 0 },
          { name: 'NEGOTIATION', count: opportunities.filter(o => o.stage === 'NEGOTIATION').length, value: 0 },
        ]
      })
    } catch (err) {
      setError('Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Pipeline & Win Rate</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" /> Sales Pipeline
          </h1>
          <button onClick={printReport}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" /></div>
        ) : stats && (
          <>
            {/* WIN RATE - Main Metric */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">WIN RATE</p>
              <p className="text-6xl font-bold text-green-600">{stats.winRate}%</p>
              <div className="w-full bg-neutral-200 rounded-full h-4 mt-4">
                <div className="h-4 rounded-full bg-green-600" style={{ width: `${stats.winRate}%` }} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.wonOpportunities} won out of {stats.totalOpportunities} total
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats.totalOpportunities}</p>
                <p className="text-xs text-muted-foreground">Total Opportunities</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{stats.wonOpportunities}</p>
                <p className="text-xs text-green-700">Won</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
                <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{stats.lostOpportunities}</p>
                <p className="text-xs text-red-700">Lost</p>
              </div>
              <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">{stats.openOpportunities}</p>
                <p className="text-xs text-yellow-700">Open</p>
              </div>
            </div>

            {/* Value Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-lg font-bold">KSh {stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Pipeline</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <p className="text-lg font-bold text-green-600">KSh {stats.wonValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Won Value</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
                <DollarSign className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                <p className="text-lg font-bold text-yellow-600">KSh {stats.pendingValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pending Value</p>
              </div>
            </div>

            {/* Stage Breakdown */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Pipeline Stages
              </h2>
              <div className="space-y-3">
                {stats.stages.map(stage => (
                  <div key={stage.name} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                    <span className="font-bold">{stage.name}</span>
                    <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold">{stage.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}