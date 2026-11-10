'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, ShoppingCart, Heart, Star, MapPin, Loader2, Package,
  MessageSquare, CheckCircle2, AlertCircle, TrendingUp, Eye,
} from 'lucide-react'
import { LikeButton } from '@/components/marketplace/LikeButton'
import { CommentSection } from '@/components/marketplace/CommentSection'
import { WhatsAppButton } from '@/components/marketplace/WhatsAppButton'
import { FollowButton } from '@/components/marketplace/FollowButton'

interface Listing {
  id: number
  sellerId: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  condition: string
  location: string
  images: string[]
  status: string
  views: number
  saves: number
  stock: number
  sku: string
  fulfillmentType: string
  createdAt: string
  sellerName: string
  sellerImage: string | null
  storeName: string | null
  storeLogo: string | null
  averageRating: number | null
  totalReviews: number | null
  trustScore: number | null
  verification: string | null
  sellerFollowerCount: number | null
}

interface Review {
  id: string
  listingId: number
  reviewerId: string
  reviewerName: string
  rating: number
  title: string
  body: string
  isVerified: boolean
  helpfulCount: number
  createdAt: string
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params?.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewLoading, setReviewLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [saved, setSaved] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (!listingId) return
    fetch('/api/marketplace/listings?id=' + listingId)
      .then(r => r.json())
      .then(d => {
        if (!d.listing) setError('Listing not found')
        else setListing(d.listing)
      })
      .catch(() => setError('Failed to load listing'))
      .finally(() => setLoading(false))
  }, [listingId])

  useEffect(() => {
    if (!listingId) return
    fetch('/api/marketplace/reviews?listingId=' + listingId)
      .then(r => r.ok ? r.json() : { reviews: [] })
      .then(d => setReviews(d.reviews || []))
      .catch(() => {})
      .finally(() => setReviewLoading(false))
  }, [listingId])

  const addToCart = async () => {
    setAddingToCart(true)
    try {
      const res = await fetch('/api/marketplace/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing?.id, quantity }),
      })
      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=/wavecore-erp/marketplace/listing/' + listingId)
        return
      }
      if (!res.ok) throw new Error('Failed to add')
      router.push('/wavecore-erp/marketplace/cart')
    } catch {
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const buyNow = async () => {
    await addToCart()
    router.push('/wavecore-erp/marketplace/checkout')
  }

  const toggleSave = async () => {
    try {
      const res = await fetch('/api/marketplace/saved', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing?.id }),
      })
      if (res.ok) setSaved(!saved)
    } catch {}
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/marketplace/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing?.id, rating: reviewRating, title: reviewTitle, body: reviewBody }),
      })
      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=/wavecore-erp/marketplace/listing/' + listingId)
        return
      }
      if (!res.ok) throw new Error('Failed to submit')
      setShowReviewForm(false)
      setReviewTitle('')
      setReviewBody('')
      setReviewRating(5)
      fetch('/api/marketplace/reviews?listingId=' + listingId)
        .then(r => r.ok ? r.json() : { reviews: [] })
        .then(d => setReviews(d.reviews || []))
    } catch {
      alert('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-xl mb-2">{error || 'Listing not found'}</p>
        <Link href="/wavecore-erp/marketplace" className="text-cyan-400 hover:underline mt-4">
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const images = listing.images?.length > 0 ? listing.images : []
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/wavecore-erp/marketplace" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          <div>
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800">
              {images.length > 0 ? (
                <Image src={images[selectedImage]} alt={listing.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-24 h-24 text-neutral-700" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={selectedImage === i ? "relative aspect-square rounded-xl overflow-hidden border-2 border-cyan-500" : "relative aspect-square rounded-xl overflow-hidden border-2 border-neutral-800 hover:border-neutral-600"}>
                    <Image src={img} alt={listing.title} fill className="object-cover" sizes="100px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase text-cyan-400">{listing.category}</span>
                <h1 className="text-3xl lg:text-4xl font-bold mt-1">{listing.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <LikeButton listingId={listing.id} initialCount={listing.saves || 0} variant="default" />
                <button onClick={toggleSave} className={saved ? "p-3 rounded-xl bg-red-500/20 text-red-400" : "p-3 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white"}>
                  <Heart className={saved ? "w-5 h-5 fill-current" : "w-5 h-5"} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-neutral-400">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {listing.views} views</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {listing.saves} saves</span>
              {listing.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {listing.location}</span>}
              {listing.condition && <span className="px-2 py-0.5 rounded bg-neutral-800 text-xs">{listing.condition}</span>}
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-cyan-400">KSh {Number(listing.price).toLocaleString()}</span>
              <p className="text-sm text-neutral-500 mt-1">{listing.stock > 0 ? listing.stock + ' in stock' : 'Out of stock'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6">
              <p className="text-xs text-neutral-500 mb-2">Sold by</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{listing.storeName?.charAt(0) || listing.sellerName?.charAt(0) || 'S'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={'/wavecore-erp/marketplace/seller/' + listing.sellerId} className="font-bold truncate hover:text-cyan-400 transition-colors block">{listing.storeName || listing.sellerName}</Link>
                  {listing.sellerFollowerCount !== null && listing.sellerFollowerCount > 0 && (
                    <p className="text-xs text-neutral-500">{listing.sellerFollowerCount} follower{listing.sellerFollowerCount === 1 ? '' : 's'}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {listing.averageRating && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-current" /> {Number(listing.averageRating).toFixed(1)} ({listing.totalReviews})
                      </span>
                    )}
                    {listing.verification === 'VERIFIED' && (
                      <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FollowButton sellerId={listing.sellerId} size="sm" variant="ghost" />
                  <WhatsAppButton listingId={listing.id} listingTitle={listing.title} variant="secondary" size="sm" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-white hover:bg-neutral-800 rounded-l-xl">-</button>
                <span className="px-4 py-2 font-bold min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(listing.stock || 99, quantity + 1))} className="px-4 py-2 text-white hover:bg-neutral-800 rounded-r-xl">+</button>
              </div>
              <button onClick={addToCart} disabled={addingToCart || listing.stock === 0} className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                Add to Cart
              </button>
            </div>
            <button onClick={buyNow} disabled={addingToCart || listing.stock === 0} className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mb-6">
              <TrendingUp className="w-5 h-5" /> Buy Now
            </button>

            <div className="border-t border-neutral-800 pt-6">
              <h2 className="font-bold text-lg mb-3">Description</h2>
              <p className="text-neutral-400 whitespace-pre-line leading-relaxed">{listing.description}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={star <= Math.round(Number(avgRating)) ? "w-4 h-4 text-amber-400 fill-current" : "w-4 h-4 text-neutral-700"} />
                    ))}
                  </div>
                  <span className="text-sm text-neutral-400">{avgRating} average</span>
                </div>
              )}
            </div>
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-sm transition-colors">
              Write a Review
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={submitReview} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6">
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setReviewRating(star)} className="p-1">
                      <Star className={star <= reviewRating ? "w-8 h-8 text-amber-400 fill-current" : "w-8 h-8 text-neutral-700"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Title</label>
                <input type="text" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} required placeholder="Great product!" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Your review</label>
                <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} required rows={4} placeholder="Tell others about your experience..." className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submittingReview} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl font-bold transition-colors">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" onClick={() => setShowReviewForm(false)} className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {reviewLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{review.reviewerName || 'Anonymous'}</span>
                        {review.isVerified && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={star <= review.rating ? "w-3.5 h-3.5 text-amber-400 fill-current" : "w-3.5 h-3.5 text-neutral-700"} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-500">{new Date(review.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  {review.title && <p className="font-bold mb-1">{review.title}</p>}
                  {review.body && <p className="text-sm text-neutral-400 whitespace-pre-line">{review.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <CommentSection listingId={listing.id} />
      </div>
    </div>
  )
}