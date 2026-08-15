'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, ShoppingCart, Search, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  name: string
  sku: string
  sellingPrice: number
  total_stock: number
  category: string
}

interface CartItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export default function CreateSalePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/wavecore/inventory/products')
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products || [])
        }
      } catch {}
    }
    fetchProducts()
  }, [])

  const addToCart = (product: Product) => {
    const existing = cart.find(c => c.productId === product.id)
    if (existing) {
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { productId: product.id, name: product.name, quantity: 1, price: product.sellingPrice }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return }
    setCart(cart.map(c => c.productId === productId ? { ...c, quantity } : c))
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const handleCompleteSale = async () => {
    if (cart.length === 0) { setError('Cart is empty'); return }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Create customer if name provided
      let customerId = null
      if (customerName) {
        const custRes = await fetch('/api/wavecore/crm/customers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customerName }),
        })
        const custData = await custRes.json()
        if (custRes.ok) customerId = custData.customer?.id
      }

      // Create sale (invoice)
      const res = await fetch('/api/wavecore/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || (await getWalkInCustomer()),
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          items: cart.map(c => ({ description: c.name, quantity: c.quantity, unitPrice: c.price })),
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Sale failed'); return }

      setSuccess('Sale completed! Total: KSh ' + total.toFixed(2))
      setCart([])
      setCustomerName('')
      setTimeout(() => router.push('/wavecore-erp/store'), 2000)
    } catch {
      setError('Network error')
    } finally { setLoading(false) }
  }

  async function getWalkInCustomer(): Promise<string> {
    try {
      const res = await fetch('/api/wavecore/crm/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Walk-in Customer' }),
      })
      const data = await res.json()
      return data.customer?.id || ''
    } catch { return '' }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">New Sale</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">Products</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-3 rounded-xl border text-sm w-full" placeholder="Search products by name, SKU, or category..." />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <button key={product.id} onClick={() => addToCart(product)}
                  className="p-4 rounded-xl border bg-white dark:bg-neutral-900 text-left hover:border-indigo-300 hover:shadow-md transition-all">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku} • {product.category}</p>
                  <p className="text-green-600 font-bold mt-1">KSh {product.sellingPrice?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.total_stock || 0}</p>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No products found</p>
              )}
            </div>
          </div>

          {/* Cart Panel */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 h-fit sticky top-20">
            <h3 className="font-bold mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart ({cart.length})</h3>

            <div className="mb-3">
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border text-sm" placeholder="Customer name (optional)" />
            </div>

            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 py-2 border-b">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">KSh {item.price.toLocaleString()} x {item.quantity}</p>
                  </div>
                  <input type="number" value={item.quantity} min="1"
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 rounded-lg border text-sm text-center" />
                  <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Cart is empty</p>}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>KSh {total.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm mb-2"><span>VAT (16%)</span><span>KSh {(total * 0.16).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-green-600">KSh {(total * 1.16).toFixed(2)}</span></div>
            </div>

            <Button onClick={handleCompleteSale} disabled={loading || cart.length === 0}
              className="w-full mt-4 gap-2 bg-green-600 hover:bg-green-700 py-3 text-base">
              <ShoppingCart className="w-5 h-5" /> {loading ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}