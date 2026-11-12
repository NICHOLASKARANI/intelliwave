'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Loader2, Trash2, Plus, Minus, Store, ChevronLeft, Package, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { fetchCart() }, [])

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/marketplace/cart')
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  const updateQty = async (itemId: string, quantity: number) => {
    if (quantity < 1) { removeItem(itemId); return }
    setUpdating(itemId)
    try {
      await fetch(`/api/marketplace/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
      window.dispatchEvent(new Event('cart-updated'))
      await fetchCart()
    } finally { setUpdating(null) }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      await fetch(`/api/marketplace/cart/${itemId}`, { method: 'DELETE' })
      window.dispatchEvent(new Event('cart-updated'))
      await fetchCart()
    } finally { setUpdating(null) }
  }

  const clearAll = async () => {
    if (!confirm('Clear entire cart?')) return
    await fetch('/api/marketplace/cart', { method: 'DELETE' })
    window.dispatchEvent(new Event('cart-updated'))
    await fetchCart()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    )
  }

  const isEmpty = !data?.items || data.items.length === 0

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" /> My Cart
            {!isEmpty && <span className="text-sm text-neutral-500 font-normal">({data.itemCount})</span>}
          </span>
          <div className="w-16">
            {!isEmpty && (
              <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600">Clear</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        {isEmpty ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border">
            <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-1">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-6">Discover products across hundreds of sellers</p>
            <Link href="/marketplace" className="inline-block px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {data.groups.map((group: any) => (
                <div key={group.sellerId} className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
                  <div className="p-3 border-b bg-neutral-50 dark:bg-neutral-800 flex items-center gap-2">
                    <Store className="w-4 h-4 text-cyan-500" />
                    <Link href={`/marketplace?search=&seller=${group.sellerId}`} className="text-sm font-bold hover:text-cyan-500">{group.sellerName}</Link>
                    <span className="text-xs text-neutral-500 ml-auto">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y">
                    {group.items.map((item: any) => (
                      <div key={item.itemId} className="p-4 flex gap-4">
                        <Link href={`/marketplace/listing/${item.listingId}`} className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-neutral-400" /></div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/marketplace/listing/${item.listingId}`} className="font-bold text-sm hover:text-amber-500 block truncate">{item.title}</Link>
                          <p className="text-xs text-neutral-500 mt-1">KES {Number(item.unitPrice).toLocaleString()} each</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                              <button
                                onClick={() => updateQty(item.itemId, item.quantity - 1)}
                                disabled={updating === item.itemId}
                                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-l-xl disabled:opacity-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-3 text-sm font-bold min-w-[30px] text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQty(item.itemId, item.quantity + 1)}
                                disabled={updating === item.itemId || (item.stock !== null && item.quantity >= item.stock)}
                                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-r-xl disabled:opacity-50"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.itemId)}
                              disabled={updating === item.itemId}
                              className="text-red-500 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">KES {Number(item.lineTotal).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t bg-neutral-50 dark:bg-neutral-800 text-right text-sm">
                    Subtotal: <span className="font-bold">KES {group.subtotal.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 sticky top-24">
                <h2 className="font-bold text-lg mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal ({data.itemCount} item{data.itemCount !== 1 ? 's' : ''})</span>
                    <span className="font-bold">KES {data.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Delivery</span>
                    <span className="text-xs text-neutral-500">Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-green-600">KES {data.subtotal.toLocaleString()}</span>
                  </div>
                </div>
                <Link
                  href="/marketplace/checkout"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-center flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-xs text-neutral-500 text-center mt-3">
                  Secure payment · M-Pesa supported
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}