'use client'

import { authedFetch, redirectToLogin } from '@/lib/wavecore/csrf-client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Zap, Truck, DollarSign, Award, Shield, Loader2, MapPin, CheckCircle2,
  AlertTriangle, ArrowLeft, Package, Store, Clock, Star, Route, Navigation,
} from 'lucide-react'

type Strategy = 'fastest' | 'cheapest' | 'trusted'

export default function CheckoutPage() {
  const router = useRouter()
  const [options, setOptions] = useState<any>(null)
  const [offersByItem, setOffersByItem] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Strategy>('fastest')
  const [buyerLocation, setBuyerLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch routing options
  const fetchRouting = async (lat?: number, lng?: number) => {
    setLoading(true)
    setError('')
    try {
      const body: any = { latitude: lat, longitude: lng }
      const res = await authedFetch('/api/marketplace/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = res.data || res
      if (!res.ok) { setError(data.error || 'Failed to load options'); return }
      setOptions(data.options)
      setOffersByItem(data.offersByItem || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  // Detect buyer location
  const detectLocation = async () => {
    setLocating(true)
    try {
      const pos: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setBuyerLocation(loc)
      await fetchRouting(loc.lat, loc.lng)
    } catch {
      setError('Location denied — showing default routing')
      await fetchRouting()
    } finally { setLocating(false) }
  }

  useEffect(() => {
    // Try auto-detect on load
    navigator.permissions?.query({ name: 'geolocation' as any }).then((p: any) => {
      if (p.state === 'granted') detectLocation()
      else fetchRouting()
    }).catch(() => fetchRouting())
  }, [])

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!shippingAddress.trim()) { setError('Shipping address required'); return }
    setPlacing(true)
    try {
      // The checkout API uses the cart as-is; routing is informational.
      // In future: pass selected strategy to checkout to enforce routing.
      const res = await authedFetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress,
          buyerPhone,
          notes,
          latitude: buyerLocation?.lat,
          longitude: buyerLocation?.lng,
        }),
      })
      if (res.needsLogin) { redirectToLogin(); return }
      const data = res.data
      if (!res.ok) { setError(data.error || 'Checkout failed'); return }
      router.push('/wavecore-erp/marketplace/orders/' + data.orderId)
    } catch { setError('Network error') }
    finally { setPlacing(false) }
  }

  const strategyInfo: Record<Strategy, { label: string; icon: any; color: string; desc: string }> = {
    fastest: { label: 'Fastest', icon: Zap, color: 'from-blue-600 to-cyan-700', desc: 'Nearest seller — shortest delivery time' },
    cheapest: { label: 'Cheapest', icon: DollarSign, color: 'from-green-600 to-emerald-700', desc: 'Lowest total cost including delivery' },
    trusted: { label: 'Most Trusted', icon: Award, color: 'from-amber-600 to-orange-700', desc: 'Highest seller rating + fulfillment score' },
  }

  const currentOption = options?.[selected]

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket Checkout</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Route className="w-7 h-7 text-indigo-400" /> Smart Checkout
            </h1>
            <p className="text-sm text-neutral-400 mt-1">WaveMarket routing engine picks the best seller for you</p>
          </div>
          <button onClick={detectLocation} disabled={locating} className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {buyerLocation ? 'Update Location' : 'Enable Location'}
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {buyerLocation && (
          <div className="mb-4 p-3 rounded-xl bg-blue-900/20 border border-blue-800 flex items-center gap-2 text-xs text-blue-200">
            <MapPin className="w-4 h-4" /> Using your location: {buyerLocation.lat.toFixed(4)}, {buyerLocation.lng.toFixed(4)}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : !options ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <p className="text-neutral-400">Failed to load routing options</p>
            <p className="text-xs text-neutral-500 mt-2">Add items to your cart first</p>
            <Link href="/wavecore-erp/marketplace/cart" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Go to Cart
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            {/* LEFT: Routing strategies */}
            <div className="space-y-6">
              {/* Strategy picker */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Choose Routing Strategy
                </h2>
                <div className="grid md:grid-cols-3 gap-3">
                  {(['fastest', 'cheapest', 'trusted'] as Strategy[]).map(s => {
                    const info = strategyInfo[s]
                    const Icon = info.icon
                    const opt = options[s]
                    const isSelected = selected === s
                    return (
                      <button
                        key={s}
                        onClick={() => setSelected(s)}
                        className={'p-5 rounded-2xl text-left border-2 transition-all ' + (isSelected ? 'border-white ring-4 ring-white/20' : 'border-transparent hover:border-white/30') + ' bg-gradient-to-br ' + info.color}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Icon className="w-6 h-6 text-white" />
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <p className="text-lg font-bold text-white mb-1">{info.label}</p>
                        <p className="text-xs text-white/80 mb-3">{info.desc}</p>
                        <div className="pt-3 border-t border-white/20 space-y-1">
                          <div className="flex justify-between text-xs text-white/90">
                            <span>Items:</span><span className="font-bold">{opt?.itemCount || 0}</span>
                          </div>
                          <div className="flex justify-between text-xs text-white/90">
                            <span>Sellers:</span><span className="font-bold">{opt?.sellerCount || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm text-white font-bold pt-1">
                            <span>Total:</span><span>KES {Number(opt?.total || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selected strategy details */}
              {currentOption && (
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                  <div className="p-5 border-b border-neutral-800">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                      {(() => { const Icon = strategyInfo[selected].icon; return <Icon className="w-4 h-4 text-white" /> })()}
                      {strategyInfo[selected].label} Routing · {currentOption.selections.length} item{currentOption.selections.length !== 1 ? 's' : ''}
                    </h3>
                  </div>
                  <div className="divide-y divide-neutral-800">
                    {currentOption.selections.map((sel: any, i: number) => (
                      <div key={i} className="p-4 flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-neutral-800 overflow-hidden flex-shrink-0">
                          {sel.images?.[0] ? (
                            <img src={sel.images[0]} alt={sel.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">{sel.title}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-neutral-500 mt-1">
                            <span className="flex items-center gap-1"><Store className="w-3 h-3" />{sel.storeName || sel.sellerName}</span>
                            {sel.distance !== null && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{sel.distance} km</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sel.eta}</span>
                            {sel.averageRating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{sel.averageRating}</span>}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-neutral-500">Qty {sel.quantity} × KES {Number(sel.unitPrice).toLocaleString()}</span>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">KES {Number(sel.lineTotal).toLocaleString()}</p>
                              {sel.deliveryCost > 0 && <p className="text-[10px] text-neutral-500">+ KES {Number(sel.deliveryCost).toLocaleString()} delivery</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transparency: all offers per item */}
              {offersByItem.length > 0 && (
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-amber-400 mb-3">
                    All Seller Offers ({offersByItem.reduce((s, o) => s + o.offerCount, 0)})
                  </h3>
                  <div className="space-y-3">
                    {offersByItem.map((o, i) => (
                      <div key={i} className="p-3 rounded-xl bg-neutral-800">
                        <p className="text-xs text-neutral-400 mb-2">For: <span className="text-white font-bold">{o.requested.title || 'Item'}</span> (×{o.requested.quantity})</p>
                        <div className="space-y-1">
                          {o.offers.slice(0, 5).map((offer: any, j: number) => (
                            <div key={j} className="flex justify-between items-center text-xs py-1">
                              <span className="text-neutral-300 truncate flex-1">{offer.storeName || offer.sellerName}</span>
                              <span className="text-neutral-500 mx-2">{offer.distance !== null ? offer.distance + 'km' : '—'}</span>
                              <span className="text-neutral-500 mx-2">{offer.deliveryEta}</span>
                              <span className="text-amber-400 font-bold">KES {Number(offer.totalCost).toLocaleString()}</span>
                              <span className="ml-3 px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 text-[10px] font-bold">Score {offer.fulfillmentScore}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Delivery details + confirm */}
            <form onSubmit={placeOrder} className="lg:sticky lg:top-24 h-fit space-y-4">
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-400" /> Delivery Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Address *</label>
                    <textarea
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      required
                      rows={3}
                      className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                      placeholder="Street, building, city"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Phone</label>
                    <input
                      value={buyerPhone}
                      onChange={e => setBuyerPhone(e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                      placeholder="0712 345 678"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Notes</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              {/* Order summary */}
              {currentOption && (
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" /> Order Summary
                  </h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Subtotal ({currentOption.itemCount})</span>
                      <span className="text-white">KES {Number(currentOption.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Delivery</span>
                      <span className="text-white">KES {Number(currentOption.deliveryFee).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="border-t border-neutral-800 pt-3 mb-4 flex justify-between items-center">
                    <span className="font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-amber-400">KES {Number(currentOption.total).toLocaleString()}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={placing}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    {placing ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-blue-900/20 border border-blue-800/50">
                <p className="text-xs text-blue-200 space-y-1">
                  <span className="flex items-center gap-1 font-bold"><Shield className="w-3 h-3" /> Buyer Protection</span>
                  <span className="block">Full refund if item doesn't arrive, arrives damaged, or isn't as described.</span>
                </p>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}