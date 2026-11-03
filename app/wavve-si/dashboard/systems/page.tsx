'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Layers } from 'lucide-react'
import { WAVVE_SI_SYSTEMS, TIER_LABELS, type Tier } from '@/lib/wavve-si/modules'

export default function SystemsPage() {
  const [search, setSearch] = useState('')
  const [activeTier, setActiveTier] = useState<Tier | 'all'>('all')

  const filtered = useMemo(() => {
    return WAVVE_SI_SYSTEMS.filter(s => {
      const q = search.toLowerCase()
      const matchesSearch = q === '' || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      const matchesTier = activeTier === 'all' || s.tier === activeTier
      return matchesSearch && matchesTier
    })
  }, [search, activeTier])

  const tiers: (Tier | 'all')[] = ['all', 'core', 'expansion', 'specialist', 'advanced']

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Layers className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">All Systems</h1>
          <p className="text-sm text-slate-400">{filtered.length} of 100 systems</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search systems by name, industry, or capability..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tiers.map(t => (
            <button key={t} onClick={() => setActiveTier(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTier === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              {t === 'all' ? `All 100 Systems` : TIER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sys) => (
          <Link key={sys.id} href={`/wavve-si/modules/${sys.slug}`}
            className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-mono text-slate-500">#{String(sys.id).padStart(3, '0')}</span>
              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">{sys.category}</span>
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{sys.shortName}</h3>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{sys.description}</p>
            <div className="flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Open <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>No systems match "{search}"</p>
        </div>
      )}
    </div>
  )
}