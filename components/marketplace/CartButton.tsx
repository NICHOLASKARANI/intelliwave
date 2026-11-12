'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export default function CartButton() {
  const [count, setCount] = useState(0)

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/marketplace/cart')
      if (res.ok) {
        const d = await res.json()
        setCount(d.itemCount || 0)
      }
    } catch {}
  }

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 5000)
    const handler = () => fetchCount()
    window.addEventListener('cart-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      clearInterval(interval)
      window.removeEventListener('cart-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  return (
    <Link href="/marketplace/cart" className="relative p-2.5 rounded-xl hover:bg-neutral-800 text-neutral-300">
      <ShoppingCart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export function triggerCartUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'))
  }
}