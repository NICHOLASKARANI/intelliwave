'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Star, MapPin, Package, CheckCircle2, Loader2,
  AlertCircle, Store, Users, Eye
} from 'lucide-react'
import { FollowButton } from '@/components/marketplace/FollowButton'
import { WhatsAppButton } from '@/components/marketplace/WhatsAppButton'

interface Seller {
  id: string
  storeName: string
  storeSlug: string | null
  storeBanner: string | null
  storeLogo: string | null
  description: string | null
  businessType: string | null
  averageRating: number | null
  totalReviews: number | null
  trustScore: number | null
  verification: string | null
  totalOrders: number | null
  totalSales: number | null
  sellerName: string
  sellerImage: string | null
}

interface Listing {
  id: number
  title: string
  description: string | null
  price: number
  currency: string
  category: string
  condition: string | null
  location: string | null
  images: string[]
  stock: number
  status: string
  views: number
  saves: number
  createdAt: string
}

interface SellerData {
  seller: Seller
  listings: Listing[]
  followerCount: number
  listingCount: number
}

export default function SellerStorefrontPage() {
  const params = useParams()
  const sellerId = params?.id as string

  const [data, setData] = useState<SellerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sellerId) return
    fetch('/api/marketplace/sellers/' + sellerId, { cache: 'no-store' })
      .then(r => {
        if (r.status === 404) {
          setError('Seller not found')
          return null
        }
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then(d => {
        if (d) setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load seller')
        setLoading(false)
      })
  }, [sellerId])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-xl mb-2">{error || 'Seller not found'}</p>
        <Link href="/wavecore-erp/marketplace" className="text-cyan-400 hover:underline mt-4">
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const { seller, listings, followerCount, listingCount } = data
  const displayName = seller.storeName || seller.sellerName || 'Seller'
  const hasBanner = !!seller.storeBanner
  const hasLogo = !!seller.storeLogo

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/wavecore-erp/marketplace" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        {/* Banner */}
        <div className={'relative ' + (hasBanner ? 'h-48 md:h-64' : 'h-32 md:h-40') + ' rounded-3xl overflow-hidden mb-6 ' + (hasBanner ? '' : 'bg-gradient-to-r from-cyan-600 to-purple-600')}>
          {hasBanner ? (
            <Image src={seller.storeBanner!} alt={displayName} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <Store className="w-24 h-24 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Seller info card */}
        <div className="relative mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20 px-2">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-neutral-950 bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              {hasLogo ? (
                <Image src={seller.storeLogo!} alt={displayName} width={128} height={128} className="object-cover w-full h-full" />
              ) : (
                <span className="text-white font-bold text-4xl">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Store info */}
            <div className="flex-1 md:pb-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-3xl md:text-4xl font-bold">{displayName}</h1>
                {seller.verification === 'VERIFIED' && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm text-neutral-400">
                {seller.averageRating && seller.averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="font-bold text-white">{Number(seller.averageRating).toFixed(1)}</span>
                    ({seller.totalReviews || 0} review{(seller.totalReviews || 0) === 1 ? '' : 's'})
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="font-bold text-white">{followerCount}</span>
                  follower{followerCount === 1 ? '' : 's'}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span className="font-bold text-white">{listingCount}</span>
                  listing{listingCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 md:pb-4">
              <FollowButton sellerId={seller.id} size="lg" variant="default" initialCount={followerCount} />
              <WhatsAppButton listingId={listings[0]?.id || 0} listingTitle="" variant="primary" size="lg" />
            </div>
          </div>
        </div>

        {/* Description */}
        {seller.description && (
          <div className="mb-8 p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <h2 className="font-bold text-sm uppercase text-neutral-500 mb-2">About</h2>
            <p className="text-neutral-300 whitespace-pre-line">{seller.description}</p>
          </div>
        )}

        {/* Listings grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              Listings <span className="text-neutral-500 text-lg">({listings.length})</span>
            </h2>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-neutral-900 border border-neutral-800">
              <Package className="w-16 h-16 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400">This seller has no active listings yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map(listing => (
                <Link
                  key={listing.id}
                  href={'/wavecore-erp/marketplace/listing/' + listing.id}
                  className="group bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-square bg-neutral-800 overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-neutral-600" />
                      </div>
                    )}
                    {listing.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Out of stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-cyan-400">
                      KSh {Number(listing.price).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between text-xs text-neutral-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {listing.views}
                      </span>
                      <span>{listing.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}