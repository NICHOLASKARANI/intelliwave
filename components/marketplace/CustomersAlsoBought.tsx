'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, MapPin, Users, Loader2 } from 'lucide-react'

interface CustomersAlsoBoughtProps {
  listingId: number
}

export default function CustomersAlsoBought({ listingId }: CustomersAlsoBoughtProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/marketplace/co-purchase/${listingId}`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [listingId])

  if (loading) return null
  if (items.length === 0) return null

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Customers Also Bought</h2>
        <span className="text-xs text-neutral-500">· Based on real purchase patterns</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map(item => (
          <Link
            key={item.id}
            href={`/marketplace/listing/${item.id}`}
            className="group bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-purple-500/50 overflow-hidden transition-all"
          >
            <div className="aspect-square bg-neutral-800 relative overflow-hidden">
              {item.images?.[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-neutral-700" />
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" /> {item.buyerCount}
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs font-bold text-white truncate">{item.title}</p>
              <p className="text-sm font-bold text-amber-400 mt-1">KES {Number(item.price).toLocaleString()}</p>
              {item.location && (
                <p className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5" /> {item.location}
                </p>
              )}
              {item.averageRating > 0 && (
                <p className="text-[10px] text-amber-400 mt-0.5">⭐ {Number(item.averageRating).toFixed(1)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}