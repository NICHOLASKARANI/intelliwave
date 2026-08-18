'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Search, Store, Plus, MapPin, Heart, MessageCircle, User,
  Car, Home, Shirt, Sofa, Laptop, Smartphone, MoreHorizontal, ChevronRight
} from 'lucide-react'

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  useEffect(() => {
    fetchListings()
    fetchCategories()
  }, [activeCategory])

  async function fetchListings() {
    try {
      const url = activeCategory 
        ? `/api/marketplace/listings?category=${encodeURIComponent(activeCategory)}`
        : '/api/marketplace/listings'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } catch {} finally { setLoading(false) }
  }

  async function fetchCategories() {
    try {
      const res = await fetch('/api/marketplace/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {}
  }

  const topCategories = [
    { name: 'Vehicles', icon: Car },
    { name: 'Property to Rent', icon: Home },
    { name: 'Women\'s Clothing & Shoes', icon: Shirt },
    { name: 'Men\'s Clothing and Shoes', icon: Shirt },
    { name: 'Furniture', icon: Sofa },
    { name: 'Electronics and Computers', icon: Laptop },
    { name: 'Mobile Phones', icon: Smartphone },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-lg">Marketplace</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/marketplace/sell" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Sell
            </Link>
            <Link href="/marketplace/inbox" className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <MessageCircle className="w-5 h-5" />
            </Link>
            <Link href="/marketplace/saved" className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Heart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search Marketplace"
          />
        </div>

        {/* Top Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Top Categories</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {topCategories.map(cat => {
              const Icon = cat.icon
              return (
                <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                  className="flex-shrink-0 w-24 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.name}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* All Categories */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">All Categories</h2>
            <Link href="/marketplace/categories" className="text-sm text-blue-600 flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.slice(0, 12).map(cat => (
              <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                className="p-4 rounded-xl border bg-white dark:bg-neutral-900 text-left hover:border-blue-300">
                <p className="text-2xl mb-1">{cat.icon || '📦'}</p>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.listingCount || 0} listings</p>
              </button>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">{activeCategory || 'Fresh Recommendations'}</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map(listing => (
                <Link key={listing.id} href={`/marketplace/listing/${listing.id}`}
                  className="rounded-xl border bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-lg transition-all">
                  <div className="h-40 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                    {listing.images && listing.images[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-green-600">KSh {listing.price?.toLocaleString()}</p>
                    <p className="text-sm truncate">{listing.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {listing.location || 'Kenya'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No listings yet</p>
              <Link href="/marketplace/sell" className="text-blue-600 text-sm mt-2 inline-block">
                Be the first to sell
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}