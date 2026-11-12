'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, MapPin, Sparkles, Loader2 } from 'lucide-react'

interface RelatedProductsProps {
  listingId: number
  category?: string
}

export default function RelatedProducts({ listingId }: RelatedProductsProps) {
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/marketplace/related/${listingId}`)
      .then(r => r.ok ? r.json() : { related: [] })
      .then(d => setRelated(d.related || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [listingId])

  if (loading || related.length === 0) return null

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-bold text-white">Related Products</h2>
        <span className="text-xs text-neutral-500">· Similar items you might like</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((l: any) => (
          <Link key={l.id} href={`/marketplace/listing/${l.id}`}
            className="group bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-purple-500/50 overflow-hidden transition-all">
            <div className="aspect-square bg-neutral-800 relative overflow-hidden">
              {l.images?.[0] ? (
                <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-10 h-10 text-neutral-700" />
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
                <p className="text-xs text-amber-400 mt-1">⭐ {Number(l.averageRating).toFixed(1)} ({l.totalReviews || 0})</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}