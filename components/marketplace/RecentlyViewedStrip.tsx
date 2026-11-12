'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Store } from 'lucide-react'

export default function RecentlyViewedStrip() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace/recently-viewed')
      .then(r => r.ok ? r.json() : { recentlyViewed: [] })
      .then(d => setItems(d.recentlyViewed || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || items.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold uppercase text-neutral-400">Recently Viewed</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map(item => (
          <Link
            key={item.listingId}
            href={`/marketplace/listing/${item.listingId}`}
            className="flex-shrink-0 w-32 group"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-800 mb-2">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-neutral-600" />
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-white truncate">{item.title}</p>
            <p className="text-xs text-amber-400">KES {Number(item.price).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}