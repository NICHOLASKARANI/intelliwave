'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, ChevronLeft, Check, X, Package, Share2, Printer,
  ShoppingCart, CheckCircle2, Star, MapPin, Store,
} from 'lucide-react'

function CompareInner() {
  const params = useSearchParams()
  const router = useRouter()
  const idsParam = params.get('ids') || ''
  const ids = idsParam.split(',').map(x => parseInt(x, 10)).filter(x => !isNaN(x))
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (ids.length < 2) { setLoading(false); return }
    fetch('/api/marketplace/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then(r => r.ok ? r.json() : { listings: [] })
      .then(d => setListings(d.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [idsParam])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Compare products on WaveMarket',
          text: `Compare ${listings.length} products side-by-side`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        showToast('Link copied to clipboard!')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        showToast('Link copied!')
      } catch {
        showToast('Share unavailable')
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const removeFromCompare = (removeId: number) => {
    const newIds = ids.filter(id => id !== removeId)
    if (newIds.length < 2) {
      // Can't compare with less than 2 — go back
      router.push('/marketplace')
      return
    }
    router.push(`/marketplace/compare?ids=${newIds.join(',')}`)
  }

  const addToCart = async (listingId: number) => {
    setAddingToCart(listingId)
    try {
      const res = await fetch('/api/marketplace/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, quantity: 1 }),
      })
      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated'))
        showToast('Added to cart!')
      } else {
        const d = await res.json()
        showToast(d.error || 'Failed to add')
      }
    } catch {
      showToast('Network error')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (listings.length < 2) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="border-b border-neutral-800 p-4">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back to Marketplace
          </Link>
        </header>
        <main className="max-w-4xl mx-auto p-8 text-center">
          <X className="w-16 h-16 mx-auto mb-4 text-neutral-700" />
          <p className="text-lg font-bold">Not enough items to compare</p>
          <p className="text-sm text-neutral-500 mt-1">Select at least 2 products to see them side-by-side</p>
        </main>
      </div>
    )
  }

  const rows: { key: string, label: string, render: (l: any) => React.ReactNode }[] = [
    { key: 'price', label: 'Price', render: l => <span className="text-lg font-bold text-amber-400">KES {Number(l.price).toLocaleString()}</span> },
    { key: 'condition', label: 'Condition', render: l => l.condition || '—' },
    { key: 'location', label: 'Location', render: l => l.location ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.location}</span> : '—' },
    { key: 'stock', label: 'In Stock', render: l => l.stock > 0 ? <span className="text-green-400 flex items-center gap-1"><Check className="w-4 h-4" />{l.stock} available</span> : <span className="text-red-400 flex items-center gap-1"><X className="w-4 h-4" />Out of stock</span> },
    { key: 'rating', label: 'Rating', render: l => l.sellerRating > 0 ? <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(l.sellerRating).toFixed(1)} ({l.sellerTotalReviews || 0})</span> : 'No rating' },
    { key: 'seller', label: 'Seller', render: l => <span className="flex items-center gap-1"><Store className="w-3 h-3" />{l.storeName || l.sellerName || '—'}</span> },
    { key: 'sellerVerification', label: 'Verification', render: l => l.sellerVerification === 'VERIFIED' ? <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Verified</span> : l.sellerVerification === 'TRUSTED_SELLER' ? <span className="text-amber-400">⭐ Trusted</span> : 'Unverified' },
    { key: 'views', label: 'Views', render: l => l.views || 0 },
    { key: 'sku', label: 'SKU', render: l => l.sku || '—' },
  ]

  const cheapestPrice = Math.min(...listings.map(l => Number(l.price)))
  const highestRating = Math.max(...listings.map(l => Number(l.sellerRating || 0)))

  return (
    <div className="min-h-screen bg-neutral-950 text-white print:bg-white print:text-black">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur p-4 print:static print:bg-white print:border-black">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold print:hidden">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <h1 className="text-lg font-bold flex-1 text-center print:text-black">
            Compare Products ({listings.length})
          </h1>
          <div className="flex items-center gap-1 print:hidden">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-neutral-800"
              title="Share comparison"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-neutral-800"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8 pb-24">
        {/* Product cards — sticky on scroll */}
        <div className={`grid gap-4 ${listings.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} print:grid-cols-3`}>
          {listings.map(l => (
            <div key={l.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden relative print:bg-white print:border-black print:text-black">
              {/* Remove button */}
              {listings.length > 2 && (
                <button
                  onClick={() => removeFromCompare(l.id)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center print:hidden"
                  title="Remove from comparison"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <Link href={`/marketplace/listing/${l.id}`} className="block">
                <div className="aspect-square bg-neutral-800 relative">
                  {l.images?.[0] ? (
                    <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-neutral-700" />
                    </div>
                  )}
                  {Number(l.price) === cheapestPrice && (
                    <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold">
                      BEST PRICE
                    </span>
                  )}
                  {Number(l.sellerRating || 0) === highestRating && highestRating > 0 && Number(l.price) !== cheapestPrice && (
                    <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      TOP RATED
                    </span>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <Link href={`/marketplace/listing/${l.id}`}>
                  <h3 className="font-bold text-sm mb-3 hover:text-amber-400 line-clamp-2 min-h-[2.5rem] print:text-black">
                    {l.title}
                  </h3>
                </Link>
                <div className="space-y-2">
                  <button
                    onClick={() => addToCart(l.id)}
                    disabled={addingToCart === l.id || l.stock <= 0}
                    className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50 print:hidden"
                  >
                    {addingToCart === l.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
                    {addingToCart === l.id ? 'Adding...' : l.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <Link
                    href={`/marketplace/listing/${l.id}`}
                    className="block w-full py-2 rounded-xl bg-amber-500 text-white text-center text-xs font-bold hover:bg-amber-600"
                  >
                    View & Buy
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table — horizontally scrollable on mobile */}
        <div className="mt-8 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-x-auto print:bg-white print:border-black print:overflow-visible">
          <table className="w-full min-w-[600px] print:min-w-0">
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.key} className={idx % 2 === 0 ? 'bg-neutral-900 print:bg-white' : 'bg-neutral-950 print:bg-gray-50'}>
                  <td className="p-3 text-xs uppercase font-bold text-neutral-500 w-32 border-r border-neutral-800 sticky left-0 bg-inherit z-10 print:text-black print:border-black">
                    {row.label}
                  </td>
                  {listings.map(l => (
                    <td key={l.id} className="p-3 text-sm border-r border-neutral-800 last:border-r-0 print:border-black">
                      {row.render(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Description */}
        <div className="mt-8 grid gap-4 print:grid-cols-3" style={{ gridTemplateColumns: `repeat(${listings.length}, minmax(0, 1fr))` }}>
          {listings.map(l => (
            <div key={l.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 print:bg-white print:border-black print:text-black">
              <h4 className="text-xs uppercase font-bold text-neutral-500 mb-2">Description</h4>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap print:text-black">
                {l.description || 'No description'}
              </p>
            </div>
          ))}
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 text-center text-xs text-neutral-500">
          Compared on WaveMarket · {new Date().toLocaleDateString('en-KE')} · www.intelliwavve.com/marketplace
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {toast}
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>}>
      <CompareInner />
    </Suspense>
  )
}