'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Shield, Lock, Search, Loader2, Trash2, Eye, EyeOff, AlertTriangle,
  CheckCircle2, X, Ban, Flag, Image as ImageIcon, Download,
  Filter, RefreshCw, Activity, KeyRound, ArrowLeft, User, MapPin,
} from 'lucide-react'

const SESSION_KEY = 'wavvemarket_admin_session'

export default function MarketplaceModerationPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'WITH_IMAGES' | 'FLAGGED' | 'BLOCKED'>('ALL')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [actionMessage, setActionMessage] = useState('')

  // Restore session
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
  }

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
    setActivityLog(prev => [{ ts: new Date().toISOString(), action, target }, ...prev].slice(0, 50))
  }

  const flash = (m: string) => { setActionMessage(m); setTimeout(() => setActionMessage(''), 3000) }

  const removeImage = async (listingId: number, imageIndex: number) => {
    if (!confirm('Remove this image from the listing?')) return
    const listing = listings.find(l => l.id === listingId)
    if (!listing) return
    const newImages = (listing.images || []).filter((_: any, i: number) => i !== imageIndex)
    try {
      const res = await fetch('/api/marketplace/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listingId, images: newImages }),
      })
      if (res.ok) {
        setListings(prev => prev.map(l => l.id === listingId ? { ...l, images: newImages } : l))
        logAction('IMAGE_REMOVED', `Listing #${listingId} image ${imageIndex + 1}`)
        flash('Image removed')
      } else {
        flash('Failed — listing may need PATCH support')
      }
    } catch { flash('Network error') }
  }

  const deleteListing = async (id: number, title: string) => {
    if (!confirm(`Delete listing "${title}"? Cannot be undone.`)) return
    setDeleting(id.toString())
    try {
      const res = await fetch(`/api/marketplace/listings?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setListings(prev => prev.filter(l => l.id !== id))
        logAction('LISTING_DELETED', `#${id} — ${title}`)
        flash('Listing deleted')
      }
    } finally { setDeleting(null) }
  }

  const toggleExpand = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const filtered = useMemo(() => {
    let list = [...listings]
    if (filter === 'WITH_IMAGES') list = list.filter(l => l.images?.length > 0)
    if (filter === 'FLAGGED') list = list.filter(l => l.status === 'FLAGGED')
    if (filter === 'BLOCKED') list = list.filter(l => l.status === 'BLOCKED')
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(l =>
        (l.title || '').toLowerCase().includes(s) ||
        (l.category || '').toLowerCase().includes(s) ||
        (l.sellerName || '').toLowerCase().includes(s)
      )
    }
    return list
  }, [listings, filter, search])

  // ========== LOGIN SCREEN ==========
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 rounded-3xl border border-red-900/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Restricted Access</h1>
            <p className="text-neutral-400 mt-2 text-sm">CEO Moderation Console</p>
            <p className="text-xs text-neutral-500 mt-1">Only authorized admin can access</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-900/30 text-red-300 text-sm mb-4 text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {authError}
            </div>
          )}

          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-red-500"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={authLoading || !password}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Unlock Console
          </button>

          <Link href="/wavecore-erp/marketplace" className="block text-center text-xs text-neutral-500 hover:text-neutral-300 mt-6">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  // ========== MAIN CONSOLE ==========
  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/marketplace" className="p-2 rounded-xl hover:bg-neutral-800">
              <ArrowLeft className="w-4 h-4 text-neutral-400" />
            </Link>
            <Shield className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-bold text-white text-sm">Marketplace Moderation</p>
              <p className="text-[10px] text-neutral-500">CEO Console · Image & Listing Control</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Authenticated
            </span>
            <button onClick={fetchListings} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-neutral-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={logout} className="px-3 py-2 rounded-xl bg-red-900/40 text-red-300 text-xs font-bold hover:bg-red-800">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {actionMessage && (
          <div className="p-3 rounded-xl bg-green-900/50 text-green-300 border border-green-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {actionMessage}
          </div>
        )}

        {/* KPI CARDS */}
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

        {/* FILTERS */}
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
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {/* LISTINGS */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-red-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
            <p className="text-neutral-400">No listings match</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(listing => {
              const imgCount = (listing.images || []).length
              const isExpanded = expanded[listing.id]
              return (
                <div key={listing.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                  {/* Row header */}
                  <div className="p-5 flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1 min-w-[240px]">
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

                  {/* Expanded images */}
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

        {/* ACTIVITY LOG */}
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
      </main>
    </div>
  )
}