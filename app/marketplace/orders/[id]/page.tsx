'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Package, Loader2, ChevronLeft, Clock, CheckCircle, XCircle, Store, User, MapPin } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string, color: string, icon: any }> = {
  'AWAITING_SELLER_ACCEPT': { label: 'Waiting for seller to accept', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500', icon: Clock },
  'SELLER_ACCEPTED': { label: 'Seller accepted — payment coming soon', color: 'bg-blue-500/20 text-blue-400 border-blue-500', icon: CheckCircle },
  'SELLER_DECLINED': { label: 'Seller declined', color: 'bg-red-500/20 text-red-400 border-red-500', icon: XCircle },
  'CONFIRMED': { label: 'Paid & confirmed', color: 'bg-green-500/20 text-green-400 border-green-500', icon: CheckCircle },
  'SHIPPED': { label: 'Shipped', color: 'bg-purple-500/20 text-purple-400 border-purple-500', icon: Package },
  'DELIVERED': { label: 'Delivered', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500', icon: CheckCircle },
  'CANCELLED': { label: 'Cancelled', color: 'bg-neutral-500/20 text-neutral-400 border-neutral-500', icon: XCircle },
}

export default function OrderDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [sellerPayment, setSellerPayment] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/marketplace/orders?id=${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setOrder(d.order)
        setItems(d.items || [])
        setRole(d.role || '')
        // If accepted, fetch seller payment details
        if (d.order?.status === 'SELLER_ACCEPTED' && d.role === 'buyer') {
          const sellerId = d.items?.[0]?.sellerId
          if (sellerId) {
            fetch(`/api/marketplace/orders/seller-payment/${sellerId}`)
              .then(r => r.ok ? r.json() : null)
              .then(pd => setSellerPayment(pd))
              .catch(() => {})
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>
  }

  if (!order) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><p className="text-white">Order not found</p></div>
  }

  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-neutral-500/20 text-neutral-400 border-neutral-500', icon: Clock }
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={role === 'seller' ? '/marketplace/seller/orders' : '/marketplace/orders'} className="flex items-center gap-2 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <span className="font-bold text-lg">Order {order.orderNumber}</span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Status banner */}
        <div className={`p-5 rounded-2xl border-2 ${statusInfo.color}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className="w-6 h-6" />
            <div>
              <p className="font-bold">{statusInfo.label}</p>
              {order.status === 'AWAITING_SELLER_ACCEPT' && (
                <p className="text-xs opacity-80 mt-1">The seller has been notified. You'll be notified when they respond.</p>
              )}
              {order.status === 'SELLER_DECLINED' && order.sellerDeclineReason && (
                <p className="text-xs opacity-80 mt-1">Reason: {order.sellerDeclineReason}</p>
              )}
              {order.status === 'SELLER_ACCEPTED' && (
                <p className="text-xs opacity-80 mt-1">Payment flow coming soon — you'll be notified when it's ready</p>
              )}
            </div>
          </div>
        </div>

        {/* Order info */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <h3 className="text-xs uppercase font-bold text-neutral-500 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Order number</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Placed</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.shippingAddress && (
              <div className="flex justify-between">
                <span className="text-neutral-400">Ship to</span>
                <span className="text-right max-w-[60%]">{order.shippingAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <h3 className="text-xs uppercase font-bold text-neutral-500 mb-3">Items ({items.length})</h3>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-neutral-600" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/marketplace/listing/${item.listingId}`} className="font-bold text-sm hover:text-amber-400 truncate block">{item.title}</Link>
                  <p className="text-xs text-neutral-500">Qty: {item.quantity} × KES {Number(item.unitPrice).toLocaleString()}</p>
                </div>
                <span className="font-bold text-sm">KES {Number(item.lineTotal).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Subtotal</span>
              <span>KES {Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Delivery</span>
              <span>KES {Number(order.deliveryFee || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-800 pt-2 mt-2 text-lg font-bold">
              <span>Total</span>
              <span className="text-green-400">KES {Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Seller payment details — only when accepted */}
        {order.status === 'SELLER_ACCEPTED' && sellerPayment && (
          <div className="p-5 rounded-2xl bg-green-950/30 border border-green-800">
            <h3 className="text-xs uppercase font-bold text-green-400 mb-3">💳 Seller Payment Details</h3>
            {sellerPayment.preferredPaymentMethod === 'PAYBILL' && sellerPayment.paymentPaybill && (
              <div className="space-y-1 text-sm">
                <p className="text-green-300">Pay via M-Pesa Paybill:</p>
                <p><b>Paybill:</b> {sellerPayment.paymentPaybill}</p>
                <p><b>Account:</b> {sellerPayment.paymentPaybillAccount || order.orderNumber}</p>
                <p className="text-xs text-green-400/70 mt-2">Amount: KES {Number(order.total).toLocaleString()}</p>
              </div>
            )}
            {sellerPayment.preferredPaymentMethod === 'TILL' && sellerPayment.paymentTill && (
              <div className="space-y-1 text-sm">
                <p className="text-green-300">Pay via M-Pesa Buy Goods (Till):</p>
                <p><b>Till Number:</b> {sellerPayment.paymentTill}</p>
                <p className="text-xs text-green-400/70 mt-2">Amount: KES {Number(order.total).toLocaleString()}</p>
              </div>
            )}
            {sellerPayment.preferredPaymentMethod === 'PERSONAL' && sellerPayment.paymentPersonal && (
              <div className="space-y-1 text-sm">
                <p className="text-green-300">Send M-Pesa directly to:</p>
                <p><b>Phone:</b> {sellerPayment.paymentPersonal}</p>
                <p className="text-xs text-green-400/70 mt-2">Amount: KES {Number(order.total).toLocaleString()}</p>
              </div>
            )}
            <p className="text-xs text-green-400/70 mt-4 italic">In-app M-Pesa payment coming soon. For now, use the details above.</p>
          </div>
        )}
      </main>
    </div>
  )
}