'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Shield, Lock, Search, Loader2, Trash2, Eye, EyeOff, AlertTriangle,
  CheckCircle2, X, Flag, Star, RefreshCw, ArrowLeft, MessageSquareOff,
  TrendingUp, FileText,
} from 'lucide-react'

const SESSION_KEY = 'wavvemarket_admin_session'

interface ReviewRow {
  id: string
  listingId: number | null
  reviewerId: string | null
  reviewerName: string | null
  rating: number
  title: string | null
  body: string | null
  isVerified: boolean
  status: string | null
  helpfulCount: number | null
  createdAt: string
  listingTitle: string | null
  reportCount: number
}

interface KpiData {
  total: number
  reported: number
  hidden: number
  flagged: number
}

type FilterMode = 'ALL' | 'REPORTED' | 'HIDDEN' | 'FLAGGED'

export default function ReviewsModerationPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [kpi, setKpi] = useState<KpiData>({ total: 0, reported: 0, hidden: 0, flagged: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('ALL')

  const [actioning, setActioning] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // Moderation modal
  const [moderating, setModerating] = useState<ReviewRow | null>(null)
  const [modAction, setModAction] = useState<'hide' | 'show' | 'flag' | 'delete'>('hide')
  const [modReason, setModReason] = useState('')
  const [modNote, setModNote] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved === 'true') {
      setAuthenticated(true)
      fetchReviews()
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
        fetchReviews()
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
    setReviews([])
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const url = `/api/marketplace/admin/reviews?filter=${filter}&search=${encodeURIComponent(search)}&limit=100`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setKpi(data.kpi || { total: 0, reported: 0, hidden: 0, flagged: 0 })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated) fetchReviews()
  }, [filter])

  const openModeration = (r: ReviewRow, action: 'hide' | 'show' | 'flag' | 'delete') => {
    setModerating(r)
    setModAction(action)
    setModReason('')
    setModNote('')
  }

  const submitModeration = async () => {
    if (!moderating) return
    setActioning(moderating.id)
    try {
      const body: any = { action: modAction }
      if (modReason) body.reason = modReason
      if (modNote) body.note = modNote

      const res = await fetch(`/api/marketplace/reviews/${moderating.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setMessage(`Review ${modAction}d`)
        setModerating(null)
        fetchReviews()
        setTimeout(() => setMessage(''), 3000)
      } else {
        const d = await res.json()
        setMessage(d.error || 'Failed')
      }
    } finally {
      setActioning(null)
    }
  }

  const filtered = useMemo(() => {
    let list = reviews
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        (r.reviewerName || '').toLowerCase().includes(q) ||
        (r.listingTitle || '').toLowerCase().includes(q) ||
        (r.body || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [reviews, search])

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm p-8 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Reviews Moderation</h1>
            <p className="text-xs text-neutral-400">Enter admin password to continue</p>
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
            <Link href="/wavecore-erp/admin/marketplace-moderation" className="flex items-center gap-2 text-neutral-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <span className="text-neutral-700">|</span>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="font-bold">Reviews Moderation</span>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
            <Lock className="w-3 h-3" /> Lock
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-xs text-neutral-500 uppercase font-bold">Total</span>
            </div>
            <p className="text-3xl font-bold">{kpi.total}</p>
            <p className="text-xs text-neutral-500 mt-1">All reviews</p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-red-900/50">
            <div className="flex items-center justify-between mb-2">
              <Flag className="w-5 h-5 text-red-400" />
              <span className="text-xs text-red-400 uppercase font-bold">Reported</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{kpi.reported}</p>
            <p className="text-xs text-neutral-500 mt-1">Pending reports</p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-yellow-900/50">
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-yellow-400 uppercase font-bold">Hidden</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{kpi.hidden}</p>
            <p className="text-xs text-neutral-500 mt-1">Not visible</p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-amber-900/50">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-amber-400 uppercase font-bold">Flagged</span>
            </div>
            <p className="text-3xl font-bold text-amber-400">{kpi.flagged}</p>
            <p className="text-xs text-neutral-500 mt-1">Under review</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(['ALL', 'REPORTED', 'HIDDEN', 'FLAGGED'] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === f ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'REPORTED' ? 'Reported' : f === 'HIDDEN' ? 'Hidden' : 'Flagged'}
            </button>
          ))}
          <div className="flex-1"></div>
          <button onClick={fetchReviews} disabled={loading} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reviewer, listing title, or review text..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600"
          />
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-green-900/30 border border-green-800 text-green-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {message}
          </div>
        )}

        {/* List */}
        {loading && reviews.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No reviews match this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
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
                      onClick={() => openModeration(r, 'hide')}
                      disabled={actioning === r.id}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 disabled:opacity-50"
                    >
                      <EyeOff className="w-3 h-3" /> Hide
                    </button>
                  )}
                  {r.status === 'HIDDEN' && (
                    <button
                      onClick={() => openModeration(r, 'show')}
                      disabled={actioning === r.id}
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Eye className="w-3 h-3" /> Show
                    </button>
                  )}
                  {r.status !== 'FLAGGED' && (
                    <button
                      onClick={() => openModeration(r, 'flag')}
                      disabled={actioning === r.id}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
                    >
                      <AlertTriangle className="w-3 h-3" /> Flag
                    </button>
                  )}
                  <button
                    onClick={() => openModeration(r, 'delete')}
                    disabled={actioning === r.id}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Moderation modal */}
      {moderating && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setModerating(null)}>
          <div className="bg-neutral-900 rounded-2xl max-w-lg w-full p-6 border border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg capitalize">{modAction} review</h2>
              <button onClick={() => setModerating(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              by {moderating.reviewerName || 'Anonymous'} · {moderating.rating}/5 stars
            </p>

            {modAction !== 'show' && (
              <>
                <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Reason (for audit)</label>
                <select
                  value={modReason}
                  onChange={e => setModReason(e.target.value)}
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
                  value={modNote}
                  onChange={e => setModNote(e.target.value)}
                  placeholder="Additional context for the audit log..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white mb-4 text-sm"
                />
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={submitModeration}
                disabled={actioning === moderating.id}
                className={`flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 ${
                  modAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  modAction === 'hide' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  modAction === 'show' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actioning === moderating.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm {modAction}
              </button>
              <button onClick={() => setModerating(null)} className="px-5 py-3 rounded-xl bg-neutral-800 text-white font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}