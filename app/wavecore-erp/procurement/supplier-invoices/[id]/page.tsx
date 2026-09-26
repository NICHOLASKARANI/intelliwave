'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Receipt, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X, Check,
  XCircle, Send, Ban, FileDown, Layers, Activity, FileText, Package,
  Package2, Users, ExternalLink, Calendar, DollarSign, Trash2, Plus,
  ShieldCheck, AlertOctagon, Sparkles, RotateCw, CheckCheck,
} from 'lucide-react'

type Tab = 'overview' | 'lines' | 'match' | 'activity' | 'related'

interface InvHook {
  id: string
  invoiceNumber: string
  supplierInvoiceRef?: string
  purchaseOrderId?: string
  goodsReceiptId?: string
  supplierId?: string
  supplierName?: string
  invoiceDate?: string
  dueDate?: string
  currency: string
  subtotal: number
  taxAmount: number
  total: number
  status: string
  matchStatus: string
  matchNotes?: string
  approvedAt?: string
  approvedByName?: string
  paidAt?: string
  paymentReference?: string
  receivedByName?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function SupplierInvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [invoice, setInvoice] = useState<InvHook | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const [po, setPo] = useState<any>(null)
  const [grn, setGrn] = useState<any>(null)
  const [supplier, setSupplier] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [matchResult, setMatchResult] = useState<any>(null)

