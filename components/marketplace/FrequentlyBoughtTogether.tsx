'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'

interface FBTProps {
  listingId: number
  currentListing?: any
}

export default function FrequentlyBoughtTogether({ listingId, currentListing }: FBTProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/marketplace/frequently-bought-together/${listingId}`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [listingId])

  if (loading || items.length === 0) return null

  const allItems = currentListing ? [currentListing, ...items] : items
  const totalPrice = allItems.reduce((sum, it) => sum + Number(it.price || 0), 0)

  return (
    <section className="mt-8 p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-green-500" />
        Frequently Bought Together
      </h2>
      <div className="flex items-center gap-3 flex-wrap">
        {allItems.slice(0, 4).map((item, idx) => (
          <div key={item.id} className="flex items-center gap-3">
            {idx > 0 && <Plus className="w-4 h-4 text-neutral-600 flex-shrink-0" />}
            <Link href={`/marketplace/listing/${item.id}`}
              className="flex-shrink-0 w-24 group">
              <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-neutral-700" /></div>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 truncate mt-1">{item.title}</p>
            </Link>
          </div>
        ))}
        <div className="ml-auto text-right">
          <p className="text-xs text-neutral-500 uppercase font-bold">Bundle total</p>
          <p className="text-xl font-bold text-amber-400">KES {totalPrice.toLocaleString()}</p>
          <p className="text-xs text-neutral-500 mt-1">({allItems.length} items)</p>
        </div>
      </div>
    </section>
  )
}