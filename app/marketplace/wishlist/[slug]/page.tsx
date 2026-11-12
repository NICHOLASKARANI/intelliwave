'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Loader2, MapPin, ChevronLeft, Store, User, Globe } from 'lucide-react'

export default function PublicWishlistPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    fetch(`/api/marketplace/wishlists/public/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setData(d))
      .catch(() => setError('Wishlist not found or is now private'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <p className="text-lg font-bold">{error}</p>
          <Link href="/marketplace" className="inline-block mt-4 px-5 py-2 rounded-xl bg-pink-500 text-white font-bold text-sm">Browse Marketplace</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-5xl mx-auto">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" /> Public Wishlist
          </span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-200 dark:border-pink-900">
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2 mb-2">
            <Heart className="w-7 h-7 fill-pink-500 text-pink-500" /> {data.collection.name}
          </h1>
          {data.collection.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{data.collection.description}</p>
          )}
          <p className="text-xs text-neutral-500 flex items-center gap-2">
            <User className="w-3 h-3" /> Curated by {data.collection.ownerName} · {data.items.length} item{data.items.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Items */}
        {data.items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">This wishlist is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.items.map((item: any) => (
              <Link key={item.listingId} href={`/marketplace/listing/${item.listingId}`}
                className="rounded-2xl border bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-lg transition-all block">
                <div className="h-40 bg-neutral-200 dark:bg-neutral-800">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-green-600">KSh {Number(item.price).toLocaleString()}</p>
                  <p className="text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {item.location || 'Kenya'}
                  </p>
                  {item.note && <p className="text-xs text-pink-600 mt-1 italic">"{item.note}"</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}