  const [modal, setModal] = useState<null | 'approve' | 'reject' | 'paid' | 'cancel'>(null)
  const [comment, setComment] = useState('')
  const [paymentRef, setPaymentRef] = useState('')

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/supplier-invoices/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setInvoice(data.supplierInvoice)
      setLines(data.lines || [])
      setPo(data.purchaseOrder)
      setGrn(data.goodsReceipt)
      setSupplier(data.supplier)
      // fetch activity
      try {
        const ares = await fetch('/api/wavecore/procurement/supplier-invoices/' + id)
        // activity is not included above — build a lightweight local list from events endpoint if exists, else empty
      } catch {}
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const runMatch = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/supplier-invoices/' + id + '/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: '{}',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Match failed'); return }
      setMatchResult(data)
      flash('Match complete: ' + data.overall)
      fetchAll()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally { setWorking(false) }
  }

  const lifecycle = async (action: string, extra?: any) => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/supplier-invoices/' + id + '/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ action, ...(extra || {}) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Action failed'); return false }
      flash(action + ' OK')
      fetchAll()
      return true
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
      return false
    } finally { setWorking(false) }
  }

  const submit = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/supplier-invoices/' + id + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: '{}',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submit failed'); return }
      flash('Submitted')
      fetchAll()
    } finally { setWorking(false) }
  }

  const deleteInvoice = async () => {
    if (!confirm('Delete this DRAFT invoice? Cannot be undone.')) return
    const res = await fetch('/api/wavecore/procurement/supplier-invoices/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) router.push('/wavecore-erp/procurement/supplier-invoices')
    else { const d = await res.json(); setError(d.error || 'Delete failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-700 text-neutral-200'
      case 'SUBMITTED': return 'bg-amber-900/50 text-amber-200'
      case 'MATCHED': return 'bg-green-900/50 text-green-200'
      case 'PARTIAL_MATCH': return 'bg-orange-900/50 text-orange-200'
      case 'MISMATCH': return 'bg-red-900/50 text-red-200'
      case 'APPROVED': return 'bg-emerald-900/50 text-emerald-200'
      case 'REJECTED': return 'bg-red-900/50 text-red-200'
      case 'PAID': return 'bg-purple-900/50 text-purple-200'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }
  const matchColor = (s: string) => {
    switch (s) {
      case 'AUTO_MATCHED': return 'bg-green-900/50 text-green-200'
      case 'PARTIAL': return 'bg-orange-900/50 text-orange-200'
      case 'EXCEPTION': return 'bg-red-900/50 text-red-200'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }
  const statusLabel = (s: string) => ({
    DRAFT: 'Draft', SUBMITTED: 'Submitted', MATCHED: 'Matched',
    PARTIAL_MATCH: 'Partial Match', MISMATCH: 'Mismatch',
    APPROVED: 'Approved', REJECTED: 'Rejected', PAID: 'Paid', CANCELLED: 'Cancelled',
  } as Record<string, string>)[s] || s
  const matchLabel = (s: string) => ({
    UNMATCHED: 'Unmatched', AUTO_MATCHED: 'Auto Matched',
    PARTIAL: 'Partial', EXCEPTION: 'Exception',
  } as Record<string, string>)[s] || s

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  )
  if (error && !invoice) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/supplier-invoices" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )
  if (!invoice) return null

  const isDraft = invoice.status === 'DRAFT'
  const isSubmitted = invoice.status === 'SUBMITTED'
  const isMatched = invoice.status === 'MATCHED'
  const isPartial = invoice.status === 'PARTIAL_MATCH'
  const isMismatch = invoice.status === 'MISMATCH'
  const isApproved = invoice.status === 'APPROVED'
  const isPaid = invoice.status === 'PAID'
  const isRejected = invoice.status === 'REJECTED'
  const isCancelled = invoice.status === 'CANCELLED'
  const isTerminal = isPaid || isCancelled
  const canSubmit = isDraft && lines.length > 0
  const canRunMatch = isSubmitted || isMatched || isPartial || isMismatch
  const canApprove = isSubmitted || isMatched || isPartial || isMismatch
  const canReject = canApprove || isApproved
  const canMarkPaid = isApproved
  const canCancel = !isTerminal
  const canDelete = isDraft

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview',  icon: FileText },
    { key: 'lines',    label: 'Lines',     icon: Layers, count: lines.length },
    { key: 'match',    label: 'Match',     icon: ShieldCheck },
    { key: 'activity', label: 'Activity',  icon: Activity },
    { key: 'related',  label: 'Related',   icon: ExternalLink },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Supplier Invoice</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/supplier-invoices" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-white/90">{invoice.invoiceNumber}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(invoice.status)}>{statusLabel(invoice.status)}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + matchColor(invoice.matchStatus)}>{matchLabel(invoice.matchStatus)}</span>
                {invoice.supplierInvoiceRef && <span className="text-[10px] text-white/70">ref {invoice.supplierInvoiceRef}</span>}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-2 flex-wrap">
                <Users className="w-6 h-6" />
                {invoice.supplierName || 'Unknown supplier'}
              </p>
              <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
                {po && <span className="flex items-center gap-1"><Package className="w-3 h-3" />PO {po.number}</span>}
                {grn && <span className="flex items-center gap-1"><Package2 className="w-3 h-3" />GRN {grn.grnNumber}</span>}
                {invoice.invoiceDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />inv {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</span>}
                {invoice.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />due {new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl lg:text-4xl font-bold text-white">{invoice.currency} {Number(invoice.total || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Invoice total</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6 flex-wrap">
            {isDraft && (
              <>
                <button onClick={submit} disabled={working || !canSubmit} className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                </button>
                <button onClick={deleteInvoice} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            {canRunMatch && (
              <button onClick={runMatch} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />} Run Match
              </button>
            )}
            {canApprove && (
              <button onClick={() => setModal('approve')} className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg">
                <Check className="w-4 h-4" /> Approve
              </button>
            )}
            {canReject && (
              <button onClick={() => setModal('reject')} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            )}
            {canMarkPaid && (
              <button onClick={() => setModal('paid')} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Mark Paid
              </button>
            )}
            {canCancel && !isDraft && (
              <button onClick={() => setModal('cancel')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Ban className="w-4 h-4" /> Cancel
              </button>
            )}
            <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
              <FileDown className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-1 mb-6 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Invoice details</h3>
              <div className="space-y-3 text-sm">
                <Row label="Supplier ref" value={invoice.supplierInvoiceRef} />
                <Row label="Invoice date" value={invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-GB') : null} />
                <Row label="Due date" value={invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : null} />
                <Row label="Currency" value={invoice.currency} />
                <Row label="Created by" value={invoice.receivedByName} />
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Totals</h3>
              <div className="space-y-3 text-sm">
                <Row label="Subtotal" value={invoice.currency + ' ' + Number(invoice.subtotal || 0).toLocaleString()} />
                <Row label="Tax" value={invoice.currency + ' ' + Number(invoice.taxAmount || 0).toLocaleString()} />
                <Row label="Total" value={invoice.currency + ' ' + Number(invoice.total || 0).toLocaleString()} bold />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <TimeStamp label="Created" value={invoice.createdAt} />
                <TimeStamp label="Updated" value={invoice.updatedAt} />
                <TimeStamp label="Approved" value={invoice.approvedAt} />
                <TimeStamp label="Paid" value={invoice.paidAt} />
              </div>
            </div>

            {invoice.matchNotes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Match summary</h3>
                <p className="text-sm whitespace-pre-wrap">{invoice.matchNotes}</p>
                {invoice.paymentReference && <p className="text-xs text-purple-500 mt-2">Payment ref: {invoice.paymentReference}</p>}
              </div>
            )}
            {invoice.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lines' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {lines.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No lines</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Tax %</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                      <th className="px-4 py-3 text-center">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l: any) => (
                      <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="px-4 py-3 text-neutral-500">{l.lineNumber || '—'}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{l.description}</p>
                          <div className="flex gap-2 mt-1 text-[10px] text-neutral-500 flex-wrap">
                            {l.purchaseOrderItemId && <span className="text-indigo-500">PO linked</span>}
                            {l.goodsReceiptLineId && <span className="text-emerald-500">GRN linked</span>}
                          </div>
                          {l.matchNotes && <p className="text-[10px] text-neutral-500 mt-1">{l.matchNotes}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">{Number(l.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{Number(l.unitPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{Number(l.taxRate || 0)}%</td>
                        <td className="px-4 py-3 text-right font-bold">{Number(l.lineTotal).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + matchColor(l.matchStatus)}>{matchLabel(l.matchStatus)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'match' && (
          <div className="space-y-4">
            <div className={'rounded-2xl p-6 border ' + (
              invoice.matchStatus === 'AUTO_MATCHED' ? 'bg-green-900/10 border-green-800' :
              invoice.matchStatus === 'PARTIAL' ? 'bg-orange-900/10 border-orange-800' :
              invoice.matchStatus === 'EXCEPTION' ? 'bg-red-900/10 border-red-800' :
              'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
            )}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-2">Match status</h3>
                  <div className="flex items-center gap-3">
                    {invoice.matchStatus === 'AUTO_MATCHED' ? <ShieldCheck className="w-8 h-8 text-green-500" /> :
                     invoice.matchStatus === 'EXCEPTION' ? <AlertOctagon className="w-8 h-8 text-red-500" /> :
                     invoice.matchStatus === 'PARTIAL' ? <Sparkles className="w-8 h-8 text-orange-500" /> :
                     <ShieldCheck className="w-8 h-8 text-neutral-400" />}
                    <div>
                      <p className="text-2xl font-bold">{matchLabel(invoice.matchStatus)}</p>
                      {invoice.matchNotes && <p className="text-sm text-neutral-500 mt-1">{invoice.matchNotes}</p>}
                    </div>
                  </div>
                </div>
                <button onClick={runMatch} disabled={working || !canRunMatch} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />} Run 3-Way Match
                </button>
              </div>
            </div>

            {matchResult && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Per-line verdict</h3>
                <div className="space-y-2">
                  {matchResult.perLine.map((lm: any) => (
                    <div key={lm.lineId} className={'p-3 rounded-xl border ' + (
                      lm.verdict === 'MATCHED' ? 'bg-green-900/10 border-green-800/50' :
                      lm.verdict === 'PARTIAL' ? 'bg-orange-900/10 border-orange-800/50' :
                      lm.verdict === 'EXCEPTION' ? 'bg-red-900/10 border-red-800/50' :
                      'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800'
                    )}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-[220px]">
                          <p className="text-sm font-bold">Line {lm.lineNumber || '—'}: {lm.description || '—'}</p>
                          <p className="text-xs text-neutral-500 mt-1">{lm.notes}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-bold">{matchLabel(lm.verdict)}</p>
                          <p className="text-neutral-500 mt-1">qty var {Number(lm.qtyVariance).toFixed(2)}</p>
                          <p className="text-neutral-500">amt var {Number(lm.amountVariance).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-center text-sm text-neutral-500 py-8">Activity log loads from the ProcurementEvent table — visible via Procurement dashboard</p>
          </div>
        )}

        {tab === 'related' && (
          <div className="space-y-4">
            {po && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-500" /> Purchase Order</h3>
                <Link href={'/wavecore-erp/procurement/orders/' + po.id} className="block p-4 rounded-xl bg-indigo-900/10 dark:bg-indigo-900/20 border border-indigo-800/30 hover:border-indigo-500 transition">
                  <p className="text-xs font-bold text-indigo-500">{po.number}</p>
                  <p className="font-bold mt-1">{po.supplierName}</p>
                  <p className="text-xs text-neutral-500 mt-1">{po.currency} {Number(po.total || po.amount || 0).toLocaleString()} · {po.status}</p>
                </Link>
              </div>
            )}
            {grn && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Package2 className="w-4 h-4 text-emerald-500" /> Goods Receipt</h3>
                <Link href={'/wavecore-erp/procurement/goods-receipts/' + grn.id} className="block p-4 rounded-xl bg-emerald-900/10 dark:bg-emerald-900/20 border border-emerald-800/30 hover:border-emerald-500 transition">
                  <p className="text-xs font-bold text-emerald-500">{grn.grnNumber}</p>
                  <p className="text-xs text-neutral-500 mt-1">Status {grn.status} · Received {grn.receivedAt ? new Date(grn.receivedAt).toLocaleDateString('en-GB') : '—'}</p>
                </Link>
              </div>
            )}
            {supplier && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Supplier</h3>
                <Link href={'/wavecore-erp/procurement/suppliers/' + supplier.id} className="block p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 transition">
                  <p className="font-bold">{supplier.name}</p>
                  {supplier.legalName && <p className="text-xs text-neutral-500 mt-0.5">{supplier.legalName}</p>}
                  <p className="text-xs text-neutral-500 mt-1">{supplier.email || 'No email'} · {supplier.phone || 'No phone'}</p>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setModal(null); setComment(''); setPaymentRef('') }}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold capitalize">{modal} invoice</h2>
              <button onClick={() => { setModal(null); setComment(''); setPaymentRef('') }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {modal === 'paid' && (
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Payment reference *</label>
                  <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="e.g. EFT-2026-00123" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </div>
              )}
              {modal === 'approve' && (
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Comment (optional)</label>
                  <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </div>
              )}
              {(modal === 'reject' || modal === 'cancel') && (
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Reason{modal === 'reject' ? ' *' : ''}</label>
                  <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => { setModal(null); setComment(''); setPaymentRef('') }} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
              <button
                onClick={async () => {
                  if (modal === 'approve') {
                    const ok = await lifecycle('APPROVE', { reason: comment })
                    if (ok) { setModal(null); setComment('') }
                  } else if (modal === 'reject') {
                    if (!comment.trim()) return
                    const ok = await lifecycle('REJECT', { reason: comment })
                    if (ok) { setModal(null); setComment('') }
                  } else if (modal === 'paid') {
                    if (!paymentRef.trim()) return
                    const ok = await lifecycle('PAID', { paymentReference: paymentRef })
                    if (ok) { setModal(null); setPaymentRef('') }
                  } else if (modal === 'cancel') {
                    const ok = await lifecycle('CANCEL', { reason: comment })
                    if (ok) { setModal(null); setComment('') }
                  }
                }}
                disabled={working || (modal === 'reject' && !comment.trim()) || (modal === 'paid' && !paymentRef.trim())}
                className={'px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50 ' + (modal === 'approve' ? 'bg-green-600 hover:bg-green-700' : modal === 'paid' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700')}
              >
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm {modal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'font-medium'}>{value || '—'}</span>
    </div>
  )
}

function TimeStamp({ label, value }: any) {
  return (
    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mb-1">{label}</p>
      <p className="text-xs font-medium">{value ? new Date(value).toLocaleString('en-GB') : '—'}</p>
    </div>
  )
}