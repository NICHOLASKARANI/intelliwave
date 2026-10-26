'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCart, X } from 'lucide-react'

const MENU = {
  All: ['View All'],
  Men: ['Shirts', 'Outerwear', 'View All'],
  Women: ['Shirts', 'Outerwear', 'View All'],
  Kids: ['Shirts', 'Outerwear', 'View All'],
  Accessories: ['Drones', 'Hats', 'View All'],
  Wavvemarket: ['View All']
}

export default function ShopWavveMarket() {
  const [products, setProducts] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
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
    const number = '254714694493'
    const message = `Hello IntelliWavve! I'd like to order:\n\n` + 
      cart.map(c => `${c.qty}x ${c.name} - KSh ${c.price}`).join('\n') + 
      `\n\nTotal: KSh ${cart.reduce((s, c) => s + (c.price * c.qty), 0)}`
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mega Menu */}
      <div className="bg-black border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          {Object.keys(MENU).map(cat => (
            <div key={cat} className="relative group py-5">
              <button 
                onClick={() => { setActiveCategory(cat); setActiveSub('View All') }} 
                className="font-bold text-white hover:text-pink-400 transition-colors uppercase tracking-wider text-sm"
              >
                {cat}
              </button>
              <div className="absolute top-full left-0 w-48 bg-slate-900 border border-white/10 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                {MENU[cat as keyof typeof MENU].map(sub => (
                  <button 
                    key={sub} 
                    onClick={() => { setActiveCategory(cat); setActiveSub(sub) }} 
                    className="block w-full text-left px-4 py-3 hover:bg-white/10 text-sm text-slate-200 transition-colors"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 text-center">
        <h1 className="text-5xl font-extrabold mb-4">
          Shop <span className="text-pink-500">WavveMarket</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Premium products from verified sellers across Kenya.
        </p>
      </section>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold mb-8 uppercase tracking-wider">{activeCategory} / {activeSub}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden group hover:border-pink-500/50 transition-all duration-300">
              {/* Image Container — Large and Clear */}
              <div className="relative aspect-square overflow-hidden bg-slate-800 cursor-pointer">
                <Image 
                  src={p.imageUrl || p.imageurl} 
                  alt={p.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  onClick={() => window.open(p.imageUrl || p.imageurl, '_blank')}
                />
              </div>
              
              {/* Details */}
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1 truncate">{p.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{p.description || 'Premium quality product'}</p>
                <div className="flex items-center justify-between">
                  <p className="text-pink-500 font-extrabold text-xl">KSh {Number(p.price).toLocaleString()}</p>
                  <button 
                    onClick={() => addToCart(p)} 
                    className="p-3 bg-white text-slate-900 rounded-xl hover:bg-pink-500 hover:text-white transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-slate-900 rounded-2xl border border-white/10">
            <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No products in this category yet.</p>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 h-full p-6 flex flex-col border-l border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto space-y-4">
              {cart.map((c, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl">
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p className="text-sm text-slate-400">KSh {c.price}</p>
                  </div>
                  <p className="font-bold text-pink-500">{c.qty}x</p>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between font-bold text-xl mb-4">
                <span>Total:</span>
                <span className="text-pink-500">KSh {cart.reduce((s, c) => s + (c.price * c.qty), 0).toLocaleString()}</span>
              </div>
              <button 
                onClick={checkout} 
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-500 transition-colors"
              >
                Place Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}