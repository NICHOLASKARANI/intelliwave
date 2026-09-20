'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search, ShoppingCart, Store, Plus, MapPin, Heart, MessageCircle, User,
  Sparkles, Shield, BadgeCheck, Eye, TrendingUp, Zap, Package, Tag,
  RefreshCw, Filter, ArrowUpDown, Route,
} from 'lucide-react'

const TOP_CATEGORIES = [
  { name: 'Electronics', slug: 'Electronics', color: 'from-blue-500 to-indigo-600' },
  { name: 'Mobile Phones', slug: 'Mobile Phones', color: 'from-teal-500 to-emerald-600' },
  { name: 'Furniture', slug: 'Furniture', color: 'from-orange-500 to-amber-600' },
  { name: 'Vehicles', slug: 'Vehicles', color: 'from-slate-500 to-slate-700' },
  { name: 'Fashion', slug: 'Fashion', color: 'from-pink-500 to-rose-600' },
  { name: 'Property', slug: 'Property', color: 'from-green-500 to-emerald-600' },
  { name: 'Home & Garden', slug: 'Home', color: 'from-lime-500 to-green-600' },
  { name: 'Sports', slug: 'Sports', color: 'from-cyan-500 to-blue-600' },
]

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest')
  const [searchTimeout, setSearchTimeout] = useState<any>(null)

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory) params.set('category', activeCategory)
      if (search) params.set('search', search)
      params.set('limit', '60')

      const res = await fetch('/api/marketplace/listings?' + params.toString())
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } finally { setLoading(false) }
  }

  const fetchCartCount = async () => {
    try {
      const res = await fetch('/api/marketplace/cart')
      if (res.ok) {
        const data = await res.json()
        setCartCount(data.summary?.itemCount || 0)
      }
    } catch {}
  }

  useEffect(() => { fetchListings() }, [activeCategory])
  useEffect(() => { fetchCartCount() }, [])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => fetchListings(), 500))
  }

  const sorted = [...listings].sort((a, b) => {
    if (sortBy === 'priceAsc') return Number(a.price) - Number(b.price)
    if (sortBy === 'priceDesc') return Number(b.price) - Number(a.price)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3 flex-shrink-0">
              <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={36} height={36} className="rounded-xl object-cover" />
              <div className="hidden md:block">
                <p className="font-bold text-white text-sm leading-tight">WaveMarket</p>
                <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Verified Sellers
                </p>
              </div>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search millions of products..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/wavecore-erp/marketplace/seller" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold">
                <Store className="w-3 h-3" /> Seller Hub
              </Link>
              <Link href="/wavecore-erp/marketplace/orders" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold">
                <Package className="w-3 h-3" /> Orders
              </Link>
              <Link href="/wavecore-erp/marketplace/inbox" className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white relative">
                <MessageCircle className="w-4 h-4" />
              </Link>
              <Link href="/wavecore-erp/marketplace/cart" className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white relative">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/wavecore-erp/marketplace/sell" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-1">
                <Plus className="w-3 h-3" /> Sell
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-6 lg:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl opacity-20" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4">
              <Route className="w-3 h-3" /> Smart routing — nearest seller always wins
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-3">
              Shop billions of items<br />from verified sellers near you
            </h1>
            <p className="text-white/80 text-sm lg:text-base mb-6 max-w-2xl">
              WaveMarket finds the nearest, cheapest, or most trusted seller for every item in your cart. AI-powered routing, buyer protection, and instant M-Pesa checkout.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/wavecore-erp/marketplace/cart" className="px-5 py-3 rounded-xl bg-white text-cyan-700 font-bold flex items-center gap-2 shadow-lg">
                <ShoppingCart className="w-4 h-4" /> View Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link href="/wavecore-erp/marketplace/sell" className="px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Store className="w-4 h-4" /> Become a Seller
              </Link>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Zap className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-sm font-bold text-white">Fastest delivery</p>
            <p className="text-xs text-neutral-500">Nearest seller routing</p>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Shield className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm font-bold text-white">Buyer protection</p>
            <p className="text-xs text-neutral-500">Full money-back guarantee</p>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <BadgeCheck className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-sm font-bold text-white">Verified sellers</p>
            <p className="text-xs text-neutral-500">WaveTrust reputation system</p>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-sm font-bold text-white">AI-powered shopping</p>
            <p className="text-xs text-neutral-500">Smart recommendations</p>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" /> Browse Categories
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            <button
              onClick={() => setActiveCategory('')}
              className={'p-4 rounded-2xl text-center transition-all ' + (activeCategory === '' ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white scale-105' : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500')}
            >
              <Sparkles className="w-5 h-5 mx-auto mb-1" />
              <p className="text-[10px] font-bold">All</p>
            </button>
            {TOP_CATEGORIES.map(c => (
              <button
                key={c.slug}
                onClick={() => setActiveCategory(c.slug)}
                className={'p-4 rounded-2xl text-center transition-all bg-gradient-to-br ' + c.color + ' text-white ' + (activeCategory === c.slug ? 'ring-4 ring-white/30 scale-105' : 'hover:scale-105')}
              >
                <Tag className="w-5 h-5 mx-auto mb-1" />
                <p className="text-[10px] font-bold truncate">{c.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Listings header */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            {activeCategory ? `${activeCategory} (${sorted.length})` : `Featured (${sorted.length})`}
          </h2>
          <div className="flex gap-2 items-center">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs">
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
            </select>
            <button onClick={() => { setActiveCategory(''); setSearch(''); fetchListings() }} className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-10 h-10 animate-spin mx-auto text-cyan-500" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No listings match your search</p>
            <Link href="/wavecore-erp/marketplace/sell" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Be the first to list
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map(l => (
              <Link key={l.id} href={'/wavecore-erp/marketplace/listing/' + l.id} className="group bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-cyan-600 hover:shadow-2xl transition-all overflow-hidden">
                <div className="aspect-square bg-neutral-800 relative overflow-hidden">
                  {l.images?.[0] ? (
                    <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-neutral-700" />
                    </div>
                  )}
                  {l.stock > 0 && l.stock <= 3 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold">
                      Only {l.stock} left
                    </span>
                  )}
                  {l.condition && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-bold uppercase">
                      {l.condition}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-white truncate mb-1">{l.title}</p>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-2">
                    <Store className="w-3 h-3" />
                    <span className="truncate">{l.storeName || l.sellerName || 'Seller'}</span>
                  </div>
                  {l.location && (
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-2">
                      <MapPin className="w-3 h-3" /> {l.location}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-800">
                    <span className="text-lg font-bold text-amber-400">KES {Number(l.price).toLocaleString()}</span>
                    <span className="text-[10px] text-neutral-500">Views {l.views || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}