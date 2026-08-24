'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Loader2, MapPin, ChevronLeft, Trash2, Store } from 'lucide-react'

export default function SavedPage() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSaved()
  }, [])

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/marketplace/saved')
      if (res.ok) {
        const data = await res.json()
        setSaved(data.saved || [])
      }
    } catch (error) {
      console.error('Failed to fetch saved')
    } finally {
      setLoading(false)
    }
  }

  const removeSaved = async (listingId: number) => {
    try {
      await fetch(`/api/marketplace/saved?listingId=${listingId}`, { method: 'DELETE' })
      fetchSaved()
    } catch (error) {
      console.error('Failed to remove saved')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" /> Saved Items
          </span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-red-500" /></div>
        ) : saved.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-muted-foreground">No saved items</p>
            <p className="text-sm text-muted-foreground mt-1">Items you save will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {saved.map(item => (
              <div key={item.id} className="rounded-2xl border bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-lg transition-all">
                <Link href={`/marketplace/listing/${item.listingId}`}>
                  <div className="h-40 bg-neutral-200 dark:bg-neutral-800">
                    {item.images && item.images[0] ? (
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
                  </div>
                </Link>
                <button onClick={() => removeSaved(item.listingId)}
                  className="w-full p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 flex items-center justify-center gap-1 text-sm">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}