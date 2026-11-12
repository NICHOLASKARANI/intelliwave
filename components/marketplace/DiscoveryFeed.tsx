'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, MapPin, Flame, Package, Star, Sparkles, Loader2, Award } from 'lucide-react'

type DiscoveryType = 'bestsellers' | 'new' | 'featured' | 'trending'

interface DiscoveryFeedProps {
  type: DiscoveryType
  title?: string
  subtitle?: string
  limit?: number
}

const ICONS: Record<DiscoveryType, any> = {
  bestsellers: Award,
  new: Sparkles,
  featured: Star,
  trending: Flame,
}

const COLORS: Record<DiscoveryType, string> = {
  bestsellers: 'text-amber-500',
  new: 'text-green-500',
  featured: 'text-purple-500',
  trending: 'text-orange-500',
}

const DEFAULT_TITLES: Record<DiscoveryType, string> = {
  bestsellers: 'Best Sellers',
  new: 'New Arrivals',
  featured: 'Featured Products',
  trending: 'Trending Now',
}

export default function DiscoveryFeed({ type, title, subtitle, limit = 8 }: DiscoveryFeedProps) {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/marketplace/discovery?type=${type}&limit=${limit}`)
      .then(r => r.ok ? r.json() : { listings: [] })
      .then(d => setListings(d.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [type, limit])

  const Icon = ICONS[type]
  const colorClass = COLORS[type]
  const displayTitle = title || DEFAULT_TITLES[type]

  if (loading || listings.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colorClass}`} />
          <h2 className="text-xl font-bold text-white">{displayTitle}</h2>
          {subtitle && <span className="text-xs text-neutral-500">· {subtitle}</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {listings.map((l: any) => (
          <Link key={l.id} href={`/marketplace/listing/${l.id}`}
            className="group bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-amber-500/50 overflow-hidden transition-all">
            <div className="aspect-square bg-neutral-800 relative overflow-hidden">
              {l.images?.[0] ? (
                <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-neutral-700" />
                </div>
              )}
              {type === 'bestsellers' && l.unitsSold > 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" /> {l.unitsSold} sold
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-white truncate">{l.title}</p>
              <p className="text-lg font-bold text-amber-400 mt-1">KES {Number(l.price).toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                {l.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{l.location}</span>}
              </div>
              {l.averageRating > 0 && (
                <p className="text-xs text-amber-400 mt-1">⭐ {Number(l.averageRating).toFixed(1)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}