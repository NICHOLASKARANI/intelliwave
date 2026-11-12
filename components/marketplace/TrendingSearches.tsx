'use client'

import { useEffect, useState } from 'react'
import { Flame, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TrendingSearches() {
  const [trending, setTrending] = useState<{ query: string, count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace/search/trending')
      .then(r => r.ok ? r.json() : { trending: [] })
      .then(d => setTrending(d.trending || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-bold uppercase text-neutral-400">Trending Searches</h3>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
      </section>
    )
  }

  if (trending.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold uppercase text-neutral-400">Trending Searches</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {trending.slice(0, 12).map((t, i) => (
          <Link
            key={t.query}
            href={`/marketplace/search?q=${encodeURIComponent(t.query)}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              i < 3
                ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-300 hover:border-orange-500'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {i < 3 && <span className="mr-1">🔥</span>}
            {t.query}
          </Link>
        ))}
      </div>
    </section>
  )
}