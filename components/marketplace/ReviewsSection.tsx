'use client'

import { useEffect, useState } from 'react'
import { Star, Loader2, MessageSquarePlus, TrendingUp } from 'lucide-react'
import ReviewCard from './ReviewCard'
import WriteReviewModal from './WriteReviewModal'

interface ReviewsSectionProps {
  listingId: number | string
  sellerId?: string | null
}

interface ReviewsData {
  reviews: any[]
  pagination: { page: number, limit: number, total: number, totalPages: number }
  average: number
  distribution: { '1': number, '2': number, '3': number, '4': number, '5': number }
  averageSubRatings: { productQuality: number, deliveryExperience: number, sellerService: number }
  counts: { verified: number, withPhotos: number, withReply: number }
}

export default function ReviewsSection({ listingId, sellerId }: ReviewsSectionProps) {
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const url = `/api/marketplace/reviews/listing/${listingId}?sort=${sort}&filter=${filter}&page=${page}&limit=10`
      const res = await fetch(url)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchReviews() }, [listingId, sort, filter, page])

  // Get current user (for "is seller" check)
  useEffect(() => {
    fetch('/api/wavecore/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.userId) { setCurrentUserId(d.userId); setIsLoggedIn(true) }
      })
      .catch(() => {})
  }, [])

  const isSeller = currentUserId && sellerId && currentUserId === sellerId

  const total = data?.pagination.total || 0
  const dist = data?.distribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  const maxDist = Math.max(...Object.values(dist), 1)

  return (
    <section id="reviews" className="mt-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-amber-500" />
          Customer Reviews
          {total > 0 && <span className="text-base text-neutral-500 font-normal">({total})</span>}
        </h2>
        <button
          onClick={() => {
            if (!isLoggedIn) { window.location.href = '/wavecore-erp/auth/login?redirect=/marketplace/listing/' + listingId; return }
            setShowModal(true)
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold flex items-center gap-2 hover:shadow-lg transition"
        >
          <MessageSquarePlus className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {/* Summary card */}
      {total > 0 && data && (
        <div className="mb-6 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Big average */}
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-500">{data.average}</p>
              <div className="flex justify-center gap-1 mt-2">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={'w-4 h-4 ' + (n <= Math.round(data.average) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700')} />
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">{total} review{total !== 1 ? 's' : ''}</p>
            </div>

            {/* Distribution bars */}
            <div className="space-y-1">
              {[5,4,3,2,1].map(n => {
                const count = (dist as any)[String(n)] || 0
                const pct = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 font-bold">{n}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-neutral-500">{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Sub-ratings */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide font-bold text-neutral-500">Detailed Ratings</p>
              {data.averageSubRatings.productQuality > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Product Quality</span>
                  <span className="font-bold">{data.averageSubRatings.productQuality}/5</span>
                </div>
              )}
              {data.averageSubRatings.deliveryExperience > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Delivery</span>
                  <span className="font-bold">{data.averageSubRatings.deliveryExperience}/5</span>
                </div>
              )}
              {data.averageSubRatings.sellerService > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Seller Service</span>
                  <span className="font-bold">{data.averageSubRatings.sellerService}/5</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sort + filter */}
      {total > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="helpful">Most helpful</option>
            <option value="rating_high">Highest rated</option>
            <option value="rating_low">Lowest rated</option>
          </select>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border text-sm">
            <option value="all">All reviews</option>
            <option value="verified">Verified purchases only</option>
            <option value="with_photos">With photos</option>
            <option value="with_reply">With seller reply</option>
          </select>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : total === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="font-bold text-neutral-700 dark:text-neutral-300 mb-1">No reviews yet</p>
          <p className="text-sm text-neutral-500">Be the first to share your experience</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.reviews.map((review: any) => (
            <ReviewCard
              key={review.id}
              review={review}
              isLoggedIn={isLoggedIn}
              isSeller={!!isSeller}
              onRefresh={fetchReviews}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border text-sm font-bold disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page >= data.pagination.totalPages}
            className="px-4 py-2 rounded-lg border text-sm font-bold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <WriteReviewModal
          listingId={listingId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { fetchReviews() }}
        />
      )}
    </section>
  )
}