'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Package, Loader2, ChevronLeft, Clock, CheckCircle, XCircle, Store } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string, color: string, icon: any }> = {
  'AWAITING_SELLER_ACCEPT': { label: 'Waiting for seller to accept', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500', icon: Clock },
  'SELLER_ACCEPTED': { label: 'Seller accepted — pay now', color: 'bg-blue-500/20 text-blue-400 border-blue-500', icon: CheckCircle },
  'SELLER_DECLINED': { label: 'Seller declined', color: 'bg-red-500/20 text-red-400 border-red-500', icon: XCircle },
  'AWAITING_SELLER_VERIFICATION': { label: 'Awaiting seller to verify payment', color: 'bg-purple-500/20 text-purple-400 border-purple-500', icon: Clock },
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
  const [showPayModal, setShowPayModal] = useState(false)
  const [receiptCode, setReceiptCode] = useState('')
  const [buyerNotes, setBuyerNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/marketplace/orders?id=${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setOrder(d.order)
        setItems(d.items || [])
        setRole(d.role || '')
        if ((d.order?.status === 'SELLER_ACCEPTED' || d.order?.status === 'AWAITING_SELLER_VERIFICATION') && d.role === 'buyer') {
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

  const submitPayment = async () => {
    if (!receiptCode.trim()) { alert('Enter M-Pesa receipt code'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/marketplace/orders/${id}/submit-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptCode: receiptCode.trim().toUpperCase(), notes: buyerNotes.trim() }),
      })
      if (res.ok) { window.location.reload() }
      else { const d = await res.json(); alert(d.error || 'Failed') }
    } finally { setSubmitting(false) }
  }

  const confirmPayment = async (action: 'confirm' | 'reject') => {
    const reason = action === 'reject' ? prompt('Reason for rejecting this payment?') : null
    if (action === 'reject' && reason === null) return
    setVerifying(true)
    try {
      const res = await fetch(`/api/marketplace/orders/${id}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      if (res.ok) window.location.reload()
      else { const d = await res.json(); alert(d.error || 'Failed') }
    } finally { setVerifying(false) }
  }

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
                <p className="text-xs opacity-80 mt-1">The seller has been notified.</p>
              )}
              {order.status === 'SELLER_DECLINED' && order.sellerDeclineReason && (
                <p className="text-xs opacity-80 mt-1">Reason: {order.sellerDeclineReason}</p>
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

        {/* Invoice + Receipt download */}
        <div className="flex gap-2">
          <a
            href={`/api/marketplace/orders/${id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-center flex items-center justify-center gap-2"
          >
            📄 Download Invoice
          </a>
          {order.paymentStatus === 'PAID' && (
            <a
              href={`/api/marketplace/orders/${id}/receipt`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-center flex items-center justify-center gap-2"
            >
              ✓ View Receipt
            </a>
          )}
        </div>
        </div>

        {/* Seller Payment Details — visible to buyer after seller accepts */}
        {sellerPayment && (order.status === 'SELLER_ACCEPTED' || order.status === 'AWAITING_SELLER_VERIFICATION') && (
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
          </div>
        )}

        {/* Buyer — Submit Receipt */}
        {role === 'buyer' && order.status === 'SELLER_ACCEPTED' && (
          <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800">
            <h3 className="text-xs uppercase font-bold text-amber-400 mb-2">💳 Already paid?</h3>
            <p className="text-sm text-neutral-300 mb-3">Submit your M-Pesa receipt so the seller can verify.</p>
            <button
              onClick={() => setShowPayModal(true)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              I&apos;ve Paid · Submit Receipt
            </button>
          </div>
        )}

        {/* Buyer — Awaiting Verification */}
        {role === 'buyer' && order.status === 'AWAITING_SELLER_VERIFICATION' && (
          <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-800">
            <p className="text-sm text-blue-300">
              <b>⏳ Waiting for seller to verify payment.</b> Receipt: <b>{order.paymentReference}</b>
            </p>
          </div>
        )}

        {/* Seller — Verify Payment */}
        {role === 'seller' && order.status === 'AWAITING_SELLER_VERIFICATION' && (
          <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-800">
            <h3 className="text-xs uppercase font-bold text-blue-400 mb-2">💰 Verify Payment</h3>
            <p className="text-sm text-neutral-300 mb-3">
              Buyer submitted receipt: <b className="text-white">{order.paymentReference}</b>
              <br />Amount expected: <b>KES {Number(order.total).toLocaleString()}</b>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => confirmPayment('confirm')}
                disabled={verifying}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50"
              >
                ✅ Confirm Payment Received
              </button>
              <button
                onClick={() => confirmPayment('reject')}
                disabled={verifying}
                className="flex-1 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 font-bold disabled:opacity-50"
              >
                ❌ Not Received
              </button>
            </div>
          </div>
        )}

        {/* Pay modal */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowPayModal(false)}>
            <div className="bg-neutral-900 rounded-2xl max-w-md w-full p-6 border border-neutral-800" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-2">Submit M-Pesa Receipt</h2>
              <p className="text-xs text-neutral-400 mb-4">Enter the code from your M-Pesa SMS (e.g., QK1234ABCD).</p>
              <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Receipt Code *</label>
              <input
                value={receiptCode}
                onChange={e => setReceiptCode(e.target.value.toUpperCase())}
                placeholder="e.g. QK1234ABCD"
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white mb-3 font-mono"
                autoFocus
              />
              <label className="text-xs uppercase font-bold text-neutral-500 mb-1 block">Notes (optional)</label>
              <textarea
                value={buyerNotes}
                onChange={e => setBuyerNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitPayment}
                  disabled={submitting || !receiptCode.trim()}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="px-5 py-3 rounded-xl bg-neutral-800 font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}