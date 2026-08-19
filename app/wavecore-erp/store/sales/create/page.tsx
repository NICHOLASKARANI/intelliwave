'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Download, Loader2, Plus, Trash2 } from 'lucide-react'

interface CartItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export default function SalesCreatePage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/wavecore/store')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { productId: product.id, name: product.name, quantity: 1, price: product.sellingPrice || 0 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSave = async () => {
    if (cart.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/wavecore/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total, customerName }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => window.location.href = '/wavecore-erp/store', 2000)
      }
    } catch {} finally { setSaving(false) }
  }

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Sales Receipt',
      '='.repeat(40),
      'Date: ' + new Date().toLocaleString(),
      'Customer: ' + (customerName || 'Walk-in'),
      '='.repeat(40),
      '',
      ...cart.map((item, i) => `${i+1}. ${item.name} x${item.quantity} = KSh ${(item.price * item.quantity).toLocaleString()}`),
      '',
      '='.repeat(40),
      'TOTAL: KSh ' + total.toLocaleString(),
      '='.repeat(40),
      '',
      'Thank you for shopping!',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sales-receipt.pdf'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Create Sale</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {success ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sale Completed!</h1>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Products */}
            <div>
              <h2 className="text-lg font-bold mb-4">Products</h2>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 max-h-[500px] overflow-y-auto">
                {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
                  <div className="space-y-2">
                    {products.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className="w-full flex justify-between items-center p-3 rounded-xl border hover:bg-neutral-50 dark:hover:bg-neutral-800">
                        <div className="text-left">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {p.stock_level || 0}</p>
                        </div>
                        <p className="font-bold text-green-600">KSh {p.sellingPrice || 0}</p>
                      </button>
                    ))}
                    {products.length === 0 && <p className="text-center py-8 text-muted-foreground">No products available</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Cart ({cart.length})</h2>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4">
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border mb-4" placeholder="Customer name (optional)" />

                <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">KSh {item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700">-</button>
                        <span className="font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700">+</button>
                        <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Cart is empty</p>}
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950 mb-4">
                  <span className="font-bold">TOTAL</span>
                  <span className="text-2xl font-extrabold text-indigo-600">KSh {total.toLocaleString()}</span>
                </div>

                <button onClick={handleSave} disabled={saving || cart.length === 0}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}