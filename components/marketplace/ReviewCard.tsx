'use client'

import { useState } from 'react'
import { Star, ThumbsUp, Flag, MessageSquare, CheckCircle } from 'lucide-react'

interface Review {
  id: string
  reviewerName: string | null
  rating: number
  title: string | null
  body: string | null
  isVerified: boolean
  helpfulCount: number
  photos?: string[]
  videos?: string[]
  sellerReply: string | null
  sellerReplyAt: string | null
  productQuality: number | null
  deliveryExperience: number | null
  sellerService: number | null
  createdAt: string
}

interface ReviewCardProps {
  review: Review
  isLoggedIn: boolean
  isSeller: boolean
  onRefresh: () => void
}

export default function ReviewCard({ review, isLoggedIn, isSeller, onRefresh }: ReviewCardProps) {
  const [helpful, setHelpful] = useState(review.helpfulCount)
  const [voting, setVoting] = useState(false)
  const [reported, setReported] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const voteHelpful = async () => {
    if (!isLoggedIn) { alert('Log in to vote'); return }
    setVoting(true)
    try {
      const res = await fetch(`/api/marketplace/reviews/${review.id}/helpful`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setHelpful(data.helpfulCount)
      }
    } finally { setVoting(false) }
  }

  const reportReview = async () => {
    if (!isLoggedIn) { alert('Log in to report'); return }
    if (reported) return
    const reason = prompt('Why are you reporting this review?\n(spam / fraud / offensive / fake / irrelevant / other)')
    if (!reason) return
    const res = await fetch(`/api/marketplace/reviews/${review.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.toLowerCase().trim() }),
    })
    if (res.ok) { setReported(true); alert('Reported. Admin will review.') }
    else { const d = await res.json(); alert(d.error || 'Report failed') }
  }

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/marketplace/reviews/${review.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      })
      if (res.ok) {
        setReplyText('')
        setShowReplyBox(false)
        onRefresh()
      } else {
        const d = await res.json()
        alert(d.error || 'Reply failed')
      }
    } finally { setSubmittingReply(false) }
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating)

  return (
    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm">{review.reviewerName || 'Anonymous'}</span>
            {review.isVerified && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {stars.map((filled, i) => (
              <Star key={i} className={'w-3.5 h-3.5 ' + (filled ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700')} />
            ))}
            <span className="text-xs text-neutral-500 ml-1">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={reportReview}
          disabled={reported}
          className="text-neutral-400 hover:text-red-500 disabled:opacity-50 transition"
          title={reported ? 'Reported' : 'Report'}
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title + body */}
      {review.title && <p className="font-bold text-sm mb-1">{review.title}</p>}
      {review.body && <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap mb-3">{review.body}</p>}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {review.photos.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <img src={url} alt={`Photo ${i+1}`} className="w-20 h-20 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 hover:opacity-90 transition" />
            </a>
          ))}
        </div>
      )}

      {/* Sub-ratings */}
      {(review.productQuality || review.deliveryExperience || review.sellerService) && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          {review.productQuality && (
            <div className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Product</p>
              <p className="font-bold">{review.productQuality}/5</p>
            </div>
          )}
          {review.deliveryExperience && (
            <div className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Delivery</p>
              <p className="font-bold">{review.deliveryExperience}/5</p>
            </div>
          )}
          {review.sellerService && (
            <div className="px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Service</p>
              <p className="font-bold">{review.sellerService}/5</p>
            </div>
          )}
        </div>
      )}

      {/* Seller reply */}
      {review.sellerReply && (
        <div className="ml-4 mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border-l-2 border-blue-500">
          <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Seller Response</p>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">{review.sellerReply}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={voteHelpful}
          disabled={voting}
          className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition disabled:opacity-50"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful ({helpful})
        </button>

        {isSeller && !review.sellerReply && (
          <button
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Reply as Seller
          </button>
        )}
      </div>

      {/* Reply box */}
      {showReplyBox && (
        <div className="mt-3">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write your response to this review..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={submitReply}
              disabled={submittingReply || !replyText.trim()}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-50"
            >
              {submittingReply ? 'Posting...' : 'Post Reply'}
            </button>
            <button
              onClick={() => { setShowReplyBox(false); setReplyText('') }}
              className="px-4 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}