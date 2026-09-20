'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Package, ArrowLeft, Loader2, CheckCircle2, Truck, MapPin, CreditCard,
  Clock, AlertTriangle, Store, Tag, RefreshCw, X, Trash2, Printer,
} from 'lucide-react'

const BUYER_ACTIONS: Record<string, { label: string; nextStatus: string; color: string }[]> = {
  PENDING: [{ label: 'Cancel Order', nextStatus: 'CANCELLED', color: 'bg-red-600' }],
  CONFIRMED: [{ label: 'Cancel Order', nextStatus: 'CANCELLED', color: 'bg-red-600' }],
  SHIPPED: [{ label: 'Confirm Delivered', nextStatus: 'DELIVERED', color: 'bg-green-600' }],
  DELIVERED: [],
}

const SELLER_ACTIONS: Record<string, { label: string; nextStatus: string; color: string }[]> = {
  PENDING: [{ label: 'Confirm Order', nextStatus: 'CONFIRMED', color: 'bg-blue-600' }],
  CONFIRMED: [{ label: 'Mark Shipped', nextStatus: 'SHIPPED', color: 'bg-purple-600' }],
  SHIPPED: [{ label: 'Mark Delivered', nextStatus: 'DELIVERED', color: 'bg-cyan-600' }],
  DELIVERED: [],
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [role, setRole] = useState<string>('buyer')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [acting, setActing] = useState(false)

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/orders?id=' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setOrder(data.order)
      setItems(data.items || [])
      setRole(data.role || 'buyer')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchOrder() }, [id])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 2500) }

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return
    setActing(true)
    try {
      const res = await fetch('/api/marketplace/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      })
      if (res.ok) { flash('Status updated to ' + newStatus); fetchOrder() }
    } finally { setActing(false) }
  }

  const markPaid = async () => {
    setActing(true)
    try {
      const reference = prompt('Payment reference (M-Pesa receipt #):')
      if (!reference) { setActing(false); return }
      const res = await fetch('/api/marketplace/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, paymentStatus: 'PAID', paymentReference: reference }),
      })
      if (res.ok) { flash('Payment confirmed'); fetchOrder() }
    } finally { setActing(false) }
  }

  const statusStyle = (s: string) => {
    switch (s) {
      case 'PENDING': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
      case 'CONFIRMED': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
      case 'SHIPPED': return 'bg-purple-900/40 text-purple-300 border border-purple-700'
      case 'DELIVERED': return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
      case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
      case 'CANCELLED': return 'bg-red-900/40 text-red-300 border border-red-700'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300">{error || 'Order not found'}</p>
        <Link href="/wavecore-erp/marketplace/orders" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Back to Orders</Link>
      </div>
    </div>
  )

  const actions = role === 'seller' ? SELLER_ACTIONS[order.status] || [] : BUYER_ACTIONS[order.status] || []

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket</span>
          </Link>
          <span className="text-sm text-neutral-400">Order Detail</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <button onClick={() => router.back()} className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-400" /> {order.orderNumber}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(order.status)}>{order.status}</span>
              <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (order.paymentStatus === 'PAID' ? 'bg-green-900/40 text-green-300' : 'bg-yellow-900/40 text-yellow-300')}>
                Payment: {order.paymentStatus}
              </span>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400">Role: {role.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchOrder} className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions bar */}
        {(actions.length > 0 || (role === 'seller' && order.paymentStatus !== 'PAID') || role === 'admin') && (
          <div className="mb-6 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase text-neutral-500 font-bold mr-2">Actions:</span>
            {actions.map(a => (
              <button
                key={a.nextStatus}
                onClick={() => updateStatus(a.nextStatus)}
                disabled={acting}
                className={'px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1 ' + a.color + ' disabled:opacity-50'}
              >
                {acting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {a.label}
              </button>
            ))}
            {(role === 'seller' || role === 'admin') && order.paymentStatus !== 'PAID' && (
              <button onClick={markPaid} disabled={acting} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Confirm Payment
              </button>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* Items */}
          <div className="space-y-4">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="p-5 border-b border-neutral-800">
                <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" /> Items ({items.length})
                </h3>
              </div>
              <div className="divide-y divide-neutral-800">
                {items.map(item => (
                  <div key={item.id} className="p-5 flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-neutral-800 overflow-hidden flex-shrink-0">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{item.title}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mt-1">
                        <span className="flex items-center gap-1"><Store className="w-3 h-3" />{item.sellerName || 'Seller'}</span>
                        <span>Qty: {item.quantity}</span>
                        <span>KES {Number(item.unitPrice).toLocaleString()} each</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (item.fulfillmentStatus === 'SETTLED' ? 'bg-green-900/40 text-green-300' : item.fulfillmentStatus === 'SHIPPED' ? 'bg-purple-900/40 text-purple-300' : 'bg-yellow-900/40 text-yellow-300')}>
                          {item.fulfillmentStatus}
                        </span>
                        <span className="font-bold text-amber-400">KES {Number(item.lineTotal).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Totals */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Order Total</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span className="text-white">KES {Number(order.subtotal || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Delivery</span><span className="text-white">KES {Number(order.deliveryFee || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Platform fee</span><span className="text-neutral-500 text-xs">KES {Number(order.platformFee || 0).toLocaleString()}</span></div>
              </div>
              <div className="border-t border-neutral-800 pt-3 mt-3 flex justify-between">
                <span className="font-bold text-white">Total</span>
                <span className="text-xl font-bold text-amber-400">KES {Number(order.total || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2"><MapPin className="w-3 h-3" /> Delivery</h3>
              <p className="text-sm text-white">{order.shippingAddress || 'No address'}</p>
              {order.buyerPhone && <p className="text-xs text-neutral-400 mt-1">{order.buyerPhone}</p>}
            </div>

            {/* Payment */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2"><CreditCard className="w-3 h-3" /> Payment</h3>
              <p className="text-sm text-white">{order.paymentMethod || 'MPESA'}</p>
              {order.paymentReference && <p className="text-xs text-cyan-400 font-mono mt-1">{order.paymentReference}</p>}
            </div>

            {/* Timeline */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2"><Clock className="w-3 h-3" /> Timeline</h3>
              <div className="space-y-3">
                <TimelineRow label="Created" value={new Date(order.createdAt).toLocaleString('en-GB')} done />
                <TimelineRow label="Paid" value={order.paymentStatus === 'PAID' ? 'Confirmed' : 'Pending'} done={order.paymentStatus === 'PAID'} />
                <TimelineRow label="Shipped" value={order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'Yes' : 'Pending'} done={['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status)} />
                <TimelineRow label="Delivered" value={['DELIVERED', 'COMPLETED'].includes(order.status) ? 'Yes' : 'Pending'} done={['DELIVERED', 'COMPLETED'].includes(order.status)} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function TimelineRow({ label, value, done }: { label: string; value: string; done?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={'w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ' + (done ? 'bg-green-500' : 'bg-neutral-700')}></div>
      <div>
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-neutral-500">{value}</p>
      </div>
    </div>
  )
}