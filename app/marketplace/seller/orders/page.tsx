'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Loader2, ChevronLeft, Check, X, Clock, CheckCircle, XCircle, Store } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string, color: string }> = {
  'AWAITING_SELLER_ACCEPT': { label: 'Action required', color: 'bg-yellow-500/20 text-yellow-400' },
  'SELLER_ACCEPTED': { label: 'Accepted · awaiting payment', color: 'bg-blue-500/20 text-blue-400' },
  'SELLER_DECLINED': { label: 'Declined', color: 'bg-red-500/20 text-red-400' },
  'CONFIRMED': { label: 'Paid', color: 'bg-green-500/20 text-green-400' },
  'SHIPPED': { label: 'Shipped', color: 'bg-purple-500/20 text-purple-400' },
  'DELIVERED': { label: 'Delivered', color: 'bg-emerald-500/20 text-emerald-400' },
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const [showDeclineFor, setShowDeclineFor] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [showShipFor, setShowShipFor] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')

  const fetchOrders = () => {
    fetch('/api/marketplace/orders?view=seller')
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const accept = async (orderId: string) => {
    setActioning(orderId)
    try {
      await fetch(`/api/marketplace/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      fetchOrders()
    } finally { setActioning(null) }
  }

  const decline = async (orderId: string) => {
    setActioning(orderId)
    try {
      await fetch(`/api/marketplace/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', reason: declineReason }),
      })
      setShowDeclineFor(null)
      setDeclineReason('')
      fetchOrders()
    } finally { setActioning(null) }
  }

  const ship = async (orderId: string) => {
    setActioning(orderId)
    try {
      const res = await fetch(`/api/marketplace/orders/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber }),
      })
      if (res.ok) {
        setShowShipFor(null)
        setTrackingNumber('')
        fetchOrders()
      } else {
        const d = await res.json()
        alert(d.error || 'Failed')
      }
    } finally { setActioning(null) }
  }

  const deliver = async (orderId: string) => {
    if (!confirm('Mark as delivered?')) return
    setActioning(orderId)
    try {
      const res = await fetch(`/api/marketplace/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) fetchOrders()
      else { const d = await res.json(); alert(d.error || 'Failed') }
    } finally { setActioning(null) }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <span className="font-bold text-lg flex items-center gap-2">
            <Store className="w-5 h-5 text-cyan-400" /> Seller Orders
          </span>
          <Link href="/marketplace/seller/payment-settings" className="text-xs text-cyan-400 hover:text-cyan-300">Payment Settings</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-cyan-500" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-1">No orders yet</p>
            <p className="text-sm text-neutral-500">Buyer orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-neutral-700 text-neutral-400' }
              const needsAction = order.status === 'AWAITING_SELLER_ACCEPT'
              const canShip = order.status === 'CONFIRMED'
              const canDeliver = order.status === 'SHIPPED'
              return (
                <div key={order.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <Link href={`/marketplace/orders/${order.id}`} className="font-bold text-sm hover:text-cyan-400">{order.orderNumber}</Link>
                      <p className="text-xs text-neutral-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-green-400">KES {Number(order.total).toLocaleString()}</span>
                  </div>
                  {needsAction && (
                    showDeclineFor === order.id ? (
                      <div className="pt-3 border-t border-neutral-800 space-y-2">
                        <input
                          value={declineReason}
                          onChange={e => setDeclineReason(e.target.value)}
                          placeholder="Reason for declining (optional)"
                          className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => decline(order.id)}
                            disabled={actioning === order.id}
                            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
                          >
                            Confirm Decline
                          </button>
                          <button
                            onClick={() => { setShowDeclineFor(null); setDeclineReason('') }}
                            className="px-4 py-2 rounded-lg bg-neutral-700 text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-3 border-t border-neutral-800">
                        <button
                          onClick={() => accept(order.id)}
                          disabled={actioning === order.id}
                          className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {actioning === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Accept
                        </button>
                        <button
                          onClick={() => setShowDeclineFor(order.id)}
                          disabled={actioning === order.id}
                          className="flex-1 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" /> Decline
                        </button>
                      </div>
                    )
                  )}
                  {canShip && (
                    showShipFor === order.id ? (
                      <div className="pt-3 border-t border-neutral-800 space-y-2">
                        <input
                          value={trackingNumber}
                          onChange={e => setTrackingNumber(e.target.value)}
                          placeholder="Tracking number (optional)"
                          className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => ship(order.id)}
                            disabled={actioning === order.id}
                            className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {actioning === order.id ? 'Shipping...' : 'Confirm Shipment'}
                          </button>
                          <button
                            onClick={() => { setShowShipFor(null); setTrackingNumber('') }}
                            className="px-4 py-2 rounded-lg bg-neutral-700 text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowShipFor(order.id)}
                        disabled={actioning === order.id}
                        className="w-full py-2 mt-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        📦 Mark as Shipped
                      </button>
                    )
                  )}
                  {canDeliver && (
                    <button
                      onClick={() => deliver(order.id)}
                      disabled={actioning === order.id}
                      className="w-full py-2 mt-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      ✅ Mark as Delivered
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}