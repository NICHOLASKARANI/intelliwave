'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCart, X, Plus, Minus } from 'lucide-react'

const MENU = {
  Men: ['Shirts', 'Outerwear', 'View All'],
  Women: ['Shirts', 'Outerwear', 'View All'],
  Kids: ['Shirts', 'Outerwear', 'View All'],
  Accessories: ['Drones', 'Hats', 'View All'],
  Wavvemarket: ['View All']
}

export default function ShopWavveMarket() {
  const [products, setProducts] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('Men')
  const [activeSub, setActiveSub] = useState('View All')
  const [cart, setCart] = useState<any[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    fetch('/api/shop/products?store=wavvemarket')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
  }, [])

  const filtered = products.filter(p => 
    p.category === activeCategory && (activeSub === 'View All' || p.subcategory === activeSub)
  )

  const addToCart = (p: any) => {
    setCart([...cart, { ...p, qty: 1 }])
    setIsCartOpen(true)
  }

  const checkout = () => {
    const number = '254714694493' // Kenya format
    const message = `Hello IntelliWavve! I'd like to order:\n\n` + 
      cart.map(c => `${c.qty}x ${c.name} - KSh ${c.price}`).join('\n') + 
      `\n\nTotal: KSh ${cart.reduce((s, c) => s + (c.price * c.qty), 0)}`
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      {/* Mega Menu */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          {Object.keys(MENU).map(cat => (
            <div key={cat} className="relative group py-4">
              <button onClick={() => { setActiveCategory(cat); setActiveSub('View All') }} className="font-bold text-white hover:text-pink-400 transition-colors">
                {cat}
              </button>
              <div className="absolute top-full left-0 w-48 bg-white border border-slate-200 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {MENU[cat as keyof typeof MENU].map(sub => (
                  <button key={sub} onClick={() => { setActiveCategory(cat); setActiveSub(sub) }} className="block w-full text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-200">
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold mb-6">{activeCategory} / {activeSub}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border p-4 shadow-sm hover:shadow-xl transition-all">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-slate-100">
                <Image src={p.imageurl} alt={p.name} fill className="object-cover" />
              </div>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-pink-600 font-extrabold text-xl my-2">KSh {Number(p.price).toLocaleString()}</p>
              <button onClick={() => addToCart(p)} className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center py-20 text-slate-500">No products in this category yet.</p>}
        </div>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)}><X /></button>
            </div>
            <div className="flex-1 overflow-auto space-y-4">
              {cart.map((c, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2">
                  <div><p className="font-bold">{c.name}</p><p className="text-sm text-slate-500">KSh {c.price}</p></div>
                  <p className="font-bold">{c.qty}x</p>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t">
              <div className="flex justify-between font-bold text-xl mb-4">
                <span>Total:</span><span>KSh {cart.reduce((s, c) => s + (c.price * c.qty), 0).toLocaleString()}</span>
              </div>
              <button onClick={checkout} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                Place Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}