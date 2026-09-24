'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search, ShoppingCart, Store, Plus, MapPin, Heart, MessageCircle,
  Sparkles, Shield, BadgeCheck, TrendingUp, Zap, Package, Tag,
  ChevronRight, Star, Truck, Clock, Users, Award, Flame, Percent,
  ArrowRight, Grid3x3, List, Filter, X,
} from 'lucide-react'

const TOP_CATEGORIES = [
  { name: 'Electronics', slug: 'Electronics', emoji: '💻', color: 'from-blue-500 to-indigo-600' },
  { name: 'Mobile Phones', slug: 'Mobile Phones', emoji: '📱', color: 'from-teal-500 to-emerald-600' },
  { name: 'Furniture', slug: 'Furniture', emoji: '🛋️', color: 'from-orange-500 to-amber-600' },
  { name: 'Vehicles', slug: 'Vehicles', emoji: '🚗', color: 'from-slate-500 to-slate-700' },
  { name: 'Fashion', slug: 'Fashion', emoji: '👕', color: 'from-pink-500 to-rose-600' },
  { name: 'Property', slug: 'Property', emoji: '🏠', color: 'from-green-500 to-emerald-600' },
  { name: 'Home', slug: 'Home', emoji: '🏡', color: 'from-lime-500 to-green-600' },
  { name: 'Sports', slug: 'Sports', emoji: '⚽', color: 'from-cyan-500 to-blue-600' },
]

