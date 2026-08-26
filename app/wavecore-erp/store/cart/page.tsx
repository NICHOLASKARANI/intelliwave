'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Trash2, Loader2, ArrowRight, Package } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/wavecore/store')
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Cart</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-pink-500" /> Cart
        </h1>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-green-600 font-medium">KSh {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800"><Minus className="w-4 h-4" /></button>
                  <span className="font-bold w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800"><Plus className="w-4 h-4" /></button>
                  <button onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="text-xl font-bold text-green-600">KSh {total.toLocaleString()}</span>
            </div>
            <Link href="/wavecore-erp/store/checkout" className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-center flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}