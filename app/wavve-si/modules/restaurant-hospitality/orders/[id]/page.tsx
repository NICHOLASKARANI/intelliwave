'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ShoppingCart, User, Mail, Phone, Building2,
  Clock, CheckCircle, XCircle, AlertCircle, Package,
  Truck, ChefHat, FileText, Printer, Percent, Users, LayoutGrid
} from 'lucide-react'
import { ConfirmDialog } from '@/components/wavve-si/ConfirmDialog'
import { DiscountSplitModal } from '@/components/wavve-si/DiscountSplitModal'

interface OrderDetail {
  id: string
  number: string
  date: string
  status: string
  subtotal: number
  taxAmount: number
  total: number
  notes: string | null
  deliveryDate: string | null
  discountType: string | null
  discountValue: number
  tableId: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
  }
}

interface OrderItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  productId: string | null
  note: string | null
}

const STATUS_FLOW = [
  { key: 'PENDING',    label: 'Pending',    icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  { key: 'CONFIRMED',  label: 'Confirmed',  icon: CheckCircle,  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { key: 'PROCESSING', label: 'Processing', icon: ChefHat,      color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'SHIPPED',    label: 'Shipped',    icon: Truck,        color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  { key: 'DELIVERED',  label: 'Delivered',  icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-500/10' },
]

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, PROCESSING: 2, SHIPPED: 3, DELIVERED: 4, CANCELLED: -1,
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:    'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CONFIRMED:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  PROCESSING: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  SHIPPED:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  DELIVERED:  'bg-green-500/20 text-green-300 border-green-500/30',
  CANCELLED:  'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [modalMode, setModalMode] = useState<'discount' | 'split' | null>(null)

  async function loadOrder() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/orders/${orderId}`, { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard'
        return
      }
      if (res.status === 404) {
        setError('Order not found')
        return
      }
      if (!res.ok) throw new Error('Failed to load order')
      const data = await res.json()
      setOrder(data.order)
      setItems(data.items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update')
      }
      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success(`Order marked as ${newStatus.toLowerCase()}`)
      setConfirmCancel(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleApplyDiscount(type: string | null, value: number) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/wavve-si/restaurant/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountType: type, discountValue: value }),
      })
      if (!res.ok) throw new Error('Failed to apply discount')
      toast.success('Discount applied')
      setModalMode(null)
      await loadOrder()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleSplit(parts: { amount: number; label: string }[]) {
    // For now: log the split — full invoice generation in 2h phase
    toast.success(`Split into ${parts.length} parts: ${parts.map(p => 'KSh ' + p.amount.toLocaleString()).join(', ')}`)
    setModalMode(null)
  }

  useEffect(() => {
    if (orderId) loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-lg text-white mb-1">{error || 'Order not found'}</p>
        <Link href="/wavve-si/modules/restaurant-hospitality/orders" className="text-sm text-blue-400 hover:underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  const currentStatusIndex = STATUS_ORDER[order.status] ?? -1
  const isCancelled = order.status === 'CANCELLED'
  const isDelivered = order.status === 'DELIVERED'
  const nextStatus = isCancelled || isDelivered ? null : STATUS_FLOW[currentStatusIndex + 1]?.key

  return (
    <div className="max-w-5xl">
      <Link href="/wavve-si/modules/restaurant-hospitality/orders" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">{order.number}</h1>
            <p className="text-sm text-slate-400">
              {new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}
              {new Date(order.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/wavve-si/modules/restaurant-hospitality/orders/${order.id}/receipt`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </Link>
          <span className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${STATUS_BADGE[order.status] || 'bg-slate-700 text-slate-300'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {!isCancelled && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">Order Progress</h3>
          <div className="flex items-center justify-between gap-1">
            {STATUS_FLOW.map((step, i) => {
              const Icon = step.icon
              const isCompleted = i <= currentStatusIndex
              const isCurrent = i === currentStatusIndex
              return (
                <div key={step.key} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted ? `${step.bg} border-current ${step.color}` : 'bg-slate-800 border-slate-700 text-slate-600'
                    } ${isCurrent ? 'scale-110 ring-2 ring-blue-500/30' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-semibold text-center ${isCompleted ? step.color : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`h-0.5 flex-1 ${i < currentStatusIndex ? 'bg-green-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-400" />
          <div>
            <p className="font-bold text-red-300">Order Cancelled</p>
            <p className="text-sm text-red-400/70">This order has been cancelled and cannot be modified.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white">Order Items</h3>
              <span className="text-sm text-slate-400">{items.length} item{items.length === 1 ? '' : 's'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="text-left px-5 py-2">Item</th>
                    <th className="text-right px-5 py-2">Qty</th>
                    <th className="text-right px-5 py-2">Price</th>
                    <th className="text-right px-5 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t border-slate-800/50">
                      <td className="px-5 py-3 text-sm text-white">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-500" /> {item.description}
                        </div>
                        {item.note && (
                          <p className="text-xs text-amber-400 mt-1 ml-6 italic">Note: {item.note}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-300 text-right">{item.quantity}</td>
                      <td className="px-5 py-3 text-sm text-slate-300 text-right">KSh {item.unitPrice.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm font-bold text-green-400 text-right">KSh {item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-800 p-5 space-y-2 bg-slate-800/30">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">KSh {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tax</span>
                <span className="text-white">KSh {order.taxAmount.toLocaleString()}</span>
              </div>
              {order.discountType && order.discountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Discount {order.discountType === 'PERCENT' ? `(${order.discountValue}%)` : ''}
                  </span>
                  <span className="text-red-400">− KSh {(
                    order.discountType === 'PERCENT'
                      ? (order.subtotal * order.discountValue) / 100
                      : order.discountValue
                  ).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                <span className="font-bold text-white">Total</span>
                <span className="text-lg font-bold text-green-400">KSh {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {!isCancelled && !isDelivered && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {nextStatus && (
                  <button
                    onClick={() => updateStatus(nextStatus)}
                    disabled={updating}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {updating ? 'Updating...' : `Mark as ${STATUS_FLOW[currentStatusIndex + 1]?.label}`}
                  </button>
                )}
                <button
                  onClick={() => setModalMode('discount')}
                  disabled={updating || isDelivered || isCancelled}
                  className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-400 border border-blue-500/30 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Percent className="w-4 h-4" /> Apply Discount
                </button>
                <button
                  onClick={() => setModalMode('split')}
                  disabled={updating || isDelivered || isCancelled}
                  className="px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 text-purple-400 border border-purple-500/30 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> Split Bill
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={updating}
                  className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 border border-red-500/30 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Cancel Order
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" /> Customer
            </h3>
            <div className="space-y-2">
              <p className="text-white font-medium">{order.customer.name}</p>
              {order.customer.company && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {order.customer.company}
                </p>
              )}
              {order.customer.email && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {order.customer.email}
                </p>
              )}
              {order.customer.phone && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {order.customer.phone}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-300">{new Date(order.createdAt).toLocaleString('en-GB')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Updated</span>
                <span className="text-slate-300">{new Date(order.updatedAt).toLocaleString('en-GB')}</span>
              </div>
              {order.deliveryDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery</span>
                  <span className="text-slate-300">{new Date(order.deliveryDate).toLocaleDateString('en-GB')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DiscountSplitModal
        open={modalMode !== null}
        mode={modalMode || 'discount'}
        subtotal={order.subtotal}
        currentDiscountType={order.discountType}
        currentDiscountValue={order.discountValue}
        onClose={() => setModalMode(null)}
        onApplyDiscount={handleApplyDiscount}
        onSplit={handleSplit}
      />

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message="The order will be marked as CANCELLED. This cannot be undone from here."
        confirmLabel="Yes, Cancel Order"
        cancelLabel="No, Keep It"
        variant="danger"
        loading={updating}
        onConfirm={() => updateStatus('CANCELLED')}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  )
}