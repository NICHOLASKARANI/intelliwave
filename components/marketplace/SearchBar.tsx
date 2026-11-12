'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Clock, Flame, Loader2 } from 'lucide-react'

interface SearchBarProps {
  initialValue?: string
  onSearch?: (query: string) => void
  placeholder?: string
  autoNavigate?: boolean
}

export default function SearchBar({ initialValue = '', onSearch, placeholder = 'Search millions of products from verified sellers...', autoNavigate = true }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [live, setLive] = useState<any[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [trending, setTrending] = useState<string[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const debounceRef = useRef<any>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions on query change
  useEffect(() => {
    if (!query || query.length < 2) {
      setLive([]); setRecent([]); setTrending([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/marketplace/search/suggest?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const d = await res.json()
          setLive(d.live || [])
          setRecent(d.recent || [])
          setTrending(d.trending || [])
          setHistoryLoaded(true)
        }
      } finally { setLoading(false) }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Click outside closes dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const submitSearch = (q: string) => {
    const term = q.trim()
    if (!term) return
    setShowDropdown(false)
    if (onSearch) onSearch(term)
    if (autoNavigate) {
      window.location.href = `/marketplace/search?q=${encodeURIComponent(term)}`
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitSearch(query)
  }

  const hasDropdownContent = live.length > 0 || recent.length > 0 || trending.length > 0

  return (
    <div ref={wrapperRef} className="flex-1 max-w-3xl relative">
      <form onSubmit={handleSubmit} className="flex">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-3 rounded-l-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
        <button type="submit" className="px-6 rounded-r-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold">
          <Search className="w-4 h-4" />
        </button>
      </form>

      {showDropdown && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            </div>
          ) : (
            <>
              {/* Live product matches */}
              {live.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] uppercase font-bold text-neutral-500 bg-neutral-950/50">Products</div>
                  {live.map(l => (
                    <Link
                      key={l.listingId}
                      href={`/marketplace/listing/${l.listingId}`}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-800 border-b border-neutral-800 last:border-0"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
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

              {/* Recent */}
              {recent.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] uppercase font-bold text-neutral-500 bg-neutral-950/50 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Recent searches
                  </div>
                  {recent.map(r => (
                    <button
                      key={r}
                      onClick={() => { setQuery(r); submitSearch(r) }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 text-sm text-neutral-300 border-b border-neutral-800 last:border-0"
                    >
                      <Clock className="w-3 h-3 text-neutral-500" /> {r}
                    </button>
                  ))}
                </div>
              )}

              {/* Trending */}
              {trending.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] uppercase font-bold text-orange-400 bg-neutral-950/50 flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5" /> Trending
                  </div>
                  {trending.map(t => (
                    <button
                      key={t}
                      onClick={() => { setQuery(t); submitSearch(t) }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 text-sm text-neutral-300 border-b border-neutral-800 last:border-0"
                    >
                      <Flame className="w-3 h-3 text-orange-500" /> {t}
                    </button>
                  ))}
                </div>
              )}

              {!hasDropdownContent && historyLoaded && (
                <div className="p-4 text-center text-xs text-neutral-500">
                  No matches found — try a different search
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}