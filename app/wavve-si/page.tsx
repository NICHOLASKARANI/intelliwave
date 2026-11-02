'use client'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { WAVVE_SI_SYSTEMS, TIER_LABELS, type Tier } from '@/lib/wavve-si/modules'
import { Search, ArrowRight } from 'lucide-react'

export default function WavveSiLandingPage() {
  const [search, setSearch] = useState('')
  const [activeTier, setActiveTier] = useState<Tier | 'all'>('all')

  const filtered = useMemo(() => {
    return WAVVE_SI_SYSTEMS.filter(s => {
      const matchesSearch = search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
      const matchesTier = activeTier === 'all' || s.tier === activeTier
      return matchesSearch && matchesTier
    })
  }, [search, activeTier])

  const tiers: (Tier | 'all')[] = ['all', 'core', 'expansion', 'specialist', 'advanced']

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-sm mb-6 border border-blue-500/30">
            Powered by IntelliWavve · Global Enterprise Technology
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            Wavve <span className="text-blue-500">SI</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-4">Wavve Super Intelligence</p>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-10">
            One Ecosystem. 100 Intelligent Systems. Unlimited Possibilities.
            <br />
            The Operating Ecosystem for Modern Organisations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/wavve-si/register" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
              Create Account
            </Link>
            <Link href="/wavve-si/login" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all">
              Sign In
            </Link>
          </div>
        </div>

        {/* Search + Tier filter */}
        <div className="mb-10">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search 100 systems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tiers.map(t => (
              <button
                key={t}
                onClick={() => setActiveTier(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTier === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t === 'all' ? `All 100 Systems` : TIER_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-400 mb-6">{filtered.length} of 100 systems</p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sys) => (
            <Link
              key={sys.id}
              href={`/wavve-si/dashboard?module=${sys.slug}`}
              className="block bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-slate-500">#{sys.id}</span>
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
    </div>
  )
}