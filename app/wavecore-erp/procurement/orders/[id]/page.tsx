'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Package, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X, Check,
  XCircle, Send, Truck, CheckCheck, Ban, FileDown, Layers, Activity,
  FileText, ClipboardList, Users, ExternalLink, Calendar, MapPin,
  DollarSign, Clock, Plus, Trash2, Save, Package2, Hash, Info,
} from 'lucide-react'

type Tab = 'overview' | 'lines' | 'approvals' | 'activity' | 'related'

interface POHook {
  id: string
  number: string
  date: string
  status: string
  type: string
  subtotal: number
  taxAmount: number
  total: number
  amount: number
  currency: string
  paymentTerms: number
  supplierId?: string
  supplierName?: string
  requisitionId?: string
  deliveryDate?: string
  deliveryLocation?: string
  incoterms?: string
  sentAt?: string
  sentBy?: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  closedAt?: string
  closedBy?: string
  currentApprovalStep: number
  totalApprovalSteps: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [po, setPo] = useState<POHook | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [supplier, setSupplier] = useState<any>(null)
  const [requisition, setRequisition] = useState<any>(null)

  // Modals
  const [modal, setModal] = useState<null | 'approve' | 'reject' | 'cancel' | 'add-line'>(null)
  const [comment, setComment] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [newLine, setNewLine] = useState<any>({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' })

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/purchase-orders/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setPo(data.purchaseOrder)
      setLines(data.lines || [])
      setApprovals(data.approvals || [])
      setActivity(data.activity || [])
      setSupplier(data.supplier)
      setRequisition(data.requisition)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const action = async (endpoint: string, body?: any, successMsg = 'Done') => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/purchase-orders/' + id + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: body ? JSON.stringify(body) : '{}',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Action failed'); return false }
      flash(successMsg)
      fetchAll()
      return true
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
      return false
    } finally {
      setWorking(false)
    }
  }

  const addLine = async () => {
    if (!newLine.description.trim()) { setError('Description required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/purchase-orders/' + id + '/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(newLine),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Line added')
      setModal(null)
      setNewLine({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' })
      fetchAll()
    } finally { setWorking(false) }
  }

  const removeLine = async (lineId: string) => {
    if (!confirm('Remove this line?')) return
    const res = await fetch('/api/wavecore/procurement/purchase-orders/' + id + '/lines/' + lineId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Line removed'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const deletePO = async () => {
    if (!confirm('Delete this draft PO? Cannot be undone.')) return
    const res = await fetch('/api/wavecore/procurement/purchase-orders/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) router.push('/wavecore-erp/procurement/orders')
    else { const d = await res.json(); setError(d.error || 'Delete failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-700 text-neutral-200'
      case 'SUBMITTED': return 'bg-amber-900/50 text-amber-200'
      case 'APPROVED': return 'bg-green-900/50 text-green-200'
      case 'REJECTED': return 'bg-red-900/50 text-red-200'
      case 'SENT': return 'bg-blue-900/50 text-blue-200'
      case 'ACKNOWLEDGED': return 'bg-cyan-900/50 text-cyan-200'
      case 'PARTIALLY_RECEIVED': return 'bg-orange-900/50 text-orange-200'
      case 'FULLY_RECEIVED': return 'bg-emerald-900/50 text-emerald-200'
      case 'INVOICED': return 'bg-indigo-900/50 text-indigo-200'
      case 'MATCHED': return 'bg-purple-900/50 text-purple-200'
      case 'CLOSED': return 'bg-neutral-700 text-neutral-400'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const statusLabel = (s: string) => ({
    DRAFT: 'Draft',
    SUBMITTED: 'Awaiting Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SENT: 'Sent',
    ACKNOWLEDGED: 'Acknowledged',
    PARTIALLY_RECEIVED: 'Partially Received',
    FULLY_RECEIVED: 'Fully Received',
    INVOICED: 'Invoiced',
    MATCHED: '3-Way Matched',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled',
  } as Record<string, string>)[s] || s

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
    </div>
  )

  if (error && !po) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/orders" className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )

  if (!po) return null

  const isDraft = po.status === 'DRAFT'
  const isSubmitted = po.status === 'SUBMITTED'
  const isApproved = po.status === 'APPROVED'
  const isSent = po.status === 'SENT'
  const isAcknowledged = po.status === 'ACKNOWLEDGED'
  const isTerminal = ['CLOSED','CANCELLED','REJECTED'].includes(po.status)
  const canClose = ['ACKNOWLEDGED','PARTIALLY_RECEIVED','FULLY_RECEIVED','INVOICED','MATCHED'].includes(po.status)
  const canCancel = !isTerminal && !['FULLY_RECEIVED','INVOICED','MATCHED'].includes(po.status)

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview',  label: 'Overview',  icon: FileText },
    { key: 'lines',     label: 'Lines',     icon: Layers, count: lines.length },
    { key: 'approvals', label: 'Approvals', icon: CheckCheck, count: approvals.length },
    { key: 'activity',  label: 'Activity',  icon: Activity, count: activity.length },
    { key: 'related',   label: 'Related',   icon: ExternalLink },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Purchase Order</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/orders" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Purchase Orders
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-red-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-white/90">{po.number}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(po.status)}>{statusLabel(po.status)}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">{po.type}</span>
                {isSubmitted && po.totalApprovalSteps > 0 && (
                  <span className="text-[10px] text-white/70">step {po.currentApprovalStep}/{po.totalApprovalSteps}</span>
                )}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-2 flex-wrap">
                <Users className="w-6 h-6" />
                {supplier ? (
                  <Link href={'/wavecore-erp/procurement/suppliers/' + supplier.id} className="hover:underline">
                    {po.supplierName || supplier.name}
                  </Link>
                ) : (po.supplierName || 'Unknown supplier')}
              </p>
              <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(po.date || po.createdAt).toLocaleDateString('en-GB')}</span>
                {po.deliveryDate && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />delivery {new Date(po.deliveryDate).toLocaleDateString('en-GB')}</span>}
                {po.paymentTerms && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{po.paymentTerms}d terms</span>}
                {po.incoterms && <span>Incoterms {po.incoterms}</span>}
              </div>
            </div>

            <div className="text-right">
              <p className="text-3xl lg:text-4xl font-bold text-white">{po.currency} {Number(po.total || po.amount || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">PO total</p>
            </div>
          </div>

          {/* Lifecycle actions */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {isDraft && (
              <>
                <button onClick={() => action('submit', {}, 'Submitted for approval')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-rose-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                </button>
                <button onClick={deletePO} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            {isSubmitted && (
              <>
                <button onClick={() => setModal('approve')} className="px-4 py-2.5 rounded-xl bg-white text-rose-700 font-bold flex items-center gap-2 shadow-lg">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => setModal('reject')} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            {isApproved && (
              <button onClick={() => action('send', {}, 'Sent to supplier')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-rose-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to supplier
              </button>
            )}
            {isSent && (
              <button onClick={() => action('acknowledge', {}, 'Acknowledged')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-rose-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />} Mark acknowledged
              </button>
            )}
            {canClose && (
              <button onClick={() => action('close', {}, 'PO closed')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-rose-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />} Close
              </button>
            )}
            {canCancel && (
              <button onClick={() => setModal('cancel')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Ban className="w-4 h-4" /> Cancel
              </button>
            )}
            <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
              <FileDown className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-1 mb-6 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-rose-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <Row label="Type" value={po.type} />
                <Row label="Currency" value={po.currency} />
                <Row label="Payment terms" value={(po.paymentTerms || 0) + ' days'} />
                <Row label="Delivery date" value={po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-GB') : null} />
                <Row label="Delivery location" value={po.deliveryLocation} />
                <Row label="Incoterms" value={po.incoterms} />
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Totals</h3>
              <div className="space-y-3 text-sm">
                <Row label="Subtotal" value={po.currency + ' ' + Number(po.subtotal || 0).toLocaleString()} />
                <Row label="Tax" value={po.currency + ' ' + Number(po.taxAmount || 0).toLocaleString()} />
                <Row label="Total" value={po.currency + ' ' + Number(po.total || po.amount || 0).toLocaleString()} bold />
              </div>
            </div>

            {/* Timeline stamps */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <TimeStamp label="Created" value={po.createdAt} />
                <TimeStamp label="Approved" value={po.approvedAt} />
                <TimeStamp label="Sent" value={po.sentAt} />
                <TimeStamp label="Acknowledged" value={po.acknowledgedAt} />
              </div>
            </div>

            {po.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{po.notes}</p>
              </div>
            )}
            {po.rejectionReason && (
              <div className="bg-red-900/10 dark:bg-red-900/20 rounded-2xl border border-red-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-red-500 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Reason</h3>
                <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{po.rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lines' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-rose-500" /> Line Items</h3>
              {isDraft && (
                <button onClick={() => setModal('add-line')} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add line
                </button>
              )}
            </div>
            {lines.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No lines yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Ordered</th>
                      <th className="px-4 py-3 text-right">Received</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Tax %</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      {isDraft && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l: any) => (
                      <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="px-4 py-3 text-neutral-500">{l.lineNumber || '—'}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{l.description}</p>
                          {l.unitOfMeasure && <p className="text-[10px] text-neutral-500">{l.unitOfMeasure}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">{Number(l.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={Number(l.receivedQty || 0) >= Number(l.quantity) ? 'text-green-600 dark:text-green-400 font-bold' : ''}>
                            {Number(l.receivedQty || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{Number(l.unitPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{Number(l.taxRate || 0)}%</td>
                        <td className="px-4 py-3 text-right font-bold">{Number(l.total).toLocaleString()}</td>
                        {isDraft && (
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeLine(l.id)} className="p-1 rounded text-red-500 hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'approvals' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {approvals.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No approvals yet</p>
            ) : (
              <div>
                {approvals.map((a: any) => (
                  <div key={a.id} className="p-5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {a.stepNumber}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p className="font-bold text-sm">{a.approverRole || 'Approver'}</p>
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                            a.status === 'APPROVED' ? 'bg-green-900/50 text-green-300' :
                            a.status === 'REJECTED' ? 'bg-red-900/50 text-red-300' :
                            a.status === 'PENDING' ? 'bg-amber-900/50 text-amber-300' :
                            'bg-neutral-800 text-neutral-400'
                          )}>{a.status}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {a.decidedAt ? new Date(a.decidedAt).toLocaleString('en-GB') : a.dueAt ? 'Due ' + new Date(a.dueAt).toLocaleString('en-GB') : 'Pending'}
                        </p>
                        {a.comment && <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-2 p-2 rounded bg-neutral-50 dark:bg-neutral-800/50">{a.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {activity.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No activity yet</p>
            ) : (
              <div>
                {activity.map((e: any) => (
                  <div key={e.id} className="p-4 flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(e.actorName || 'U')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{e.summary || e.eventType}</p>
                      <p className="text-xs text-neutral-500">{e.actorName || 'System'} · {new Date(e.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'related' && (
          <div className="space-y-4">
            {requisition && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-500" /> Source Requisition</h3>
                <Link href={'/wavecore-erp/procurement/requisitions/' + requisition.id} className="block p-4 rounded-xl bg-indigo-900/10 dark:bg-indigo-900/20 border border-indigo-800/30 hover:border-indigo-500 transition">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{requisition.requisitionNumber}</p>
                  <p className="font-bold mt-1">{requisition.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">{requisition.currency} {Number(requisition.totalAmount || 0).toLocaleString()} · {requisition.status}</p>
                </Link>
              </div>
            )}

            {supplier && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Supplier</h3>
                <Link href={'/wavecore-erp/procurement/suppliers/' + supplier.id} className="block p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 transition">
                  <p className="font-bold">{supplier.name}</p>
                  {supplier.legalName && <p className="text-xs text-neutral-500 mt-0.5">{supplier.legalName}</p>}
                  <p className="text-xs text-neutral-500 mt-1">
                    {supplier.email || 'No email'} · {supplier.phone || 'No phone'} · {supplier.status}
                  </p>
                </Link>
              </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-center">
              <Truck className="w-10 h-10 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm text-neutral-500">Goods receipts will appear here once Phase 6 is implemented</p>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {modal === 'approve' && (
        <Modal title="Approve PO" onClose={() => { setModal(null); setComment('') }}>
          <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Comment (optional)</label>
          <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setModal(null); setComment('') }} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={async () => { await action('approve', { comment }, 'Approved'); setModal(null); setComment('') }} disabled={working} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
            </button>
          </div>
        </Modal>
      )}

      {modal === 'reject' && (
        <Modal title="Reject PO" onClose={() => { setModal(null); setRejectReason('') }}>
          <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Rejection reason *</label>
          <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setModal(null); setRejectReason('') }} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={async () => { const ok = await action('reject', { reason: rejectReason }, 'Rejected'); if (ok) { setModal(null); setRejectReason('') } }} disabled={working || !rejectReason.trim()} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
            </button>
          </div>
        </Modal>
      )}

      {modal === 'cancel' && (
        <Modal title="Cancel PO" onClose={() => { setModal(null); setCancelReason('') }}>
          <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Cancellation reason (optional)</label>
          <textarea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setModal(null); setCancelReason('') }} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Keep PO</button>
            <button onClick={async () => { const ok = await action('cancel', { reason: cancelReason }, 'Cancelled'); if (ok) { setModal(null); setCancelReason('') } }} disabled={working} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Cancel PO
            </button>
          </div>
        </Modal>
      )}

      {modal === 'add-line' && (
        <Modal title="Add line item" onClose={() => setModal(null)}>
          <div className="mb-3">
            <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Description *</label>
            <input value={newLine.description} onChange={e => setNewLine({ ...newLine, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Qty</label>
              <input type="number" value={newLine.quantity} onChange={e => setNewLine({ ...newLine, quantity: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Unit price</label>
              <input type="number" value={newLine.unitPrice} onChange={e => setNewLine({ ...newLine, unitPrice: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Tax %</label>
              <input type="number" value={newLine.taxRate} onChange={e => setNewLine({ ...newLine, taxRate: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Unit of measure</label>
            <select value={newLine.unitOfMeasure} onChange={e => setNewLine({ ...newLine, unitOfMeasure: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              {['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={addLine} disabled={working} className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-rose-600 dark:text-rose-400' : 'font-medium'}>{value || '—'}</span>
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

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}