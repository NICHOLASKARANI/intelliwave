'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Trash2, Shield, Eye, EyeOff, Loader2, Search,
  AlertTriangle, CheckCircle, X, Lock, KeyRound
} from 'lucide-react'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showImages, setShowImages] = useState<Record<number, boolean>>({})

  // CEO Password - change this to your own!
  const CEO_PASSWORD = 'NicholasKarani2026!'

  const handleLogin = () => {
    if (password === CEO_PASSWORD) {
      setAuthenticated(true)
      fetchListings()
    } else {
      setError('Access Denied. CEO only.')
    }
  }

  const fetchListings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/listings?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return
    setDeleting(id.toString())
    try {
      const res = await fetch(`/api/marketplace/listings?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setListings(listings.filter(l => l.id !== id))
      }
    } catch {} finally { setDeleting(null) }
  }

  const toggleImages = (id: number) => {
    setShowImages(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">🔒 Restricted Access</h1>
            <p className="text-neutral-400 mt-2">CEO Authorization Required</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm mb-4 text-center">
              {error}
            </div>
          )}

          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              placeholder="Enter CEO Password" />
          </div>

          <button onClick={handleLogin}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold hover:shadow-lg transition-all">
            Unlock Admin Panel
          </button>
        </div>
      </div>
    )
  }

  const filteredListings = listings.filter(l =>
    l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-500" />
            <span className="font-bold text-white">CEO Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-400">● Authenticated</span>
            <button onClick={() => fetchListings()} className="p-2 rounded-xl hover:bg-neutral-800">
              <Loader2 className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            placeholder="Search listings..." />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white/5 text-center">
            <p className="text-2xl font-bold text-white">{listings.length}</p>
            <p className="text-xs text-neutral-400">Total Listings</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 text-center">
            <p className="text-2xl font-bold text-red-400">{filteredListings.length}</p>
            <p className="text-xs text-neutral-400">Filtered</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 text-center">
            <p className="text-2xl font-bold text-green-400">{listings.filter(l => l.images?.length > 0).length}</p>
            <p className="text-xs text-neutral-400">With Images</p>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-red-500" /></div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map(listing => (
              <div key={listing.id} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{listing.title}</h3>
                    <p className="text-sm text-neutral-400">{listing.category} • KSh {listing.price} • {listing.condition}</p>
                    <p className="text-xs text-neutral-500 mt-1">{listing.location || 'No location'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleImages(listing.id)}
                      className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                      {showImages[listing.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(listing.id)} disabled={deleting === listing.id.toString()}
                      className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                      {deleting === listing.id.toString() ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Images */}
                {showImages[listing.id] && listing.images && listing.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {listing.images.map((img: string, i: number) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                        <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-400">No listings found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}