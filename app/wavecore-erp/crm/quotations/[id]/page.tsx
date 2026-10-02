'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, AlertTriangle, FileText, Printer, Trash2,
  User, Mail, Phone, Building2, Calendar, DollarSign, Package,
} from 'lucide-react'

interface Quotation {
  id: string
  number: string
  status: string
  date?: string
  validUntil?: string
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
  createdAt: string
}

interface Line {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface LinkedOrder {
  id: string
  number: string
  status: string
  total: number
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-neutral-800 text-neutral-300',
  SENT:      'bg-blue-900/50 text-blue-300',
  ACCEPTED:  'bg-green-900/50 text-green-300',
  REJECTED:  'bg-red-900/50 text-red-300',
  EXPIRED:   'bg-orange-900/50 text-orange-300',
  CONVERTED: 'bg-purple-900/50 text-purple-300',
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—'
const fmtMoney = (n: any) => 'KSh ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [items, setItems] = useState<Line[]>([])
  const [linkedOrders, setLinkedOrders] = useState<LinkedOrder[]>([])
  const [working, setWorking] = useState(false)

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/quotations/' + id, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setQuotation(data.quotation)
      setItems(data.items || [])
      setLinkedOrders(data.linkedOrders || [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() /* eslint-disable-next-line */ }, [id])

  const deleteQuotation = async () => {
    if (!quotation) return
    if (!confirm('Delete quotation ' + quotation.number + '? This cannot be undone.')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/crm/quotations?id=' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Delete failed')
        return
      }
      router.push('/wavecore-erp/crm/quotations')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
          <div className="flex items-center gap-3 px-4 h-16">
            <Link href="/wavecore-erp/crm/quotations" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold">Quotation</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-8">
          <div className="p-6 rounded-2xl bg-red-900/20 border border-red-800 text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error || 'Quotation not found'}
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
            <Link href="/wavecore-erp/crm/quotations" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={32} height={32} className="rounded-lg object-cover" />
            <div>
              <p className="text-xs text-neutral-500">Quotation</p>
              <p className="font-bold font-mono">{quotation.number}</p>
            </div>
            <span className={'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ' + (STATUS_COLORS[quotation.status] || 'bg-neutral-800 text-neutral-300')}>
              {quotation.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={'/api/wavecore/crm/quotations/' + id + '/pdf'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </a>
            <button
              onClick={deleteQuotation}
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

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 p-6 lg:p-8 mb-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
                <FileText className="w-8 h-8" /> {quotation.number}
              </h1>
              <p className="text-white/80 text-sm">{fmtMoney(quotation.total)}</p>
            </div>
            <div className="text-right text-sm">
              <p>Created {fmtDate(quotation.createdAt)}</p>
              {quotation.validUntil && <p>Valid until {fmtDate(quotation.validUntil)}</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Customer */}
          <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer
            </h3>
            {quotation.customerId ? (
              <div className="space-y-2 text-sm">
                <p className="font-bold text-neutral-900 dark:text-white">{quotation.customerName || 'Unknown'}</p>
                {quotation.customerCompany && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Building2 className="w-3.5 h-3.5" /> {quotation.customerCompany}</p>}
                {quotation.customerEmail && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Mail className="w-3.5 h-3.5" /> {quotation.customerEmail}</p>}
                {quotation.customerPhone && <p className="text-neutral-500 flex items-center gap-2 text-xs"><Phone className="w-3.5 h-3.5" /> {quotation.customerPhone}</p>}
                {(quotation.customerAddress || quotation.customerCity) && (
                  <p className="text-neutral-500 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    {quotation.customerAddress}
                    {quotation.customerAddress && quotation.customerCity ? ', ' : ''}
                    {quotation.customerCity}
                  </p>
                )}
                <Link href={'/wavecore-erp/crm/customers/' + quotation.customerId} className="inline-block text-xs text-indigo-500 hover:underline pt-2">
                  View customer →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No customer linked</p>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Summary
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-right font-medium">{fmtMoney(quotation.subtotal)}</span>

              <span className="text-neutral-500">Tax (16%)</span>
              <span className="text-right font-medium">{fmtMoney(quotation.taxAmount)}</span>

              <span className="text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-3">Total</span>
              <span className="text-right font-bold text-lg border-t border-neutral-100 dark:border-neutral-800 pt-3">{fmtMoney(quotation.total)}</span>

              <span className="text-neutral-500">Line items</span>
              <span className="text-right">{items.length}</span>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold flex items-center gap-2">
              <Package className="w-4 h-4" /> Line items ({items.length})
            </h3>
          </div>
          {items.length === 0 ? (
            <div className="p-10 text-center text-neutral-500 text-sm">
              No line items saved for this quotation.
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

        {/* Notes */}
        {quotation.notes && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{quotation.notes}</p>
          </div>
        )}

        {/* Linked sales orders */}
        {linkedOrders.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Linked sales orders
            </h3>
            <div className="space-y-2">
              {linkedOrders.map(o => (
                <Link key={o.id} href={'/wavecore-erp/crm/orders/' + o.id} className="block p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono font-bold text-sm">{o.number}</p>
                      <p className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleDateString('en-GB')} · {o.status}</p>
                    </div>
                    <p className="font-bold text-sm">{fmtMoney(o.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}