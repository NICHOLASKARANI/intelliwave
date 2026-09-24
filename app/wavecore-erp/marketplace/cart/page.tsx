'use client'

import { authedFetch, redirectToLogin } from '@/lib/wavecore/csrf-client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Loader2, Trash2, Plus, Minus, ArrowLeft, AlertTriangle,
  CheckCircle2, Package, Truck, Shield, MapPin, Zap, Tag, Store,
} from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updating, setUpdating] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    shippingAddress: '', buyerPhone: '', notes: '',
  })
  const [placing, setPlacing] = useState(false)

  const fetchCart = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/marketplace/cart')
      const data = await res.json()
      setItems(data.items || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchCart() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }

  const updateQty = async (itemId: string, newQty: number) => {
    setUpdating(itemId)
    try {
      const res = await authedFetch('/api/marketplace/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQty }),
      })
      if (res.ok) { flash('Updated'); fetchCart() }
    } finally { setUpdating('') }
  }

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove item from cart?')) return
    setUpdating(itemId)
    try {
      const res = await fetch('/api/marketplace/cart?itemId=' + itemId, { method: 'DELETE' })
      if (res.ok) { flash('Removed'); fetchCart() }
    } finally { setUpdating('') }
  }

  const clearCart = async () => {
    if (!confirm('Clear all items from cart?')) return
    const res = await fetch('/api/marketplace/cart?clear=true', { method: 'DELETE' })
    if (res.ok) { flash('Cart cleared'); fetchCart() }
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!checkoutForm.shippingAddress.trim()) { setError('Shipping address required'); return }

    setPlacing(true)
    try {
      // Optionally get geolocation for routing
      let latitude: number | null = null
      let longitude: number | null = null
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        })
        latitude = pos.coords.latitude
        longitude = pos.coords.longitude
      } catch {}

      const res = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkoutForm, latitude, longitude }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Checkout failed'); return }

      // Success → go to order detail
      router.push('/wavecore-erp/marketplace/orders/' + data.orderId)
    } catch { setError('Network error') }
    finally { setPlacing(false) }
  }

  const subtotal = summary.subtotal || 0
  const delivery = summary.deliveryFee || 0
  const total = summary.total || 0

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket</span>
          </Link>
          <span className="text-sm text-neutral-400">Shopping Cart</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <ShoppingCart className="w-7 h-7 text-amber-400" /> Shopping Cart
            </h1>
            <p className="text-sm text-neutral-400 mt-1">{summary.itemCount || 0} item(s) · {summary.sellerCount || 0} seller(s)</p>
          </div>
          <Link href="/wavecore-erp/marketplace" className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">Your cart is empty</p>
            <Link href="/wavecore-erp/marketplace" className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-2">
              <Tag className="w-4 h-4" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* Items */}
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-neutral-800 overflow-hidden flex-shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <Link href={'/wavecore-erp/marketplace/listing/' + item.listingId} className="font-bold text-white hover:text-amber-400">
                        {item.title}
                      </Link>
                      <button onClick={() => removeItem(item.id)} disabled={updating === item.id} className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mb-3">
                      <span className="flex items-center gap-1"><Store className="w-3 h-3" />{item.sellerName || 'Seller'}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location || 'No location'}</span>
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.category || 'GENERAL'}</span>
                    </div>
                    {item.unavailable && (
                      <div className="mb-2 p-2 rounded-lg bg-red-900/30 border border-red-800 text-xs text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Item unavailable
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 bg-neutral-800 rounded-xl">
                        <button onClick={() => updateQty(item.id, Number(item.quantity) - 1)} disabled={updating === item.id || item.quantity <= 1} className="p-2 hover:bg-neutral-700 rounded-l-xl disabled:opacity-30">
                          <Minus className="w-3 h-3 text-white" />
                        </button>
                        <span className="px-3 text-white font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, Number(item.quantity) + 1)} disabled={updating === item.id || item.quantity >= item.stock} className="p-2 hover:bg-neutral-700 rounded-r-xl disabled:opacity-30">
                          <Plus className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">KES {Number(item.unitPrice).toLocaleString()} × {item.quantity}</p>
                        <p className="text-lg font-bold text-amber-400">KES {Number(item.lineTotal).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 font-bold">
                Clear entire cart
              </button>
            </div>

            {/* Summary sidebar */}
            <div className="lg:sticky lg:top-24 h-fit bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Subtotal ({summary.itemCount})</span>
                  <span className="text-white font-bold">KES {Number(subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400 flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery ({summary.sellerCount} seller{summary.sellerCount !== 1 ? 's' : ''})</span>
                  <span className="text-white font-bold">KES {Number(delivery).toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-neutral-800 pt-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-2xl font-bold text-amber-400">KES {Number(total).toLocaleString()}</span>
                </div>
              </div>

              {summary.unavailableCount > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-xs text-red-300">
                  <AlertTriangle className="w-3 h-3 inline mr-1" /> {summary.unavailableCount} item(s) unavailable. Remove them to proceed.
                </div>
              )}

              <button
                onClick={() => setShowCheckout(true)}
                disabled={summary.unavailableCount > 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Shield className="w-5 h-5" /> Proceed to Checkout
              </button>

              <div className="mt-4 space-y-2 text-xs text-neutral-500">
                <p className="flex items-center gap-1"><Shield className="w-3 h-3" /> Buyer protected by WaveMarket Guarantee</p>
                <p className="flex items-center gap-1"><Truck className="w-3 h-3" /> Smart routing picks fastest seller</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCheckout(false)}>
          <form onSubmit={placeOrder} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
            <div className="p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" /> Confirm Checkout
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Enter delivery details to place your order</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Shipping Address *</label>
                <textarea
                  value={checkoutForm.shippingAddress}
                  onChange={e => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })}
                  required
                  rows={3}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                  placeholder="Street, building, city"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Phone</label>
                <input
                  value={checkoutForm.buyerPhone}
                  onChange={e => setCheckoutForm({ ...checkoutForm, buyerPhone: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                  placeholder="0712 345 678"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Notes for seller</label>
                <textarea
                  value={checkoutForm.notes}
                  onChange={e => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm"
                  placeholder="Delivery instructions, landmarks, etc."
                />
              </div>
              <div className="p-3 rounded-xl bg-blue-900/20 border border-blue-800/50 text-xs text-blue-200">
                <p><b>Smart routing enabled:</b> We'll match your address to the nearest sellers. First order may prompt for location permission.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => setShowCheckout(false)} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" disabled={placing} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {placing ? 'Placing Order...' : 'Place Order · KES ' + Number(total).toLocaleString()}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}