'use client'

import { useState } from 'react'
import { X, Star, Loader2, Upload, Image as ImageIcon } from 'lucide-react'

interface WriteReviewModalProps {
  listingId: number | string
  onClose: () => void
  onSuccess: () => void
}

export default function WriteReviewModal({ listingId, onClose, onSuccess }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [productQuality, setProductQuality] = useState(0)
  const [deliveryExperience, setDeliveryExperience] = useState(0)
  const [sellerService, setSellerService] = useState(0)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (photos.length + files.length > 5) { setError('Max 5 photos'); return }
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) { setError('Only image files'); continue }
        if (file.size > 10 * 1024 * 1024) { setError('Each image max 10MB'); continue }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', `review-${listingId}-${Date.now()}`)
        const res = await fetch('/api/marketplace/upload', { method: 'POST', body: fd })
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Upload failed'); continue }
        const { url } = await res.json()
        if (url) setPhotos(prev => [...prev, url])
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
    } finally { setUploading(false) }
  }

  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i))

  const submit = async () => {
    setError('')
    if (rating < 1 || rating > 5) { setError('Please choose a star rating'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/marketplace/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: typeof listingId === 'string' ? parseInt(listingId) : listingId,
          rating,
          title: title.trim(),
          body: body.trim(),
          photos,
          productQuality: productQuality || null,
          deliveryExperience: deliveryExperience || null,
          sellerService: sellerService || null,
        }),
      })
      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to submit review')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally { setSubmitting(false) }
  }

  const StarSelector = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) => (
    <div>
      <label className="text-[11px] uppercase tracking-wide font-bold text-neutral-500 mb-1 block">{label}</label>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className="transition">
            <Star className={'w-5 h-5 ' + (n <= value ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700')} />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <h2 className="font-bold text-lg">Write a Review</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Main rating */}
          <div>
            <label className="text-xs uppercase tracking-wide font-bold text-neutral-500 mb-2 block">Your Rating *</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition"
                >
                  <Star className={'w-9 h-9 ' + (n <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700')} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] uppercase tracking-wide font-bold text-neutral-500 mb-1 block">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Sum up your experience"
              maxLength={120}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-[11px] uppercase tracking-wide font-bold text-neutral-500 mb-1 block">Your review</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What did you like or dislike? Was it as described?"
              rows={5}
              maxLength={3000}
              className="w-full px-3 py-2 rounded-lg border text-sm"
            />
            <p className="text-[10px] text-neutral-500 mt-1">{body.length}/3000</p>
          </div>

          {/* Photos */}
          <div>
            <label className="text-[11px] uppercase tracking-wide font-bold text-neutral-500 mb-1 block">Add Photos (optional, max 5)</label>
            <div className="flex flex-wrap gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5 text-neutral-400" />}
                  <input type="file" accept="image/*" multiple onChange={uploadPhoto} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {/* Sub-ratings */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs uppercase tracking-wide font-bold text-neutral-500 mb-3">Detailed Ratings (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StarSelector value={productQuality} onChange={setProductQuality} label="Product Quality" />
              <StarSelector value={deliveryExperience} onChange={setDeliveryExperience} label="Delivery" />
              <StarSelector value={sellerService} onChange={setSellerService} label="Seller Service" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2 sticky bottom-0 bg-white dark:bg-neutral-900">
          <button
            onClick={submit}
            disabled={submitting || rating < 1}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Submitting...' : 'Post Review'}
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}