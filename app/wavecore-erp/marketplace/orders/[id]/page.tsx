'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle2,
  XCircle, Truck, Loader2, AlertCircle, MessageSquare, Copy
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  shippingAddress: string
  subtotal: number
  deliveryFee: number
  platformFee: number
  total: number
  currency: string
  status: string
  paymentMethod: string
  paymentStatus: string
  paymentReference: string
  notes: string
  createdAt: string
  updatedAt: string
}

interface OrderItem {
  id: string
  orderId: string
  listingId: number
  sellerId: string
  sellerName: string
  title: string
  quantity: number
  unitPrice: number
  lineTotal: number
  commissionRate: number
  commissionAmount: number
  sellerPayout: number
  fulfillmentStatus: string
  trackingNumber: string
  images: string[]
}

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
]

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: -1,
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [role, setRole] = useState<string>('buyer')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const loadOrder = async () => {
    if (!orderId) return
    try {
      const res = await fetch('/api/marketplace/orders?id=' + orderId)
      if (res.status === 401) {
        router.push('/wavecore-erp/auth/login?returnTo=/wavecore-erp/marketplace/orders/' + orderId)
        return
      }
      if (res.status === 404) { setError('Order not found'); return }
      if (res.status === 403) { setError('You do not have access to this order'); return }
      if (!res.ok) throw new Error('Failed to load')
      const d = await res.json()
      setOrder(d.order)
      setItems(d.items || [])
      setRole(d.role || 'buyer')
    } catch {
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrder() }, [orderId])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch('/api/marketplace/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await loadOrder()
    } catch {
      alert('Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  const copyOrderNumber = () => {
    if (order) navigator.clipboard.writeText(order.orderNumber)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-xl mb-2">{error || 'Order not found'}</p>
        <Link href="/wavecore-erp/marketplace/orders" className="text-indigo-400 hover:underline mt-4">
          Back to Orders
        </Link>
      </div>
    )
  }

  const currentStep = STATUS_ORDER[order.status] ?? 0
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/wavecore-erp/marketplace/orders" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase text-neutral-500 font-bold mb-1">Order</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
              <button onClick={copyOrderNumber} className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors" title="Copy">
                <Copy className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <p className="text-sm text-neutral-400 mt-1">{new Date(order.createdAt).toLocaleString('en-GB')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-sm font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
              {order.paymentStatus}
            </span>
            <span className="px-3 py-1.5 rounded-lg text-sm font-bold border bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
              {order.status}
            </span>
          </div>
        </div>

        {!isCancelled && (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6">
            <h3 className="text-sm font-bold uppercase text-neutral-500 mb-4">Order Progress</h3>
            <div className="flex items-center justify-between gap-1">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon
                const isCompleted = i <= currentStep
                return (
                  <div key={step.key} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-neutral-800 border-neutral-700 text-neutral-600">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-neutral-600">{step.label}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className="h-0.5 flex-1 bg-neutral-800" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 mb-6 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="font-bold text-red-300">Order Cancelled</p>
              <p className="text-sm text-red-400/70">This order has been cancelled.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-800">
                <h3 className="font-bold">Items ({items.length})</h3>
              </div>
              <div className="divide-y divide-neutral-800">
                {items.map(item => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                      {item.images?.[0] ? (
                        <Image src={item.images[0]} alt={item.title} fill className="object-cover" sizes="80px" />
                      ) : (
                        <Package className="w-8 h-8 text-neutral-600 absolute inset-0 m-auto" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={'/wavecore-erp/marketplace/listing/' + item.listingId} className="font-bold hover:text-indigo-400 transition-colors line-clamp-1">
                        {item.title}
                      </Link>
                      <p className="text-sm text-neutral-400">Qty: {item.quantity} x KSh {Number(item.unitPrice).toLocaleString()}</p>
                      <p className="text-xs text-neutral-500 mt-1">Seller: {item.sellerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-400">KSh {Number(item.lineTotal).toLocaleString()}</p>
                      <p className="text-xs text-neutral-500 mt-1">{item.fulfillmentStatus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!isCancelled && role === 'buyer' && order.status === 'PENDING' && (
              <button onClick={() => updateStatus('CANCELLED')} disabled={updating} className="w-full px-5 py-3 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 border border-red-500/30 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5" /> Cancel Order
              </button>
            )}
            {!isCancelled && role === 'seller' && order.status === 'PENDING' && (
              <button onClick={() => updateStatus('CONFIRMED')} disabled={updating} className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Confirm Order
              </button>
            )}
            {!isCancelled && role === 'seller' && order.status === 'CONFIRMED' && (
              <button onClick={() => updateStatus('SHIPPED')} disabled={updating} className="w-full px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <Truck className="w-5 h-5" /> Mark as Shipped
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-400" /> Shipping</h3>
              <p className="text-sm">{order.buyerName}</p>
              <p className="text-xs text-neutral-400 mt-1">{order.buyerPhone}</p>
              <p className="text-xs text-neutral-400 mt-2 whitespace-pre-line">{order.shippingAddress}</p>
            </div>

            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-green-400" /> Payment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span>KSh {Number(order.subtotal).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Delivery</span><span>KSh {Number(order.deliveryFee).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Platform Fee</span><span>KSh {Number(order.platformFee).toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-neutral-800 pt-2 font-bold"><span>Total</span><span className="text-green-400">KSh {Number(order.total).toLocaleString()}</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-500 space-y-1">
                <p>Method: {order.paymentMethod}</p>
                {order.paymentReference && <p>Reference: <span className="font-mono">{order.paymentReference}</span></p>}
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" /> Need Help?</h3>
              <button className="w-full px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-bold transition-colors">
                Contact Seller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}