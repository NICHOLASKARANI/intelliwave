'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Shield, Lock, Search, Loader2, Trash2, Eye, EyeOff, AlertTriangle,
  CheckCircle2, X, Ban, Flag, Image as ImageIcon, Download,
  Filter, RefreshCw, Activity, KeyRound, ArrowLeft, User, MapPin, Star,
    Store, Users as UsersIcon, FileText, MessageSquareOff,
} from 'lucide-react'

const SESSION_KEY = 'wavvemarket_admin_session'

type TabId = 'listings' | 'reviews' | 'sellers'

export default function MarketplaceModerationPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('listings')

  // ===== LISTINGS STATE =====
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'WITH_IMAGES' | 'FLAGGED' | 'BLOCKED'>('ALL')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [actionMessage, setActionMessage] = useState('')

  // ===== REVIEWS STATE =====
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewKpi, setReviewKpi] = useState({ total: 0, reported: 0, hidden: 0, flagged: 0 })
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'REPORTED' | 'HIDDEN' | 'FLAGGED'>('ALL')
  const [reviewModerating, setReviewModerating] = useState<any | null>(null)
  const [reviewModAction, setReviewModAction] = useState<'hide' | 'show' | 'flag' | 'delete'>('hide')
  const [reviewModReason, setReviewModReason] = useState('')
  const [reviewModNote, setReviewModNote] = useState('')
  const [reviewActioning, setReviewActioning] = useState<string | null>(null)
  const [reviewMessage, setReviewMessage] = useState('')

  // ===== SELLERS STATE =====
  const [sellers, setSellers] = useState<any[]>([])
  const [sellerKpi, setSellerKpi] = useState({ total: 0, verified: 0, trusted: 0, ready: 0 })
  const [sellersLoading, setSellersLoading] = useState(false)
  const [sellerSearch, setSellerSearch] = useState('')
  const [sellerFilter, setSellerFilter] = useState<'ALL' | 'VERIFIED' | 'TRUSTED' | 'UNVERIFIED' | 'SUSPENDED' | 'READY'>('ALL')
  const [sellerActioning, setSellerActioning] = useState<string | null>(null)
  const [sellerMessage, setSellerMessage] = useState('')

  // ===== AUTH =====
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved === 'true') {
      setAuthenticated(true)
      fetchListings()
    }
  }, [])

  const handleLogin = async () => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const res = await fetch('/api/marketplace/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAuthenticated(true)
        sessionStorage.setItem(SESSION_KEY, 'true')
        fetchListings()
      } else {
        setAuthError(data.error || 'Access Denied')
      }
    } catch {
      setAuthError('Network error')
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
    setPassword('')
    setListings([])
    setReviews([])
  }

  // ===== LISTINGS LOGIC =====
  const fetchListings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/listings?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } finally { setLoading(false) }
  }

  const logAction = (action: string, target: string) => {
    setActivityLog(prev => [{ action, target, ts: Date.now() }, ...prev].slice(0, 50))
  }

  const deleteListing = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id.toString())
    try {
      const res = await fetch(`/api/marketplace/listings?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setListings(prev => prev.filter(l => l.id !== id))
        logAction('Deleted listing', title)
        setActionMessage(`Deleted "${title}"`)
        setTimeout(() => setActionMessage(''), 3000)
      } else {
        const d = await res.json()
        alert(d.error || 'Failed')
      }
    } finally { setDeleting(null) }
  }

  const toggleExpand = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const removeImage = async (listingId: number, imageIndex: number) => {
    if (!confirm('Remove this image?')) return
    const listing = listings.find(l => l.id === listingId)
    if (!listing) return
    const newImages = (listing.images || []).filter((_: any, i: number) => i !== imageIndex)
    try {
      const res = await fetch(`/api/marketplace/listings?id=${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newImages }),
      })
      if (res.ok) {
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, images: newImages } : l))
        logAction('Removed image', listing.title)
      }
    } catch {}
  }

  const filteredListings = useMemo(() => {
    let list = listings
    if (filter === 'WITH_IMAGES') list = list.filter(l => l.images?.length > 0)
    if (filter === 'FLAGGED') list = list.filter(l => l.status === 'FLAGGED')
    if (filter === 'BLOCKED') list = list.filter(l => l.status === 'BLOCKED')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        (l.title || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.sellerName || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [listings, filter, search])

  // ===== REVIEWS LOGIC =====
  const fetchReviews = async () => {
    setReviewsLoading(true)
    try {
      const url = `/api/marketplace/admin/reviews?filter=${reviewFilter}&search=${encodeURIComponent(reviewSearch)}&limit=100`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setReviewKpi(data.kpi || { total: 0, reported: 0, hidden: 0, flagged: 0 })
      }
    } finally { setReviewsLoading(false) }
  }

  useEffect(() => {
    if (authenticated && activeTab === 'reviews' && reviews.length === 0) {
      fetchReviews()
    }
  }, [authenticated, activeTab])

  useEffect(() => {
    if (authenticated && activeTab === 'reviews') fetchReviews()
  }, [reviewFilter])

  const openReviewModeration = (r: any, action: 'hide' | 'show' | 'flag' | 'delete') => {
    setReviewModerating(r)
    setReviewModAction(action)
    setReviewModReason('')
    setReviewModNote('')
  }

  const submitReviewModeration = async () => {
    if (!reviewModerating) return
    setReviewActioning(reviewModerating.id)
    try {
      const body: any = { action: reviewModAction }
      if (reviewModReason) body.reason = reviewModReason
      if (reviewModNote) body.note = reviewModNote

      const res = await fetch(`/api/marketplace/reviews/${reviewModerating.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setReviewMessage(`Review ${reviewModAction}d`)
        setReviewModerating(null)
        fetchReviews()
        setTimeout(() => setReviewMessage(''), 3000)
      } else {
        const d = await res.json()
        setReviewMessage(d.error || 'Failed')
      }
    } finally { setReviewActioning(null) }
  }

  const filteredReviews = useMemo(() => {
    let list = reviews
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase()
      list = list.filter(r =>
        (r.reviewerName || '').toLowerCase().includes(q) ||
        (r.listingTitle || '').toLowerCase().includes(q) ||
        (r.body || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [reviews, reviewSearch])

  // ===== SELLERS LOGIC =====
  const fetchSellers = async () => {
    setSellersLoading(true)
    try {
      const url = `/api/marketplace/admin/sellers?filter=${sellerFilter}&search=${encodeURIComponent(sellerSearch)}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSellers(data.sellers || [])
        setSellerKpi(data.kpi || { total: 0, verified: 0, trusted: 0, ready: 0 })
      }
    } finally { setSellersLoading(false) }
  }

  useEffect(() => {
    if (authenticated && activeTab === 'sellers') fetchSellers()
  }, [authenticated, activeTab, sellerFilter])

  const sellerAction = async (sellerId: string, action: string) => {
    setSellerActioning(sellerId)
    try {
      const res = await fetch('/api/marketplace/admin/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, action }),
      })
      if (res.ok) {
        setSellerMessage(`Seller ${action}ed`)
        fetchSellers()
        setTimeout(() => setSellerMessage(''), 3000)
      } else {
        const d = await res.json()
        setSellerMessage(d.error || 'Failed')
      }
    } finally { setSellerActioning(null) }
  }

  const filteredSellers = useMemo(() => {
    let list = sellers
    if (sellerSearch.trim()) {
      const q = sellerSearch.toLowerCase()
      list = list.filter(s =>
        (s.storeName || '').toLowerCase().includes(q) ||
        (s.ownerName || '').toLowerCase().includes(q) ||
        (s.ownerEmail || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [sellers, sellerSearch])

  // ===== RENDER =====
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-8 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Marketplace Moderation</h1>
            <p className="text-xs text-neutral-400">CEO Console · Listings, Reviews, Sellers, Users</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Admin password"
            className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white mb-3"
            autoFocus
          />
          {authError && (
            <p className="text-xs text-red-400 mb-3 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {authError}
            </p>
          )}
          <button
            onClick={handleLogin}
            disabled={authLoading || !password}
            className="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {authLoading ? 'Verifying...' : 'Unlock'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp" className="flex items-center gap-2">
              <Image src="/images/Wavecore.jpeg" alt="" width={32} height={32} className="rounded-lg" />
              <div>
                <p className="text-sm font-bold">Marketplace Moderation</p>
                <p className="text-[10px] text-neutral-500">CEO Console</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Authenticated
            </span>
            <button
              onClick={activeTab === 'listings' ? fetchListings : fetchReviews}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${(activeTab === 'listings' ? loading : reviewsLoading) ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={logout} className="px-3 py-2 rounded-xl bg-red-900/40 text-red-300 text-xs font-bold hover:bg-red-800">
              Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 border-t border-neutral-800">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'listings'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Listings
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'reviews'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Reviews
          </button>
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'sellers'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Sellers
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* ============ TAB: LISTINGS ============ */}
        {activeTab === 'listings' && (
          <>
            {actionMessage && (
              <div className="p-3 rounded-xl bg-green-900/50 text-green-300 border border-green-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {actionMessage}
              </div>
            )}

            {/* Listings KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                <Activity className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{listings.length}</p>
                <p className="text-xs opacity-80">Total Listings</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
                <ImageIcon className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{listings.filter(l => l.images?.length > 0).length}</p>
                <p className="text-xs opacity-80">With Images</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-red-800 text-white">
                <Flag className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{listings.filter(l => l.status === 'FLAGGED').length}</p>
                <p className="text-xs opacity-80">Flagged</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white">
                <Ban className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{listings.filter(l => l.status === 'BLOCKED').length}</p>
                <p className="text-xs opacity-80">Blocked</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search title, category, seller..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                />
              </div>
              <div className="flex gap-1 bg-neutral-800 rounded-xl p-1">
                {(['ALL', 'WITH_IMAGES', 'FLAGGED', 'BLOCKED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === f ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <span className="text-xs text-neutral-500">{filteredListings.length} shown</span>
            </div>

            {/* Listings list */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No listings match</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map(listing => {
                  const imgCount = (listing.images || []).length
                  const isExpanded = !!expanded[listing.id]
                  return (
                    <div key={listing.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                      <div className="p-5 flex items-start gap-4">
                        {imgCount > 0 ? (
                          <img src={listing.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-neutral-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-lg font-bold text-white">{listing.title}</h3>
                            {listing.status === 'BLOCKED' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/40 text-red-300">BLOCKED</span>}
                            {listing.status === 'FLAGGED' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-900/40 text-orange-300">FLAGGED</span>}
                            {listing.status === 'ACTIVE' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/40 text-green-300">ACTIVE</span>}
                          </div>
                          <p className="text-sm text-neutral-400">
                            {listing.category || 'Uncategorized'} · KES {Number(listing.price || 0).toLocaleString()} · {listing.condition || 'N/A'}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mt-1">
                            {listing.sellerName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{listing.sellerName}</span>}
                            {listing.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location}</span>}
                            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{imgCount} image{imgCount !== 1 ? 's' : ''}</span>
                            <span>Views: {listing.views || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {imgCount > 0 && (
                            <button
                              onClick={() => toggleExpand(listing.id)}
                              className="p-2.5 rounded-xl bg-blue-900/40 text-blue-300 hover:bg-blue-800"
                              title={isExpanded ? 'Hide images' : 'Show images'}
                            >
                              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => deleteListing(listing.id, listing.title)}
                            disabled={deleting === listing.id.toString()}
                            className="p-2.5 rounded-xl bg-red-900/40 text-red-300 hover:bg-red-800 disabled:opacity-50"
                            title="Delete listing"
                          >
                            {deleting === listing.id.toString() ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && imgCount > 0 && (
                        <div className="px-5 pb-5 border-t border-neutral-800 pt-4">
                          <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wide font-bold">Images ({imgCount})</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(listing.images || []).map((img: string, i: number) => (
                              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700 group">
                                <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                                    title="View full size"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={() => removeImage(listing.id, i)}
                                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                    title="Remove this image"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                                  #{i + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Activity log */}
            {activityLog.length > 0 && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-red-400 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Session Activity Log
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {activityLog.map((log, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-neutral-800/50 last:border-0">
                      <span className="text-neutral-300">{log.action}</span>
                      <span className="text-neutral-500">{log.target}</span>
                      <span className="text-neutral-600">{new Date(log.ts).toLocaleTimeString('en-GB')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ TAB: REVIEWS ============ */}
        {activeTab === 'reviews' && (
          <>
            {reviewMessage && (
              <div className="p-3 rounded-xl bg-green-900/50 text-green-300 border border-green-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {reviewMessage}
              </div>
            )}

            {/* Reviews KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white">
                <FileText className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{reviewKpi.total}</p>
                <p className="text-xs opacity-80">Total Reviews</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white">
                <Flag className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{reviewKpi.reported}</p>
                <p className="text-xs opacity-80">Reported</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-orange-800 text-white">
                <EyeOff className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{reviewKpi.hidden}</p>
                <p className="text-xs opacity-80">Hidden</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-800 text-white">
                <AlertTriangle className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{reviewKpi.flagged}</p>
                <p className="text-xs opacity-80">Flagged</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={reviewSearch}
                  onChange={e => setReviewSearch(e.target.value)}
                  placeholder="Search reviewer, listing, review text..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                />
              </div>
              <div className="flex gap-1 bg-neutral-800 rounded-xl p-1">
                {(['ALL', 'REPORTED', 'HIDDEN', 'FLAGGED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${reviewFilter === f ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-xs text-neutral-500">{filteredReviews.length} shown</span>
            </div>

            {/* Reviews list */}
            {reviewsLoading && reviews.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No reviews match this filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map(r => (
                  <div key={r.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm">{r.reviewerName || 'Anonymous'}</span>
                          {r.isVerified && (
                            <span className="text-[10px] uppercase font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          )}
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`} />
                            ))}
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'HIDDEN' ? 'bg-yellow-500/10 text-yellow-400' :
                            r.status === 'FLAGGED' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-neutral-700/50 text-neutral-400'
                          }`}>
                            {r.status || 'VISIBLE'}
                          </span>
                          {r.reportCount > 0 && (
                            <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Flag className="w-2.5 h-2.5" /> {r.reportCount} report{r.reportCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {r.listingTitle && (
                          <p className="text-xs text-neutral-500 mb-1">on: {r.listingTitle}</p>
                        )}
                        {r.title && <p className="font-bold text-sm mb-1">{r.title}</p>}
                        {r.body && <p className="text-sm text-neutral-400 line-clamp-3">{r.body}</p>}
                      </div>
                      <div className="text-xs text-neutral-500 flex-shrink-0">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-800 flex-wrap">
                      {r.listingId && (
                        <Link href={`/marketplace/listing/${r.listingId}`} target="_blank" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View listing
                        </Link>
                      )}
                      {r.status !== 'HIDDEN' && (
                        <button
                          onClick={() => openReviewModeration(r, 'hide')}
                          disabled={reviewActioning === r.id}
                          className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 disabled:opacity-50"
                        >
                          <EyeOff className="w-3 h-3" /> Hide
                        </button>
                      )}
                      {r.status === 'HIDDEN' && (
                        <button
                          onClick={() => openReviewModeration(r, 'show')}
                          disabled={reviewActioning === r.id}
                          className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Eye className="w-3 h-3" /> Show
                        </button>
                      )}
                      <button
                        onClick={() => openReviewModeration(r, 'flag')}
                        disabled={reviewActioning === r.id}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3 h-3" /> Flag
                      </button>
                      <button
                        onClick={() => openReviewModeration(r, 'delete')}
                        disabled={reviewActioning === r.id}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {/* ============ TAB: SELLERS ============ */}
        {activeTab === 'sellers' && (
          <>
            {sellerMessage && (
              <div className="p-3 rounded-xl bg-green-900/50 text-green-300 border border-green-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {sellerMessage}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 text-white">
                <Store className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{sellerKpi.total}</p>
                <p className="text-xs opacity-80">Total Sellers</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white">
                <CheckCircle2 className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{sellerKpi.verified}</p>
                <p className="text-xs opacity-80">Verified</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-700 text-white">
                <Star className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{sellerKpi.trusted}</p>
                <p className="text-xs opacity-80">Trusted</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white">
                <Activity className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{sellerKpi.ready}</p>
                <p className="text-xs opacity-80">Ready to Verify (1K+)</p>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={sellerSearch}
                  onChange={e => setSellerSearch(e.target.value)}
                  placeholder="Search store, owner, email..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                />
              </div>
              <div className="flex gap-1 bg-neutral-800 rounded-xl p-1 flex-wrap">
                {(['ALL', 'VERIFIED', 'TRUSTED', 'UNVERIFIED', 'SUSPENDED', 'READY'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSellerFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sellerFilter === f ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {f === 'READY' ? 'Ready' : f}
                  </button>
                ))}
              </div>
              <span className="text-xs text-neutral-500">{filteredSellers.length} shown</span>
            </div>

            {sellersLoading && sellers.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : filteredSellers.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold">No sellers match</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSellers.map(s => {
                  const readyToVerify = (s.verification === 'UNVERIFIED' || !s.verification) && s.followerCount >= 1000
                  const isSuspended = s.status === 'SUSPENDED'
                  return (
                    <div key={s.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg">{s.storeName}</h3>
                            {s.verification === 'VERIFIED' && (
                              <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}
                            {s.verification === 'TRUSTED_SELLER' && (
                              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star className="w-2.5 h-2.5" /> Trusted
                              </span>
                            )}
                            {readyToVerify && (
                              <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                🎯 Ready to verify
                              </span>
                            )}
                            {isSuspended && (
                              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                Suspended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mb-2">
                            {s.ownerName || 'Unknown'} · {s.ownerEmail || '—'}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                            <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" />{s.followerCount} followers</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{s.activeListings} listings</span>
                            <span className="flex items-center gap-1"><Star className="w-3 h-3" />{s.averageRating || 0} rating</span>
                            <span>KES {Number(s.totalSales || 0).toLocaleString()} sales</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-800">
                        {s.verification !== 'VERIFIED' && s.verification !== 'TRUSTED_SELLER' && (
                          <button
                            onClick={() => sellerAction(s.id, 'verify')}
                            disabled={sellerActioning === s.id}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Verify
                          </button>
                        )}
                        {s.verification === 'VERIFIED' && (
                          <button
                            onClick={() => sellerAction(s.id, 'trust')}
                            disabled={sellerActioning === s.id}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                          >
                            <Star className="w-3 h-3" /> Promote to Trusted
                          </button>
                        )}
                        {(s.verification === 'VERIFIED' || s.verification === 'TRUSTED_SELLER') && (
                          <button
                            onClick={() => sellerAction(s.id, 'unverify')}
                            disabled={sellerActioning === s.id}
                            className="px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            Unverify
                          </button>
                        )}
                        {!isSuspended ? (
                          <button
                            onClick={() => sellerAction(s.id, 'suspend')}
                            disabled={sellerActioning === s.id}
                            className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-300 text-xs font-bold disabled:opacity-50 ml-auto"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => sellerAction(s.id, 'reactivate')}
                            disabled={sellerActioning === s.id}
                            className="px-3 py-1.5 rounded-lg bg-green-900/40 hover:bg-green-800 text-green-300 text-xs font-bold disabled:opacity-50 ml-auto"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Reviews moderation modal */}
      {reviewModerating && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setReviewModerating(null)}>
          <div className="bg-neutral-900 rounded-2xl max-w-lg w-full p-6 border border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg capitalize">{reviewModAction} review</h2>
              <button onClick={() => setReviewModerating(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              by {reviewModerating.reviewerName || 'Anonymous'} · {reviewModerating.rating}/5 stars
            </p>

            {reviewModAction !== 'show' && (
              <>
                <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Reason (for audit)</label>
                <select
                  value={reviewModReason}
                  onChange={e => setReviewModReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white mb-3 text-sm"
                >
                  <option value="">— Select reason —</option>
                  <option value="defamation">Defamation / false claims</option>
                  <option value="fake">Fake review</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment / abuse</option>
                  <option value="irrelevant">Irrelevant content</option>
                  <option value="other">Other</option>
                </select>

                <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Note (optional, admin-only)</label>
                <textarea
                  value={reviewModNote}
                  onChange={e => setReviewModNote(e.target.value)}
                  placeholder="Additional context for the audit log..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white mb-4 text-sm"
                />
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={submitReviewModeration}
                disabled={reviewActioning === reviewModerating.id}
                className={`flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 ${
                  reviewModAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  reviewModAction === 'hide' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  reviewModAction === 'show' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {reviewActioning === reviewModerating.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm {reviewModAction}
              </button>
              <button onClick={() => setReviewModerating(null)} className="px-5 py-3 rounded-xl bg-neutral-800 text-white font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}