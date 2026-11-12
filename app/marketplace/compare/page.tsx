'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ChevronLeft, Check, X, Store, MapPin, Package } from 'lucide-react'

function CompareInner() {
  const params = useSearchParams()
  const idsParam = params.get('ids') || ''
  const ids = idsParam.split(',').map(x => parseInt(x, 10)).filter(x => !isNaN(x))
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    { key: 'location', label: 'Location', render: l => l.location || '—' },
    { key: 'stock', label: 'In Stock', render: l => l.stock > 0 ? <span className="text-green-400 flex items-center gap-1"><Check className="w-4 h-4" />{l.stock} available</span> : <span className="text-red-400 flex items-center gap-1"><X className="w-4 h-4" />Out of stock</span> },
    { key: 'rating', label: 'Rating', render: l => l.sellerRating > 0 ? `⭐ ${Number(l.sellerRating).toFixed(1)} (${l.sellerTotalReviews || 0})` : 'No rating' },
    { key: 'seller', label: 'Seller', render: l => l.storeName || l.sellerName || '—' },
    { key: 'sellerVerification', label: 'Verification', render: l => l.sellerVerification === 'VERIFIED' ? <span className="text-green-400">✓ Verified</span> : l.sellerVerification === 'TRUSTED_SELLER' ? <span className="text-amber-400">⭐ Trusted</span> : 'Unverified' },
    { key: 'views', label: 'Views', render: l => l.views || 0 },
    { key: 'sku', label: 'SKU', render: l => l.sku || '—' },
  ]

  const cheapestPrice = Math.min(...listings.map(l => Number(l.price)))
  const highestRating = Math.max(...listings.map(l => Number(l.sellerRating || 0)))

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <h1 className="text-lg font-bold">Compare Products ({listings.length})</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className={`grid gap-4 ${listings.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {listings.map(l => (
            <div key={l.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <Link href={`/marketplace/listing/${l.id}`}>
                <div className="aspect-square bg-neutral-800 relative">
                  {l.images?.[0] ? (
                    <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-neutral-700" /></div>
                  )}
                  {Number(l.price) === cheapestPrice && (
                    <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold">BEST PRICE</span>
                  )}
                  {Number(l.sellerRating || 0) === highestRating && highestRating > 0 && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">TOP RATED</span>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/marketplace/listing/${l.id}`}>
                  <h3 className="font-bold text-sm mb-2 hover:text-amber-400 line-clamp-2">{l.title}</h3>
                </Link>
                <Link href={`/marketplace/listing/${l.id}`}
                  className="block w-full py-2 rounded-xl bg-amber-500 text-white text-center text-sm font-bold hover:bg-amber-600">
                  View & Buy
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-8 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <table className="w-full">
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.key} className={idx % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-950'}>
                  <td className="p-3 text-xs uppercase font-bold text-neutral-500 w-32 border-r border-neutral-800">{row.label}</td>
                  {listings.map(l => (
                    <td key={l.id} className="p-3 text-sm border-r border-neutral-800 last:border-r-0">{row.render(l)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Description */}
        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `repeat(${listings.length}, minmax(0, 1fr))` }}>
          {listings.map(l => (
            <div key={l.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
              <h4 className="text-xs uppercase font-bold text-neutral-500 mb-2">Description</h4>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">{l.description || 'No description'}</p>
            </div>
          ))}
        </div>
      </main>
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