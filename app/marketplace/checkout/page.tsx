'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShoppingCart } from 'lucide-react'

/**
 * Legacy /marketplace/checkout route.
 *
 * The marketplace uses per-seller order creation (Buy Now + Place Orders).
 * There is no unified checkout page — orders are created directly.
 *
 * This page redirects users to their orders list.
 */
export default function CheckoutRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect after brief moment so the message is visible
    const timer = setTimeout(() => {
      router.push('/marketplace/orders')
    }, 1500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold mb-2">Redirecting to your orders</h1>
        <p className="text-sm text-neutral-400 mb-4">
          WaveMarket uses per-seller order creation. Your orders are managed from your orders page.
        </p>
        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
        </div>
        <Link
          href="/marketplace/orders"
          className="inline-block px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
        >
          Go to Orders Now
        </Link>
      </div>
    </div>
  )
}