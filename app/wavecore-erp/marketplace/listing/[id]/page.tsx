'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, ShoppingCart, Heart, MessageCircle, MapPin,
  Store, Shield, Star, Truck, CheckCircle2, AlertTriangle, Package,
  Tag, BadgeCheck, Clock, Route, Plus, Minus, LogIn,
} from 'lucide-react'
import { authedFetch, redirectToLogin } from '@/lib/wavecore/csrf-client'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchListing = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/listings?id=' + id)
      const data = res.data !== undefined ? res.data : await res.json()
      if (data.listing) setListing(data.listing)
      else setError('Listing not found')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchListing() }, [id])

  // Load saved status if logged in
  useEffect(() => {
    if (!id) return
    fetch('/api/marketplace/saved')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.saved) {
          const isSaved = d.saved.some((s: any) => Number(s.listingId) === Number(id))
          setSaved(isSaved)
        }
      })
      .catch(() => {})
  }, [id])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const addToCart = async () => {
    setAdding(true)
    setError('')

    const res = await authedFetch('/api/marketplace/cart', {
      method: 'POST',
      body: JSON.stringify({ listingId: Number(id), quantity }),
    })

    if (res.needsLogin) {
      redirectToLogin()
      return
    }

    if (res.ok) {
      flash('Added to cart! Redirecting…')
      setTimeout(() => router.push('/wavecore-erp/marketplace/cart'), 900)
    } else {
      setError(res.data?.error || 'Failed to add to cart')
    }
    setAdding(false)
  }

  const messageSeller = async () => {
    setMessaging(true)
    setError('')

    const res = await authedFetch('/api/marketplace/conversations', {
      method: 'POST',
      body: JSON.stringify({ listingId: Number(id), message: 'Hi, is this still available?' }),
    })

    if (res.needsLogin) {
      redirectToLogin()
      return
    }

    if (res.ok) {
      router.push('/wavecore-erp/marketplace/inbox')
    } else {
      setError(res.data?.error || 'Failed to start conversation')
    }
    setMessaging(false)
  }

  const toggleSave = async () => {
    setSaving(true)
    setError('')

    if (saved) {
      const res = await authedFetch('/api/marketplace/saved?listingId=' + Number(id), { method: 'DELETE' })
      if (res.needsLogin) { redirectToLogin(); setSaving(false); return }
      if (res.ok) { setSaved(false); flash('Removed from saved') }
    } else {
      const res = await authedFetch('/api/marketplace/saved', {
        method: 'POST',
        body: JSON.stringify({ listingId: Number(id) }),
      })
      if (res.needsLogin) { redirectToLogin(); setSaving(false); return }
      if (res.ok) { setSaved(true); flash('Saved to watchlist') }
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
    </div>
  )

  if (error && !listing) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300">{error}</p>
        <Link href="/wavecore-erp/marketplace" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold">Back to Marketplace</Link>
      </div>
    </div>
  )

  const images = listing.images || []
  const inStock = Number(listing.stock || 0) > 0
  const maxQty = Math.min(Number(listing.stock || 1), 10)

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveMarket" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket</span>
          </Link>
          <Link href="/wavecore-erp/marketplace/cart" className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
            <ShoppingCart className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden relative">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-neutral-700" />
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">Out of Stock</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={'aspect-square rounded-xl overflow-hidden border-2 transition-all ' + (activeImage === i ? 'border-cyan-500' : 'border-neutral-800 hover:border-neutral-700')}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-cyan-900/40 text-cyan-300">{listing.category || 'GENERAL'}</span>
                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">{listing.condition}</span>
                {inStock && Number(listing.stock) <= 3 && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-900/40 text-red-300">Only {listing.stock} left</span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">{listing.title}</h1>
              <p className="text-3xl font-bold text-amber-400">KES {Number(listing.price).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white font-bold">
                  {(listing.storeName || listing.sellerName || 'S').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white flex items-center gap-1">
                    {listing.storeName || listing.sellerName || 'Seller'}
                    {listing.verification === 'VERIFIED' && <BadgeCheck className="w-4 h-4 text-cyan-400" />}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mt-1">
                    {listing.averageRating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {listing.averageRating}</span>}
                    {listing.trustScore !== undefined && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Trust: {listing.trustScore}</span>}
                  </div>
                </div>
                <button onClick={messageSeller} disabled={messaging} className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white" title="Message seller">
                  {messaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-indigo-400" />
                <span className="text-neutral-400">Ships in</span>
                <span className="text-white font-bold">{listing.slaHours || 48}h</span>
              </div>
              {listing.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-neutral-400">Location</span>
                  <span className="text-white font-bold">{listing.location}</span>
                </div>
              )}
            </div>

            {listing.description && (
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-2">Description</h3>
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {inStock && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400">Quantity:</span>
                  <div className="flex items-center gap-2 bg-neutral-800 rounded-xl">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-neutral-700 rounded-l-xl" disabled={quantity <= 1}>
                      <Minus className="w-3 h-3 text-white" />
                    </button>
                    <span className="px-4 text-white font-bold">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} className="p-2.5 hover:bg-neutral-700 rounded-r-xl" disabled={quantity >= maxQty}>
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={addToCart}
                    disabled={adding}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                    {adding ? 'Adding…' : `Add to Cart · KES ${(Number(listing.price) * quantity).toLocaleString()}`}
                  </button>
                  <button
                    onClick={toggleSave}
                    disabled={saving}
                    className={'p-3.5 rounded-xl text-white transition-all ' + (saved ? 'bg-rose-600 hover:bg-rose-700' : 'bg-neutral-800 hover:bg-neutral-700')}
                    title={saved ? 'Remove from saved' : 'Save to watchlist'}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={'w-5 h-5 ' + (saved ? 'fill-white' : '')} />}
                  </button>
                </div>

                <button
                  onClick={messageSeller}
                  disabled={messaging}
                  className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Chat with Seller
                </button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-green-900/20 border border-green-800/50 space-y-2">
              <p className="flex items-center gap-2 text-sm text-green-200">
                <Shield className="w-4 h-4" /> <span className="font-bold">WaveMarket Buyer Protection</span>
              </p>
              <p className="text-xs text-green-300">Full refund if item doesn't arrive, arrives damaged, or isn't as described.</p>
            </div>

            {!inStock && (
              <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-800/50 flex items-center gap-2 text-sm text-amber-200">
                <AlertTriangle className="w-4 h-4" /> This item is currently out of stock
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}