'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Heart, Loader2, MapPin, ChevronLeft, Trash2, Store, FolderHeart,
  Bell, Plus, X, Share2, Globe, Lock, TrendingDown, CheckCircle2,
} from 'lucide-react'
import WishlistCollectionCard from '@/components/marketplace/WishlistCollectionCard'

type TabId = 'all' | 'collections' | 'alerts'

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all')

  // All Saved
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Collections
  const [collections, setCollections] = useState<any[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'all') fetchSaved()
    else if (activeTab === 'collections') fetchCollections()
    else if (activeTab === 'alerts') fetchAlerts()
  }, [activeTab])

  const fetchSaved = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/saved')
      if (res.ok) { const d = await res.json(); setSaved(d.saved || []) }
    } finally { setLoading(false) }
  }

  const fetchCollections = async () => {
    setCollectionsLoading(true)
    try {
      const res = await fetch('/api/marketplace/wishlists')
      if (res.ok) { const d = await res.json(); setCollections(d.collections || []) }
    } finally { setCollectionsLoading(false) }
  }

  const fetchAlerts = async () => {
    setAlertsLoading(true)
    try {
      const res = await fetch('/api/marketplace/wishlists/price-alert')
      if (res.ok) { const d = await res.json(); setAlerts(d.alerts || []) }
    } finally { setAlertsLoading(false) }
  }

  const removeSaved = async (listingId: number) => {
    await fetch(`/api/marketplace/saved?listingId=${listingId}`, { method: 'DELETE' })
    fetchSaved()
  }

  const createCollection = async () => {
    if (!newCollectionName.trim()) return
    setCreatingCollection(true)
    try {
      const res = await fetch('/api/marketplace/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      })
      if (res.ok) { setNewCollectionName(''); fetchCollections() }
    } finally { setCreatingCollection(false) }
  }

  const deleteCollection = async (id: string) => {
    if (!confirm('Delete this collection? Items will move to your default saved list.')) return
    await fetch(`/api/marketplace/wishlists/${id}`, { method: 'DELETE' })
    fetchCollections()
  }

  const toggleShare = async (id: string, currentPublic: boolean) => {
    const res = await fetch(`/api/marketplace/wishlists/${id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ makePublic: !currentPublic }),
    })
    if (res.ok) {
      const d = await res.json()
      if (!currentPublic) {
        const url = `${window.location.origin}/marketplace/wishlist/${d.collection.slug}`
        await navigator.clipboard.writeText(url).catch(() => {})
        alert(`Collection is now public!\nLink copied: ${url}`)
      }
      fetchCollections()
    }
  }

  const removeAlert = async (id: string) => {
    await fetch(`/api/marketplace/wishlists/price-alert?id=${id}`, { method: 'DELETE' })
    fetchAlerts()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-5xl mx-auto">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" /> My Wishlist
          </span>
          <div className="w-16"></div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'all' ? 'border-red-500 text-red-500' : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> All Saved
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'collections' ? 'border-pink-500 text-pink-500' : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" /> Collections
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'alerts' ? 'border-amber-500 text-amber-500' : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Price Alerts
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-6">
        {/* === TAB: ALL SAVED === */}
        {activeTab === 'all' && (
          <>
            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-red-500" /></div>
            ) : saved.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-muted-foreground">No saved items</p>
                <p className="text-sm text-muted-foreground mt-1">Items you save will appear here</p>
                <Link href="/marketplace" className="inline-block mt-4 px-5 py-2 rounded-xl bg-red-500 text-white font-bold text-sm">Browse Marketplace</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {saved.map(item => (
                  <div key={item.id} className="rounded-2xl border bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-lg transition-all">
                    <Link href={`/marketplace/listing/${item.listingId}`}>
                      <div className="h-40 bg-neutral-200 dark:bg-neutral-800">
                        {item.images && item.images[0] ? (
                          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="w-10 h-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-green-600">KSh {Number(item.price).toLocaleString()}</p>
                        <p className="text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {item.location || 'Kenya'}
                        </p>
                      </div>
                    </Link>
                    <button onClick={() => removeSaved(item.listingId)}
                      className="w-full p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 flex items-center justify-center gap-1 text-sm">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* === TAB: COLLECTIONS === */}
        {activeTab === 'collections' && (
          <>
            {/* Create new */}
            <div className="mb-6 p-4 rounded-2xl border bg-white dark:bg-neutral-900">
              <label className="text-xs uppercase font-bold text-neutral-500 mb-2 block">Create a new collection</label>
              <div className="flex gap-2">
                <input
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="e.g., Birthday gifts, Home office, Photography gear"
                  maxLength={80}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm"
                  onKeyDown={e => e.key === 'Enter' && createCollection()}
                />
                <button
                  onClick={createCollection}
                  disabled={creatingCollection || !newCollectionName.trim()}
                  className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  {creatingCollection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </div>

            {collectionsLoading ? (
              <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-pink-500" /></div>
            ) : collections.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
                <FolderHeart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-muted-foreground">No collections yet</p>
                <p className="text-sm text-muted-foreground mt-1">Group your saved items into themed collections</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map(c => (
                  <div key={c.id} className="relative group">
                    <WishlistCollectionCard collection={c} />
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); toggleShare(c.id, c.isPublic); }}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-neutral-800/90 hover:bg-white text-neutral-700 dark:text-neutral-300"
                        title={c.isPublic ? 'Make private' : 'Make public & copy link'}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); deleteCollection(c.id); }}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-neutral-800/90 hover:bg-red-50 text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* === TAB: PRICE ALERTS === */}
        {activeTab === 'alerts' && (
          <>
            {alertsLoading ? (
              <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-muted-foreground">No price alerts</p>
                <p className="text-sm text-muted-foreground mt-1">Set target prices on items to get notified on drops</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(a => {
                  const isDropped = Number(a.currentPrice) <= Number(a.targetPrice)
                  return (
                    <div key={a.id} className={`p-4 rounded-2xl border ${isDropped ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'bg-white dark:bg-neutral-900'}`}>
                      <div className="flex items-start gap-3">
                        {a.images?.[0] && (
                          <Link href={`/marketplace/listing/${a.listingId}`}>
                            <img src={a.images[0]} alt={a.title} className="w-16 h-16 rounded-lg object-cover" />
                          </Link>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link href={`/marketplace/listing/${a.listingId}`} className="font-bold text-sm hover:text-blue-500 block truncate">
                            {a.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span>Current: <b className={isDropped ? 'text-green-600' : ''}>KES {Number(a.currentPrice).toLocaleString()}</b></span>
                            <span>Target: <b>KES {Number(a.targetPrice).toLocaleString()}</b></span>
                          </div>
                          {isDropped && (
                            <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" /> Target reached! Ready to buy
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeAlert(a.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Remove alert"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}