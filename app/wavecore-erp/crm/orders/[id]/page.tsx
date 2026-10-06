'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, Package, Printer, Trash2,
  User, Mail, Phone, Building2, Calendar, DollarSign, FileText,
  Receipt, CheckCircle2, X, ExternalLink,
} from 'lucide-react'

interface Order {
  id: string
  number: string
  status: string
  date?: string
  deliveryDate?: string
  subtotal: number
  taxAmount: number
  total: number
  notes?: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerCompany?: string
  customerAddress?: string
  customerCity?: string
  quotationId?: string
  quotationNumber?: string
  createdAt: string
}

interface Line {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-900/50 text-amber-300',
  CONFIRMED: 'bg-blue-900/50 text-blue-300',
  SHIPPED:   'bg-purple-900/50 text-purple-300',
  DELIVERED: 'bg-green-900/50 text-green-300',
  CANCELLED: 'bg-red-900/50 text-red-300',
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtMoney = (n: any) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<Line[]>([])
  const [working, setWorking] = useState(false)
  // CRM-3 — invoice conversion state
  const [converting, setConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<{ id: string; number: string; total: number; alreadyExisted: boolean } | null>(null)
  const [showConvertModal, setShowConvertModal] = useState(false)

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/orders/' + id, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setOrder(data.order)
      setItems(data.items || [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const deleteOrder = async () => {
    if (!order) return
    if (!confirm('Delete sales order ' + order.number + '? This cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/crm/orders?id=' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Delete failed')
        return
      }
      router.push('/wavecore-erp/crm/orders')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  // CRM-3 — create (or fetch existing) CustomerInvoice for this order
  const convertToInvoice = async () => {
    if (!order) return
    setConverting(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/crm/orders/' + id + '/convert-to-invoice', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Conversion failed'); return }
      setConversionResult({
        id: data.invoice.id,
        number: data.invoice.number,
        total: data.invoice.total,
        alreadyExisted: !!data.alreadyExisted,
      })
      setShowConvertModal(true)
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/crm/orders" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold">Sales Order</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-8">
          <div className="p-6 rounded-2xl bg-red-900/20 border border-red-800 text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error || 'Sales order not found'}
          </div>
        </main>
      </div>
    )
  }

  const linesTotal = items.reduce((s, i) => s + Number(i.total || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link href="/wavecore-erp/crm/orders" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Sales Order</p>
              <p className="font-bold font-mono">{order.number}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (STATUS_COLORS[order.status] || 'bg-neutral-800 text-neutral-300')}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={'/api/wavecore/crm/orders/' + id + '/pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </a>
            <button
              onClick={convertToInvoice}
              disabled={converting || working || order.status === 'CANCELLED'}
              title={order.status === 'CANCELLED' ? 'Cancelled orders cannot be invoiced' : 'Create (or view) the linked Customer Invoice'}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              {conversionResult ? 'View Invoice' : 'Create Invoice'}
            </button>
            <button
              onClick={deleteOrder}
              disabled={working}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
            >
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">

        <div className="rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-orange-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
                <Package className="w-8 h-8" /> {order.number}
              </h1>
              <p className="text-white/80 text-sm">{fmtMoney(order.total)}</p>
            </div>
            <div className="text-right text-sm">
              <p>Created {fmtDate(order.createdAt)}</p>
              {order.deliveryDate && <p>Delivery {fmtDate(order.deliveryDate)}</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer
            </h3>
            {order.customerId ? (
              <div className="space-y-2 text-sm">
                <p className="font-bold text-neutral-900 dark:text-white">{order.customerName || 'Unknown'}</p>
                {order.customerCompany && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Building2 className="w-3.5 h-3.5" /> {order.customerCompany}</p>}
                {order.customerEmail && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5" /> {order.customerEmail}</p>}
                {order.customerPhone && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Phone className="w-3.5 h-3.5" /> {order.customerPhone}</p>}
                {(order.customerAddress || order.customerCity) && (
                  <p className="text-neutral-500 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    {order.customerAddress}
                    {order.customerAddress && order.customerCity ? ', ' : ''}
                    {order.customerCity}
                  </p>
                )}
                <Link href={'/wavecore-erp/crm/customers/' + order.customerId} className="inline-block text-xs text-indigo-500 hover:underline pt-2">
                  View customer →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No customer linked</p>
            )}
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Summary
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-right font-medium">{fmtMoney(order.subtotal)}</span>

              <span className="text-neutral-500">Tax (16%)</span>
              <span className="text-right font-medium">{fmtMoney(order.taxAmount)}</span>

              <span className="text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-3">Total</span>
              <span className="text-right font-bold text-lg border-t border-neutral-100 dark:border-neutral-800 pt-3">{fmtMoney(order.total)}</span>

              <span className="text-neutral-500">Line items</span>
              <span className="text-right">{items.length}</span>

              {order.quotationId && (
                <>
                  <span className="text-neutral-500">Source quotation</span>
                  <span className="text-right">
                    <Link href={'/wavecore-erp/crm/quotations/' + order.quotationId} className="text-indigo-500 hover:underline">
                      {order.quotationNumber || 'view'} →
                    </Link>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold flex items-center gap-2">
              <Package className="w-4 h-4" /> Line items ({items.length})
            </h3>
          </div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-neutral-500 text-sm">
              No line items saved for this sales order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-6 py-3 w-10">#</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit price</th>
                    <th className="px-6 py-3 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((line, i) => (
                    <tr key={line.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="px-6 py-3 text-xs text-neutral-500">{i + 1}</td>
                      <td className="px-4 py-3">{line.description}</td>
                      <td className="px-4 py-3 text-right">{line.quantity}</td>
                      <td className="px-4 py-3 text-right">{fmtMoney(line.unitPrice)}</td>
                      <td className="px-6 py-3 text-right font-bold">{fmtMoney(line.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50 dark:bg-neutral-800/30">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-xs text-neutral-500 font-bold">Lines subtotal</td>
                    <td className="px-6 py-3 text-right font-bold">{fmtMoney(linesTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{order.notes}</p>
          </div>
        )}

        {showConvertModal && conversionResult && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowConvertModal(false)}>
            <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {conversionResult.alreadyExisted ? 'Invoice already exists' : 'Invoice created'}
                </h3>
                <button onClick={() => setShowConvertModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-neutral-500">Invoice #</span>
                  <span className="text-right font-mono font-bold">{conversionResult.number}</span>
                  <span className="text-neutral-500">Status</span>
                  <span className="text-right"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/40 text-amber-300">DRAFT</span></span>
                  <span className="text-neutral-500">Total</span>
                  <span className="text-right font-bold">{fmtMoney(conversionResult.total)}</span>
                </div>
                <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  The invoice is a draft in Finance — review and send it from there.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                <button onClick={() => setShowConvertModal(false)} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">
                  Close
                </button>
                <Link
                  href={'/wavecore-erp/finance/invoices/' + conversionResult.id}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" /> Open in Finance
                </Link>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}