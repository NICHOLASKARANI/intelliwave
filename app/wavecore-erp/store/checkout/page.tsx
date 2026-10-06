'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CreditCard, Phone, Loader2, CheckCircle, Package, ArrowLeft, AlertTriangle } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function CheckoutPage() {
  const csrf = () => (typeof document === 'undefined') ? '' : (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')
  const [items, setItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState<{ number: string; total: number } | null>(null)
  const [error, setError] = useState('')

  // Load cart from sessionStorage (set by /store/cart)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('wavecore_pos_cart')
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const total = items.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0)

  const handleCheckout = async () => {
    if (items.length === 0) { setError('Cart is empty'); return }
    setProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/store/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
          total,
          customerName,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Sale failed'); return }
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

      <main className="max-w-xl mx-auto p-4 lg:p-8">
        {success ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sale Complete</h1>
            <p className="text-muted-foreground">Sale <span className="font-mono font-bold">{success.number}</span></p>
            <p className="text-2xl font-bold text-green-600 my-4">KSh {success.total.toLocaleString()}</p>
            <div className="flex gap-2 justify-center mt-6">
              <Link href="/wavecore-erp/store/receipts" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">
                View Receipts
              </Link>
              <Link href="/wavecore-erp/store/sales/create" className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">
                New Sale
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Link href="/wavecore-erp/store/cart" className="flex items-center gap-1 text-sm text-blue-600 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </Link>

            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-pink-500" /> Checkout
            </h1>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            {/* Cart contents */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border mb-4 overflow-hidden">
              <div className="px-4 py-3 border-b text-xs uppercase tracking-wide text-muted-foreground font-bold flex items-center gap-2">
                <Package className="w-4 h-4" /> Cart ({items.length})
              </div>
              {items.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No items in cart. Add products from the store page first.
                </p>
              ) : (
                <div className="divide-y">
                  {items.map(i => (
                    <div key={i.id} className="px-4 py-3 flex justify-between text-sm">
                      <div>
                        <p className="font-bold">{i.name}</p>
                        <p className="text-xs text-muted-foreground">{i.quantity} × KSh {Number(i.price).toLocaleString()}</p>
                      </div>
                      <p className="font-bold">KSh {(i.quantity * i.price).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="px-4 py-3 flex justify-between font-bold bg-neutral-50 dark:bg-neutral-800/50">
                    <span>Total</span>
                    <span className="text-green-600">KSh {total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Customer</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer" className="w-full px-4 py-2.5 rounded-xl border" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <button type="button" className="w-full p-4 rounded-xl border bg-green-50 border-green-500 text-left">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span className="font-bold">M-Pesa on Delivery</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recorded as a POS sale. Reconcile M-Pesa settlements from Finance → Bank Reconciliation.
                  </p>
                </button>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Phone (optional, for receipt)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX" className="w-full px-4 py-2.5 rounded-xl border" />
              </div>

              <button onClick={handleCheckout} disabled={processing || items.length === 0}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {processing ? 'Recording sale...' : 'Complete Sale — KSh ' + total.toLocaleString()}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Records a real POS sale in SalesOrder. Charges nothing to the customer's phone.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}