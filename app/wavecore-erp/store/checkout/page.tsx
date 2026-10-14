'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, CheckCircle, ArrowLeft, AlertTriangle, MapPin } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'
import { usePosShop } from '@/lib/wavecore/context/pos-shop-context'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface LocationOpt {
  id: string
  name: string
  code: string
  warehouseName: string
}

export default function CheckoutPage() {
  const { shopId: ctxShopId } = usePosShop()
  const [items, setItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState<{ number: string; total: number } | null>(null)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState<LocationOpt[]>([])
  const [locationId, setLocationId] = useState('')

  // Sync with POS context shop (cookie-backed)
  useEffect(() => {
    if (ctxShopId) setLocationId(ctxShopId)
  }, [ctxShopId])
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('wavecore_pos_cart')
      if (raw) setItems(JSON.parse(raw))
    } catch {}

    // Load available shops/locations
    ;(async () => {
      try {
        const res = await authedFetch('/api/wavecore/inventory/warehouses')
        const data = await res.json()
        const wares = data.warehouses || []
        // For each warehouse, we need its locations. Fetch lazily in parallel.
        const locs: LocationOpt[] = []
        await Promise.all(wares.map(async (w: any) => {
          try {
            const r2 = await authedFetch('/api/wavecore/inventory/warehouses/' + w.id + '/locations')
            const d2 = await r2.json()
            for (const l of d2.locations || []) {
              locs.push({ id: l.id, name: l.name, code: l.code, warehouseName: w.name })
            }
          } catch {}
        }))
        setLocations(locs)
        // Pick a saved shop if there's one
        try {
          const saved = sessionStorage.getItem('wavecore_pos_shop')
          if (saved && locs.some(l => l.id === saved)) setLocationId(saved)
          else if (locs.length === 1) setLocationId(locs[0].id)
        } catch {}
      } catch {} finally {
        setLoadingLocations(false)
      }
    })()
  }, [])

  const total = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0)

  const handleCheckout = async () => {
    if (items.length === 0) { setError('Cart is empty'); return }
    if (!locationId) { setError('Please select the shop this sale is being made from'); return }
    setProcessing(true)
    setError('')
    try {
      const res = await authedFetch('/api/wavecore/store/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          total,
          customerName,
          locationId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Sale failed'); return }
      try { sessionStorage.setItem('wavecore_pos_shop', locationId) } catch {}
      setSuccess({ number: data.sale?.number || 'SALE', total })
      try { sessionStorage.removeItem('wavecore_pos_cart') } catch {}
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Checkout</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/store/cart" className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {success ? (
          <div className="p-8 rounded-2xl bg-green-50 border border-green-200 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Sale Complete</h2>
            <p className="text-sm text-green-600">Receipt: <span className="font-mono font-bold">{success.number}</span></p>
            <p className="text-lg font-bold text-green-700 mt-2">KSh {success.total.toLocaleString()}</p>
            <Link href="/wavecore-erp/store/sales" className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold">View Sales</Link>
          </div>
        ) : (
          <>
            {/* Shop selector */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 mb-4">
              <label className="text-sm font-bold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" /> Selling From (Shop)
              </label>
              {loadingLocations ? (
                <div className="text-sm text-muted-foreground"><Loader2 className="w-4 h-4 inline animate-spin mr-1" /> Loading shops...</div>
              ) : locations.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  No shops yet. Create a warehouse with a location under Inventory → Warehouses.
                </div>
              ) : (
                <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="">Select shop...</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.warehouseName} · {l.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Cart items */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 mb-4">
              <h2 className="font-bold mb-3">Cart ({items.length})</h2>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
              ) : (
                <div className="space-y-2">
                  {items.map(i => (
                    <div key={i.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{i.name}</p>
                        <p className="text-xs text-muted-foreground">{i.quantity} × KSh {Number(i.price || 0).toLocaleString()}</p>
                      </div>
                      <p className="font-bold">KSh {(Number(i.price || 0) * Number(i.quantity || 0)).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-blue-600">KSh {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer + payment */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-5 mb-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Customer Name</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border">
                    <option value="mpesa">M-Pesa</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                {paymentMethod === 'mpesa' && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">M-Pesa Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254..." className="w-full px-4 py-2.5 rounded-xl border" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            <button onClick={handleCheckout}
              disabled={processing || items.length === 0 || !locationId}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {processing ? 'Processing...' : 'Complete Sale — KSh ' + total.toLocaleString()}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
