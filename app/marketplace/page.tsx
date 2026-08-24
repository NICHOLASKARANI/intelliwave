'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search, Store, Plus, MapPin, Heart, MessageCircle, User,
  Car, Home, Shirt, Sofa, Laptop, Smartphone, MoreHorizontal, ChevronRight,
  TrendingUp, Clock, Sparkles, Shield, BadgeCheck, Eye
} from 'lucide-react'

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<any>(null)

  useEffect(() => {
    fetchListings()
    fetchCategories()
  }, [activeCategory])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const url = activeCategory
        ? `/api/marketplace/listings?category=${encodeURIComponent(activeCategory)}`
        : search
        ? `/api/marketplace/listings?search=${encodeURIComponent(search)}`
        : '/api/marketplace/listings'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } catch (error) {
      console.error('Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/marketplace/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories')
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => {
      fetchListings()
    }, 500))
  }

  const topCategories = [
    { name: 'Vehicles', icon: Car, color: 'from-blue-500 to-blue-600' },
    { name: 'Property to Rent', icon: Home, color: 'from-green-500 to-emerald-600' },
    { name: 'Women\'s Clothing & Shoes', icon: Shirt, color: 'from-pink-500 to-rose-600' },
    { name: 'Men\'s Clothing and Shoes', icon: Shirt, color: 'from-purple-500 to-violet-600' },
    { name: 'Furniture', icon: Sofa, color: 'from-orange-500 to-amber-600' },
    { name: 'Electronics and Computers', icon: Laptop, color: 'from-cyan-500 to-blue-600' },
    { name: 'Mobile Phones', icon: Smartphone, color: 'from-teal-500 to-emerald-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={40} height={40} className="rounded-xl object-cover shadow-md" />
            <div>
              <span className="font-bold text-lg">Marketplace</span>
              <p className="text-xs text-muted-foreground -mt-1 flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-blue-500" /> Verified Sellers
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/marketplace/sell" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" /> Sell
            </Link>
            <Link href="/marketplace/inbox" className="relative p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </Link>
            <Link href="/marketplace/saved" className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Heart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Hero Search */}
        <div className="relative mb-6 mt-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border shadow-lg p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-50 dark:bg-neutral-800"
                placeholder="Search Marketplace - cars, phones, furniture..."
              />
            </div>
            {activeCategory && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtering by:</span>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium flex items-center gap-1">
                  {activeCategory}
                  <button onClick={() => setActiveCategory('')} className="ml-1 text-blue-400 hover:text-blue-600">×</button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Top Categories
            </h2>
            <Link href="/marketplace/categories" className="text-sm text-blue-600 flex items-center gap-1 hover:text-blue-700">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {topCategories.map(cat => {
              const Icon = cat.icon
              return (
                <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                  className="flex-shrink-0 w-28 text-center group">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">{cat.name}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* All Categories Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Browse Categories
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 18).map(cat => (
              <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  activeCategory === cat.name
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent shadow-lg'
                    : 'bg-white dark:bg-neutral-900 hover:border-blue-300 hover:shadow-md'
                }`}>
                <p className="text-3xl mb-2">{cat.icon || '📦'}</p>
                <p className={`text-xs font-medium ${activeCategory === cat.name ? 'text-white' : ''}`}>{cat.name}</p>
                <p className={`text-xs mt-1 ${activeCategory === cat.name ? 'text-white/70' : 'text-muted-foreground'}`}>{cat.listingCount || 0} items</p>
              </button>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-green-500" /> {activeCategory || 'Fresh Recommendations'}
            </h2>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" /> Updated just now
            </span>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map(listing => (
                <Link key={listing.id} href={`/marketplace/listing/${listing.id}`}
                  className="rounded-2xl border bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-xl transition-all group">
                  <div className="relative h-48 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    {listing.images && listing.images[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {listing.views || 0}
                    </div>
                    {listing.condition === 'New' && (
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-medium">
                        NEW
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-green-600 text-lg">KSh {Number(listing.price).toLocaleString()}</p>
                    <p className="text-sm font-medium truncate">{listing.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {listing.location || 'Kenya'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        {listing.sellerImage ? (
                          <img src={listing.sellerImage} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{listing.sellerName || 'Seller'}</span>
                      <BadgeCheck className="w-3 h-3 text-blue-500 ml-auto" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
              <Store className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium text-muted-foreground">No listings found</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to sell in this category</p>
              <Link href="/marketplace/sell" className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg transition-all">
                <Plus className="w-4 h-4" /> Start Selling
              </Link>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
            <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs font-medium">Secure Payments</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
            <BadgeCheck className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-medium">Verified Sellers</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
            <MessageCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-xs font-medium">Direct Messaging</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border text-center">
            <Eye className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xs font-medium">Transparent Views</p>
          </div>
        </div>
      </div>
    </div>
  )
}