export default function PublicMarketplacePage() {
  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'popular'>('newest')
  const [session, setSession] = useState<any>(null)
  const [searchTimeout, setSearchTimeout] = useState<any>(null)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    fetch('/api/wavecore/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(d => setSession(d))
      .catch(() => {})
  }, [])

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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/marketplace/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {}
  }

  useEffect(() => { fetchListings() }, [activeCategory])
  useEffect(() => { fetchCategories() }, [])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => fetchListings(), 400))
  }

  const sorted = [...listings].sort((a, b) => {
    if (sortBy === 'priceAsc') return Number(a.price) - Number(b.price)
    if (sortBy === 'priceDesc') return Number(b.price) - Number(a.price)
    if (sortBy === 'popular') return Number(b.views || 0) - Number(a.views || 0)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const goToSell = () => {
    if (session) window.location.href = '/wavecore-erp/marketplace/sell'
    else window.location.href = '/wavecore-erp/auth/login?redirect=/wavecore-erp/marketplace/sell'
  }

  const goToCart = () => {
    if (session) window.location.href = '/wavecore-erp/marketplace/cart'
    else window.location.href = '/wavecore-erp/auth/login?redirect=/wavecore-erp/marketplace/cart'
  }

  // Featured / trending (most viewed)
  const trending = [...listings].sort((a, b) => Number(b.views || 0) - Number(a.views || 0)).slice(0, 4)

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs py-2 px-4 text-center font-bold">
        🚀 Free shipping on orders over KES 5,000 · Buyer protection guaranteed · Trusted by 50,000+ Kenyans
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-neutral-900/98 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Link href="/marketplace" className="flex items-center gap-2 flex-shrink-0">
              <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={40} height={40} className="rounded-xl object-cover" />
              <div className="hidden md:block">
                <p className="font-bold text-white text-base leading-tight">WaveMarket</p>
                <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Verified Marketplace
                </p>
              </div>
            </Link>

            {/* Location */}
            <button className="hidden lg:flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-neutral-800 text-neutral-300 text-xs">
              <MapPin className="w-3 h-3" /> Deliver to Nairobi
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-3xl relative">
              <div className="flex">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    onFocus={() => setShowSearchSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                    placeholder="Search millions of products from verified sellers..."
                    className="w-full pl-11 pr-4 py-3 rounded-l-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <button onClick={fetchListings} className="px-6 rounded-r-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Search suggestions dropdown */}
              {showSearchSuggestions && search && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
                  {sorted.slice(0, 5).map(l => (
                    <Link
                      key={l.id}
                      href={'/wavecore-erp/marketplace/listing/' + l.id}
                      className="flex items-center gap-3 p-3 hover:bg-neutral-800 border-b border-neutral-800 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                        {l.images?.[0] && <img src={l.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{l.title}</p>
                        <p className="text-xs text-neutral-500">KES {Number(l.price).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link href={session ? "/wavecore-erp/marketplace/inbox" : "/wavecore-erp/auth/login"} className="p-2.5 rounded-xl hover:bg-neutral-800 text-neutral-300 relative">
                <MessageCircle className="w-5 h-5" />
              </Link>
              <button onClick={goToCart} className="p-2.5 rounded-xl hover:bg-neutral-800 text-neutral-300 relative">
                <ShoppingCart className="w-5 h-5" />
              </button>
              <Link href={session ? "/wavecore-erp/marketplace/seller" : "/wavecore-erp/auth/login"} className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-neutral-300 text-xs font-bold">
                <Store className="w-4 h-4" /> Seller Hub
              </Link>
              <button onClick={goToSell} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> Sell
              </button>
              {session ? (
                <Link href="/wavecore-erp" className="p-2.5 rounded-xl hover:bg-neutral-800 text-neutral-300">
                  <Users className="w-5 h-5" />
                </Link>
              ) : (
                <Link href="/wavecore-erp/auth/login" className="px-3 py-2.5 rounded-xl bg-white text-neutral-900 text-xs font-bold">
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Category nav */}
          <div className="flex items-center gap-1 h-11 overflow-x-auto border-t border-neutral-800">
            <button
              onClick={() => setActiveCategory('')}
              className={'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ' + (activeCategory === '' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800')}
            >
              <Flame className="w-3 h-3 inline mr-1" /> All Deals
            </button>
            {TOP_CATEGORIES.map(c => (
              <button
                key={c.slug}
                onClick={() => setActiveCategory(c.slug)}
                className={'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ' + (activeCategory === c.slug ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800')}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6">
        {/* HERO */}
        {!activeCategory && !search && (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-4 mb-8">
            {/* Main hero */}
            <div className="rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-6 lg:p-10 relative overflow-hidden min-h-[320px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500 rounded-full blur-3xl opacity-20" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full blur-3xl opacity-15" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4 backdrop-blur">
                  <Zap className="w-3 h-3" /> AI-Powered Smart Routing
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                  Shop from millions of sellers.<br />
                  <span className="text-amber-300">Delivered by the nearest one.</span>
                </h1>
                <p className="text-white/80 text-sm lg:text-base mb-6 max-w-2xl">
                  Kenya's smartest marketplace. WaveMarket automatically finds the fastest, cheapest, or most trusted seller for every item in your cart.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="#browse" className="px-6 py-3 rounded-xl bg-white text-cyan-700 font-bold flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all">
                    <Sparkles className="w-4 h-4" /> Start Shopping
                  </Link>
                  <button onClick={goToSell} className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold flex items-center gap-2">
                    <Store className="w-4 h-4" /> Become a Seller
                  </button>
                </div>
              </div>
            </div>

            {/* Side cards */}
            <div className="grid grid-rows-2 gap-4">
              <div className="rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 p-5 relative overflow-hidden">
                <Percent className="absolute top-3 right-3 w-16 h-16 text-white/20" />
                <div className="relative">
                  <span className="px-2 py-0.5 rounded-full bg-white/30 text-white text-[10px] font-bold">LIMITED TIME</span>
                  <h3 className="text-white text-2xl font-bold mt-2">Up to 40% off</h3>
                  <p className="text-white/90 text-xs mt-1 mb-3">on electronics and gadgets</p>
                  <button onClick={() => setActiveCategory('Electronics')} className="text-white text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Shop now <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 relative overflow-hidden">
                <Award className="absolute top-3 right-3 w-16 h-16 text-white/20" />
                <div className="relative">
                  <span className="px-2 py-0.5 rounded-full bg-white/30 text-white text-[10px] font-bold">VERIFIED SELLERS</span>
                  <h3 className="text-white text-2xl font-bold mt-2">Trusted Marketplace</h3>
                  <p className="text-white/90 text-xs mt-1 mb-3">Every seller vetted by WaveTrust</p>
                  <Link href="/marketplace/categories" className="text-white text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
                    Explore categories <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRUST STRIP */}
        {!activeCategory && !search && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-900/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Fastest delivery</p>
                <p className="text-[10px] text-neutral-500">Nearest seller routing</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-900/40 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">100% protected</p>
                <p className="text-[10px] text-neutral-500">Full money-back guarantee</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-900/40 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Verified sellers</p>
                <p className="text-[10px] text-neutral-500">WaveTrust reputation</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-900/40 flex items-center justify-center">
                <Truck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">M-Pesa checkout</p>
                <p className="text-[10px] text-neutral-500">Instant & secure</p>
              </div>
            </div>
          </div>
        )}

        {/* TOP CATEGORIES */}
        {!search && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-amber-400" /> Top Categories
              </h2>
              <Link href="/marketplace/categories" className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {TOP_CATEGORIES.map(c => (
                <button
                  key={c.slug}
                  onClick={() => setActiveCategory(c.slug)}
                  className={'group p-4 rounded-2xl bg-gradient-to-br text-white text-center transition-all hover:scale-105 ' + c.color + ' ' + (activeCategory === c.slug ? 'ring-4 ring-white/30' : '')}
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{c.emoji}</div>
                  <p className="text-[11px] font-bold leading-tight">{c.name}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* TRENDING */}
        {!activeCategory && !search && trending.length > 0 && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Trending Now
              </h2>
              <span className="text-xs text-neutral-500">Most viewed this week</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trending.map(l => (
                <Link key={l.id} href={'/wavecore-erp/marketplace/listing/' + l.id} className="group bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-orange-500 hover:shadow-2xl transition-all overflow-hidden">
                  <div className="aspect-square bg-neutral-800 relative overflow-hidden">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-neutral-700" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> HOT
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-white truncate mb-1">{l.title}</p>
                    <p className="text-lg font-bold text-amber-400">KES {Number(l.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* BROWSE */}
        <section id="browse">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                {activeCategory ? `${activeCategory} (${sorted.length})` : search ? `Results for "${search}" (${sorted.length})` : `All Listings (${sorted.length})`}
              </h2>
              {search && (
                <button onClick={() => { setSearch(''); fetchListings() }} className="mt-1 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear search
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs">
                <option value="newest">Newest first</option>
                <option value="popular">Most popular</option>
                <option value="priceAsc">Price: Low → High</option>
                <option value="priceDesc">Price: High → Low</option>
              </select>
              <div className="flex gap-1 bg-neutral-800 rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={'p-1.5 rounded-lg ' + (viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-neutral-400')}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={'p-1.5 rounded-lg ' + (viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-neutral-400')}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-neutral-800"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-neutral-800 rounded"></div>
                    <div className="h-4 bg-neutral-800 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900 rounded-3xl border border-neutral-800">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20 text-neutral-400" />
              <p className="text-neutral-400 mb-4 text-lg">No listings match</p>
              <p className="text-sm text-neutral-500 mb-6">Be the first to sell this kind of item on WaveMarket</p>
              <button onClick={goToSell} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> List an Item
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {sorted.map(l => (
                <Link key={l.id} href={'/wavecore-erp/marketplace/listing/' + l.id} className="group bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-amber-500 hover:shadow-2xl transition-all overflow-hidden flex flex-col">
                  <div className="aspect-square bg-neutral-800 relative overflow-hidden">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-white text-[9px] font-bold uppercase">
                        {l.condition}
                      </span>
                    )}
                    <button className="absolute bottom-2 right-2 p-2 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-sm font-bold text-white line-clamp-2 mb-1">{l.title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-2">
                      <Store className="w-3 h-3" />
                      <span className="truncate">{l.storeName || l.sellerName || 'Seller'}</span>
                    </div>
                    {l.location && (
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-2">
                        <MapPin className="w-3 h-3" /> {l.location}
                      </div>
                    )}
                    <div className="mt-auto pt-2 border-t border-neutral-800 flex justify-between items-center">
                      <span className="text-base font-bold text-amber-400">KES {Number(l.price).toLocaleString()}</span>
                      {l.averageRating > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-500">
                          <Star className="w-3 h-3 fill-yellow-500" /> {l.averageRating}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map(l => (
                <Link key={l.id} href={'/wavecore-erp/marketplace/listing/' + l.id} className="group flex gap-4 p-4 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-amber-500 transition-all">
                  <div className="w-32 h-32 rounded-xl bg-neutral-800 overflow-hidden flex-shrink-0">
                    {l.images?.[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-neutral-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-white mb-1 group-hover:text-amber-400">{l.title}</p>
                    <p className="text-sm text-neutral-400 line-clamp-2 mb-3">{l.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mb-3">
                      <span className="flex items-center gap-1"><Store className="w-3 h-3" />{l.storeName || l.sellerName || 'Seller'}</span>
                      {l.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.location}</span>}
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{l.category}</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">KES {Number(l.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* TRUST SECTION */}
        <section className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Why Kenya shops on WaveMarket</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white font-bold mb-1">Lightning fast</h3>
              <p className="text-xs text-neutral-500">Nearest seller always wins</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white font-bold mb-1">100% protected</h3>
              <p className="text-xs text-neutral-500">Money-back guarantee</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                <BadgeCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white font-bold mb-1">Verified sellers</h3>
              <p className="text-xs text-neutral-500">Vetted by WaveTrust</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-3">
                <Store className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white font-bold mb-1">Sell anything</h3>
              <p className="text-xs text-neutral-500">Big brands to small shops</p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-800 bg-neutral-950 mt-16">
        <div className="max-w-[1600px] mx-auto px-4 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={32} height={32} className="rounded-lg" />
                <span className="font-bold text-white">WaveMarket</span>
              </div>
              <p className="text-xs text-neutral-500">Kenya's smartest marketplace. Shop from millions of sellers, delivered by the nearest one.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Shop</h4>
              <ul className="space-y-2 text-xs text-neutral-500">
                <li><Link href="/marketplace" className="hover:text-white">All categories</Link></li>
                <li><Link href="/marketplace/categories" className="hover:text-white">Browse categories</Link></li>
                <li><Link href="/marketplace/saved" className="hover:text-white">Saved items</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Sell</h4>
              <ul className="space-y-2 text-xs text-neutral-500">
                <li><button onClick={goToSell} className="hover:text-white">Start selling</button></li>
                <li><Link href="/wavecore-erp/marketplace/seller" className="hover:text-white">Seller hub</Link></li>
                <li><Link href="/wavecore-erp/marketplace/seller/wallet" className="hover:text-white">Wallet & payouts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-xs text-neutral-500">
                <li><Link href="/wavecore-erp/auth/login" className="hover:text-white">Sign in</Link></li>
                <li><Link href="/wavecore-erp/auth/signup" className="hover:text-white">Create account</Link></li>
                <li><Link href="/wavecore-erp/helpdesk" className="hover:text-white">Help center</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-6 text-center text-xs text-neutral-600">
            © {new Date().getFullYear()} IntelliWavve · WaveMarket · All rights reserved
          </div>
        </div>
      </footer>
    </div>
  )
}