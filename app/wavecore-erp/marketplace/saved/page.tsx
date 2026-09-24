'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Heart, Loader2, Package, Trash2, ShoppingCart, MapPin, Store,
  Search, RefreshCw, ArrowRight, Tag,
} from 'lucide-react'

export default function SavedPage() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [removing, setRemoving] = useState('')
  const [addingCart, setAddingCart] = useState('')
  const [search, setSearch] = useState('')

  const fetchSaved = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/saved')
      const data = await res.json()
      setSaved(data.saved || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchSaved() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }

  const remove = async (listingId: number) => {
    setRemoving(listingId.toString())
    try {
      const res = await fetch('/api/marketplace/saved?listingId=' + listingId, { method: 'DELETE' })
      if (res.ok) { flash('Removed'); fetchSaved() }
    } finally { setRemoving('') }
  }

  const addToCart = async (listingId: number) => {
    setAddingCart(listingId.toString())
    try {
      const res = await fetch('/api/marketplace/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, quantity: 1 }),
      })
      if (res.ok) { flash('Added to cart') }
    } finally { setAddingCart('') }
  }

  const filtered = saved.filter(s =>
    !search || (s.title || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket · Saved</span>
          </Link>
          <Link href="/wavecore-erp/marketplace/cart" className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" /> Cart
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Heart className="w-7 h-7 text-rose-400" /> Saved Items
            </h1>
            <p className="text-sm text-neutral-400 mt-1">{saved.length} items on your watchlist</p>
          </div>
          <button onClick={fetchSaved} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800">{success}</div>}

        {saved.length > 0 && (
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saved items..."
              className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full text-sm" />
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-rose-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">{saved.length === 0 ? 'No saved items yet' : 'No matching items'}</p>
            <Link href="/wavecore-erp/marketplace" className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center gap-2">
              <Tag className="w-4 h-4" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <div key={s.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden hover:border-rose-600 transition-all">
                <Link href={'/wavecore-erp/marketplace/listing/' + s.listingId}>
                  <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                    {s.images?.[0] ? (
                      <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-neutral-700" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={'/wavecore-erp/marketplace/listing/' + s.listingId} className="block">
                    <p className="font-bold text-white truncate mb-1">{s.title}</p>
                    {s.location && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" /> {s.location}
                      </p>
                    )}
                    <p className="text-xl font-bold text-amber-400 mb-3">KES {Number(s.price).toLocaleString()}</p>
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(s.listingId)}
                      disabled={addingCart === s.listingId.toString()}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {addingCart === s.listingId.toString() ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
                      Add to Cart
                    </button>
                    <button
                      onClick={() => remove(s.listingId)}
                      disabled={removing === s.listingId.toString()}
                      className="p-2 rounded-xl bg-red-900/40 text-red-300 hover:bg-red-800"
                      title="Remove from saved"
                    >
                      {removing === s.listingId.toString() ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}