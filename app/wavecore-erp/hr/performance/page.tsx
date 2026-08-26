'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Award, Loader2, Star } from 'lucide-react'

interface PerformanceReview {
  id: string
  employeeName: string
  score: number
  reviewerName: string
  createdAt: string
}

export default function PerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/wavecore/hr/performance')
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/hr" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Performance</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-indigo-500" /> Performance Reviews ({reviews.length})
        </h1>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No performance reviews</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900">
                <div className="flex justify-between items-center">
                  <p className="font-bold">{review.employeeName}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{review.score}/5</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Reviewed by {review.reviewerName}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}