'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Sliders, Store, MapPin, ChevronLeft, Grid3x3, List, X } from 'lucide-react'
import SearchBar from '@/components/marketplace/SearchBar'
import FiltersPanel from '@/components/marketplace/FiltersPanel'

function SearchResultsInner() {
  const params = useSearchParams()
  const router = useRouter()
  const q = params.get('q') || ''
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<any>({
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    condition: params.get('condition') || '',
    location: params.get('location') || '',
    minRating: params.get('minRating') || '',
    inStock: params.get('inStock') === 'true',
  })

  const fetchResults = async () => {
    setLoading(true)
    try {
      const search = new URLSearchParams()
      search.set('q', q)
      search.set('sort', sort)
      if (filters.minPrice) search.set('minPrice', filters.minPrice)
      if (filters.maxPrice) search.set('maxPrice', filters.maxPrice)
      if (filters.condition) search.set('condition', filters.condition)
      if (filters.location) search.set('location', filters.location)
      if (filters.minRating) search.set('minRating', filters.minRating)
      if (filters.inStock) search.set('inStock', 'true')
      search.set('limit', '60')

      const res = await fetch(`/api/marketplace/search?${search.toString()}`)
      if (res.ok) {
        const d = await res.json()
        setListings(d.listings || [])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchResults() }, [q, sort, filters])

  const activeFilterCount = [
    filters.minPrice, filters.maxPrice, filters.condition, filters.location, filters.minRating, filters.inStock
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold text-white flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <SearchBar initialValue={q} autoNavigate={false} onSearch={newQ => router.push(`/marketplace/search?q=${encodeURIComponent(newQ)}`)} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">
              {q ? `Results for "${q}"` : 'Browse listings'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">{listings.length} result{listings.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFilters(true)}
              className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-bold flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="popular">Most popular</option>
              <option value="rating">Top rated</option>
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

        {activeFilterCount > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {filters.minPrice && <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs">Min: {filters.minPrice}</span>}
            {filters.maxPrice && <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs">Max: {filters.maxPrice}</span>}
            {filters.condition && <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs">{filters.condition}</span>}
            {filters.location && <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs">📍 {filters.location}</span>}
            {filters.minRating && <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs">{filters.minRating}★+</span>}
            {filters.inStock && <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs">In stock</span>}
            <button onClick={() => setFilters({})} className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 text-xs hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 mx-auto mb-4 text-neutral-700" />
            <p className="text-lg font-bold text-white mb-1">No results</p>
            <p className="text-sm text-neutral-500 mb-4">Try different keywords or clear filters</p>
            <Link href="/marketplace" className="inline-block px-5 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm">Browse All</Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
            {listings.map(l => (
              <Link key={l.id} href={`/marketplace/listing/${l.id}`} className={`group bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-amber-500/50 overflow-hidden transition-all ${viewMode === 'list' ? 'flex gap-4 p-3' : ''}`}>
                <div className={viewMode === 'grid' ? 'aspect-square relative bg-neutral-800' : 'w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800'}>
                  {l.images?.[0] ? (
                    <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Store className="w-8 h-8 text-neutral-700" /></div>
                  )}
                </div>
                <div className={viewMode === 'grid' ? 'p-3' : 'flex-1 min-w-0 py-1'}>
                  <p className="text-sm font-bold text-white truncate">{l.title}</p>
                  <p className="text-lg font-bold text-amber-400 mt-1">KES {Number(l.price).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                    {l.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{l.location}</span>}
                    {l.condition && <span>· {l.condition}</span>}
                  </div>
                  {l.sellerName && <p className="text-xs text-neutral-400 mt-1 truncate">{l.sellerName}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showFilters && (
        <FiltersPanel
          filters={filters}
          onApply={(f) => { setFilters(f); setShowFilters(false) }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  )
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
      <SearchResultsInner />
    </Suspense>
  )
}