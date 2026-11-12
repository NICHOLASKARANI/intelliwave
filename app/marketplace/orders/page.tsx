'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Loader2, ChevronLeft, Clock, CheckCircle, XCircle, Store, ArrowRight } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string, color: string }> = {
  'AWAITING_SELLER_ACCEPT': { label: 'Waiting for seller', color: 'bg-yellow-500/20 text-yellow-400' },
  'SELLER_ACCEPTED': { label: 'Ready to pay', color: 'bg-blue-500/20 text-blue-400' },
  'SELLER_DECLINED': { label: 'Declined', color: 'bg-red-500/20 text-red-400' },
  'CONFIRMED': { label: 'Paid', color: 'bg-green-500/20 text-green-400' },
  'SHIPPED': { label: 'Shipped', color: 'bg-purple-500/20 text-purple-400' },
  'DELIVERED': { label: 'Delivered', color: 'bg-emerald-500/20 text-emerald-400' },
  'CANCELLED': { label: 'Cancelled', color: 'bg-neutral-500/20 text-neutral-400' },
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace/orders?view=buyer')
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Marketplace
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" /> My Orders
          </span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-1">No orders yet</p>
            <Link href="/marketplace" className="inline-block mt-4 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-neutral-500/20 text-neutral-400' }
              return (
                <Link key={order.id} href={`/marketplace/orders/${order.id}`} className="block bg-white dark:bg-neutral-900 rounded-2xl border p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-bold text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-neutral-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">KES {Number(order.total).toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}