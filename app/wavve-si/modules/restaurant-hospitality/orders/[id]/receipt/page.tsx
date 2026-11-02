'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft, AlertCircle } from 'lucide-react'

interface OrderDetail {
  id: string
  number: string
  date: string
  status: string
  subtotal: number
  taxAmount: number
  total: number
  customer: {
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
}

export default function ReceiptPage() {
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [orgName, setOrgName] = useState('Your Restaurant')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    Promise.all([
      fetch(`/api/wavve-si/restaurant/orders/${orderId}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject('Order not found')),
      fetch('/api/wavecore/auth/session', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
    ])
      .then(([orderData, session]) => {
        setOrder(orderData.order)
        setItems(orderData.items || [])
        if (session?.organization?.name) setOrgName(session.organization.name)
        setLoading(false)
      })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [orderId])

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" /></div>
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-lg mb-2">{error || 'Order not found'}</p>
        <Link href={`/wavve-si/modules/restaurant-hospitality/orders/${orderId}`} className="text-blue-600 hover:underline text-sm">
          Back to Order
        </Link>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 1cm; size: auto; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 print:bg-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Toolbar (hidden when printing) */}
          <div className="no-print flex items-center justify-between mb-6">
            <Link href={`/wavve-si/modules/restaurant-hospitality/orders/${orderId}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Back to Order
            </Link>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>

          {/* Receipt */}
          <div className="receipt-print-area bg-white text-slate-900 rounded-lg p-8 shadow-lg print:shadow-none">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <h1 className="text-2xl font-bold">{orgName}</h1>
              <p className="text-sm text-slate-600 mt-1">Order Receipt</p>
            </div>

            {/* Order info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-slate-500 uppercase text-xs font-bold mb-1">Order Number</p>
                <p className="font-mono font-bold text-base">{order.number}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 uppercase text-xs font-bold mb-1">Date</p>
                <p className="font-semibold">{new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p className="text-xs text-slate-600">{new Date(order.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Customer */}
            <div className="mb-6 pb-4 border-b border-slate-200">
              <p className="text-slate-500 uppercase text-xs font-bold mb-2">Customer</p>
              <p className="font-semibold">{order.customer?.name || 'Walk-in Customer'}</p>
              {order.customer?.company && <p className="text-sm text-slate-600">{order.customer.company}</p>}
              {order.customer?.email && <p className="text-sm text-slate-600">{order.customer.email}</p>}
              {order.customer?.phone && <p className="text-sm text-slate-600">{order.customer.phone}</p>}
            </div>

            {/* Items table */}
            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 font-bold">Item</th>
                  <th className="text-right py-2 font-bold w-16">Qty</th>
                  <th className="text-right py-2 font-bold w-24">Price</th>
                  <th className="text-right py-2 font-bold w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2 text-right font-semibold">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">KSh {order.subtotal.toLocaleString()}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Tax</span>
                    <span className="font-semibold">KSh {order.taxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-slate-900 mt-2">
                  <span className="font-bold text-base">TOTAL</span>
                  <span className="font-bold text-base">KSh {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-slate-200 pt-4 text-xs text-slate-500">
              <p className="mb-1">Thank you for your business!</p>
              <p>Status: <span className="font-bold">{order.status}</span></p>
              <p className="mt-2">Generated by Wavve SI · Powered by IntelliWavve</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}