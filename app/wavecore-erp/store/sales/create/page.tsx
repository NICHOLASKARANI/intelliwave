'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Minus, Trash2, Loader2, CheckCircle, ArrowLeft, ShoppingCart, Search, DollarSign, User } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  sellingPrice: number
  quantity: number
}

export default function CreateSalePage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/store')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.sellingPrice || product.price || 0,
        sellingPrice: product.sellingPrice || product.price || 0,
        quantity: 1
      }])
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('Cart is empty. Add products first.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/store/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total: cartTotal, customerName })
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/wavecore-erp/store/sales'
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create sale')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500"

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

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <Link href="/wavecore-erp/store/sales" className="flex items-center gap-1 text-sm text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sales
        </Link>

        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-blue-500" /> Create Sale
        </h1>

        {success ? (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-700">Sale Completed!</h2>
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Selection */}
            <div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">Select Products</h2>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..." className="pl-9 pr-4 py-2.5 rounded-xl border w-full" />
                </div>

                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button key={product.id} onClick={() => addToCart(product)}
                        className="w-full p-3 rounded-xl border text-left hover:border-blue-500">
                        <div className="flex justify-between">
                          <span className="font-bold">{product.name}</span>
                          <span className="text-green-600 font-bold">KSh {Number(product.sellingPrice || product.price || 0).toLocaleString()}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Stock: {product.stock_level || 0} | Click to add</span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No products found</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            <div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">Cart ({cart.length} items)</h2>

                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                    {cart.map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="text-sm text-green-600">KSh {Number(item.price).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-lg bg-neutral-200"><Minus className="w-3 h-3" /></button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-lg bg-neutral-200"><Plus className="w-3 h-3" /></button>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Customer Name (optional)</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in customer" className={inputClass} />
                </div>

                {/* Total */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-4">
                  <div className="flex justify-between">
                    <span className="font-bold">TOTAL</span>
                    <span className="text-2xl font-bold text-blue-600">KSh {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

                <button onClick={handleSubmit} disabled={submitting || cart.length === 0}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {submitting ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}