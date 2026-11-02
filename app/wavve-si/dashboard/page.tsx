'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, DollarSign, Layers, TrendingUp, ArrowRight, Clock, CheckCircle, Sparkles } from 'lucide-react'
import { KpiCard } from '@/components/wavve-si/KpiCard'
import { ChartCard } from '@/components/wavve-si/ChartCard'

interface ModuleItem {
  id: number
  slug: string
  name: string
  shortName: string
  description: string
  tier: string
  category: string
  href: string
  accessible: boolean
  preview: boolean
}

interface ModulesResponse {
  subscribed: boolean
  subscriptionStatus: string | null
  subscriptionEndDate: string | null
  daysLeft: number | null
  organization: { id: string; name: string } | null
  user: { id: string; name: string; email: string }
  allowedTiers: string[]
  accessibleCount: number
  totalCount: number
  modules: ModuleItem[]
}

const TIER_LABEL: Record<string, string> = {
  core: 'Core (1–30)',
  expansion: 'Expansion (31–50)',
  specialist: 'Specialist (51–70)',
  advanced: 'Advanced (71–100)',
}

const TIER_COLOR: Record<string, string> = {
  core: 'bg-blue-500/20 text-blue-400',
  expansion: 'bg-purple-500/20 text-purple-400',
  specialist: 'bg-amber-500/20 text-amber-400',
  advanced: 'bg-pink-500/20 text-pink-400',
}

export default function DashboardPage() {
  const [data, setData] = useState<ModulesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTier, setActiveTier] = useState<string>('all')

  useEffect(() => {
    fetch('/api/wavve-si/modules', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 401) {
          window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard'
          return
        }
        if (!r.ok) throw new Error('Failed to load modules')
        return r.json()
      })
      .then(d => { if (d) setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const filteredModules = useMemo(() => {
    if (!data) return []
    if (activeTier === 'all') return data.modules.filter(m => m.accessible)
    return data.modules.filter(m => m.accessible && m.tier === activeTier)
  }, [data, activeTier])

  // Sample trend data (real data comes in Phase 2 per-system)
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((d, i) => ({ name: d, value: Math.floor(20 + i * 5 + Math.random() * 15) }))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {data.user.name?.split(' ')[0] || 'Leader'}</h1>
        <p className="text-slate-400 text-sm">
          {data.organization ? `Managing ${data.organization.name}` : 'Your Wavve SI workspace'}
          {data.subscriptionStatus && ` · ${data.subscriptionStatus}`}
          {data.daysLeft !== null && data.daysLeft !== undefined && ` · ${data.daysLeft} days left`}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Accessible Systems" value={`${data.accessibleCount} / ${data.totalCount}`} icon={Layers} accent="blue" subtitle="From your subscription tier" />
        <KpiCard label="Organization" value={data.organization?.name ?? 'Not set up'} icon={Users} accent="green" subtitle="Your tenant" />
        <KpiCard label="Subscription" value={data.subscribed ? 'Active' : 'Inactive'} icon={DollarSign} accent={data.subscribed ? 'green' : 'amber'} subtitle={data.subscriptionStatus ?? 'No active plan'} />
        <KpiCard label="Systems Ready" value="1 of 100" icon={TrendingUp} accent="purple" subtitle="Restaurant goes live next" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <ChartCard title="Platform Activity (last 7 days)" subtitle="Systems opened across your org" type="area" data={trendData} dataKey="value" xKey="name" color="#3b82f6" height={240} />
        </div>
        <ChartCard title="Accessible by Tier" subtitle="Your subscription coverage" type="pie" data={[
          { name: 'Core', value: data.modules.filter(m => m.tier === 'core' && m.accessible).length },
          { name: 'Expansion', value: data.modules.filter(m => m.tier === 'expansion' && m.accessible).length },
          { name: 'Specialist', value: data.modules.filter(m => m.tier === 'specialist' && m.accessible).length },
          { name: 'Advanced', value: data.modules.filter(m => m.tier === 'advanced' && m.accessible).length },
        ]} dataKey="value" xKey="name" height={240} />
      </div>

      {/* Tier filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setActiveTier('all')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTier === 'all' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
          All ({data.accessibleCount})
        </button>
        {['core', 'expansion', 'specialist', 'advanced'].map(tier => {
          const count = data.modules.filter(m => m.tier === tier && m.accessible).length
          return (
            <button key={tier} onClick={() => setActiveTier(tier)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTier === tier ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              {TIER_LABEL[tier]} ({count})
            </button>
          )
        })}
      </div>

      {/* Systems grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Your Systems</h2>
          <Link href="/wavve-si/dashboard/systems" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {filteredModules.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No systems accessible in this tier yet.</p>
            <p className="text-xs text-slate-500 mt-2">Upgrade your subscription to unlock more systems.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredModules.slice(0, 9).map(sys => (
              <Link key={sys.id} href={sys.href} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-slate-500">#{String(sys.id).padStart(3, '0')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${TIER_COLOR[sys.tier]}`}>{sys.tier}</span>
                </div>
                <h3 className="font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">{sys.shortName}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{sys.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
          {[
            { icon: CheckCircle, text: 'Wavve SI dashboard activated', time: 'Just now', color: 'text-green-400' },
            { icon: Users, text: `Organization ${data.organization?.name ?? 'linked'}`, time: 'Just now', color: 'text-blue-400' },
            { icon: Layers, text: `${data.accessibleCount} systems unlocked`, time: 'Just now', color: 'text-purple-400' },
          ].map((a, i) => {
            const Icon = a.icon
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${a.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{a.text}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {a.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}