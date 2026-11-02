'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChefHat, Clock, RefreshCw, Maximize2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'

interface KdsItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface KdsOrder {
  id: string
  number: string
  status: string
  date: string
  total: number
  notes: string | null
  customer_name: string | null
  items: KdsItem[]
  elapsed_minutes: number
}

export default function KdsPage() {
  const [orders, setOrders] = useState<KdsOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  async function loadOrders() {
    try {
      const res = await fetch('/api/wavve-si/restaurant/kds', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard'
        return
      }
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setOrders(data.orders || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function advanceStatus(orderId: string, currentStatus: string) {
    const next: Record<string, string> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PROCESSING',
      PROCESSING: 'SHIPPED',
    }
    const nextStatus = next[currentStatus]
    if (!nextStatus) return

    setUpdating(orderId)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`Order moved to ${nextStatus}`)
      await loadOrders()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdating(null)
    }
  }

  function enterFullscreen() {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen()
    }
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 10000) // auto-refresh every 10s
    return () => clearInterval(interval)
  }, [])

  function timerColor(minutes: number): string {
    if (minutes < 5) return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (minutes < 10) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-red-400 bg-red-500/10 border-red-500/30'
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0e27] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
            <p className="text-sm text-slate-400">{orders.length} active order{orders.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadOrders} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={enterFullscreen} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold transition-colors">
            <Maximize2 className="w-4 h-4" /> Fullscreen
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-64 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <ChefHat className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
          <p className="text-slate-400 mb-6">No active orders in the kitchen right now.</p>
          <Link href="/wavve-si/modules/restaurant-hospitality/orders/new" className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-sm transition-colors">
            Create Order
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map(order => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
              {/* Order header */}
              <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono font-bold text-white text-sm">{order.number}</p>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${timerColor(order.elapsed_minutes)}`}>
                    <Clock className="w-3 h-3" /> {order.elapsed_minutes}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    order.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                    order.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-slate-400">{order.customer_name || 'Walk-in'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 flex-1 space-y-2 max-h-64 overflow-y-auto">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-start gap-2 text-sm">
                    <span className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center font-bold text-white flex-shrink-0 text-xs">
                      {item.quantity}x
                    </span>
                    <p className="text-slate-200 pt-1">{item.description}</p>
                  </div>
                ))}
                {order.notes && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
                    Note: {order.notes}
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="p-3 border-t border-slate-800">
                {order.status === 'PENDING' && (
                  <button onClick={() => advanceStatus(order.id, 'PENDING')} disabled={updating === order.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors">
                    <CheckCircle className="w-4 h-4" /> Accept Order
                  </button>
                )}
                {order.status === 'CONFIRMED' && (
                  <button onClick={() => advanceStatus(order.id, 'CONFIRMED')} disabled={updating === order.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors">
                    <ChefHat className="w-4 h-4" /> Start Cooking
                  </button>
                )}
                {order.status === 'PROCESSING' && (
                  <button onClick={() => advanceStatus(order.id, 'PROCESSING')} disabled={updating === order.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors">
                    <CheckCircle className="w-4 h-4" /> Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}