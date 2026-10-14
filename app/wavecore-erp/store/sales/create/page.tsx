'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart, Search, Plus, Trash2, Loader2, CheckCircle2,
  ArrowLeft, Package, MapPin, AlertTriangle
} from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

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

export default function CreateSalePage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [locations, setLocations] = useState<LocationOpt[]>([])
  const [locationId, setLocationId] = useState('')
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await authedFetch('/api/wavecore/store')
        const data = await res.json()
        setProducts(data.products || [])
      } catch {
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }

      setLoadingLocations(true)
      try {
        const wRes = await authedFetch('/api/wavecore/inventory/warehouses')
        const wData = await wRes.json()
        const wares = wData.warehouses || []
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

  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.sellingPrice || 0),
        quantity: 1,
      }]
    })
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const handleSubmit = async () => {
    if (cart.length === 0) { setError('Cart is empty'); return }
    if (!locationId) { setError('Please select the shop this sale is being made from'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await authedFetch('/api/wavecore/store/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: cartTotal,
          customerName: customerName || 'Walk-in Customer',
          locationId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Sale failed'); return }
      try { sessionStorage.setItem('wavecore_pos_shop', locationId) } catch {}
      setSuccess(true)
      setCart([])
      setCustomerName('')
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store/sales" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">New Sale</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/store/sales" className="flex items-center gap-1 text-sm text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sales
        </Link>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-blue-500" /> New Sale
        </h1>

        {/* Shop picker */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-4">
          <label className="block text-sm font-bold mb-2 flex items-center gap-2">
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

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-50 text-green-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Sale completed</div>}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Products */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-9 pr-4 py-2.5 rounded-xl border w-full" />
            </div>
            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No products</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center text-left">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku || '—'} · KSh {Number(p.sellingPrice || 0).toLocaleString()}</p>
                    </div>
                    <Plus className="w-4 h-4 text-blue-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
            <h2 className="font-bold text-lg mb-4">Cart ({cart.length} items)</h2>

            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full px-4 py-2.5 rounded-xl border mb-4" />

            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">KSh {Number(item.price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 1)}
                        className="w-16 px-2 py-1 rounded-lg border text-center text-sm" />
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-bold">TOTAL</span>
              <span className="text-2xl font-bold text-blue-600">KSh {cartTotal.toLocaleString()}</span>
            </div>

            <button onClick={handleSubmit} disabled={submitting || cart.length === 0 || !locationId}
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}