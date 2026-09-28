'use client'


import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Wallet, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X, Check,
  XCircle, Send, Ban, FileDown, Layers, Activity, FileText, Receipt,
  Users, Calendar, DollarSign, Trash2, Plus, CheckCheck, Play,
  AlertCircle, Clock, Hash, Building2,
} from 'lucide-react'
import ActivityFeed from '../../_components/ActivityFeed'

type Tab = 'overview' | 'lines' | 'activity'

interface RunHook {
  id: string
  runNumber: string
  paymentDate?: string
  cutoffDate?: string
  currency: string
  totalAmount: number
  invoiceCount: number
  status: string
  method: string
  bankAccountId?: string
  bankFileUrl?: string
  approvedAt?: string
  approvedByName?: string
  executedAt?: string
  failureReason?: string
  notes?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

interface InvoiceLite {
  id: string
  invoiceNumber: string
  supplierName?: string
  currency: string
  total: number
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PENDING_APPROVAL: 'Pending Approval', APPROVED: 'Approved',
  EXECUTING: 'Executing', EXECUTED: 'Executed', FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}
const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque',
  MOBILE_MONEY: 'Mobile Money', MIXED: 'Mixed',
}

export default function PaymentRunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [run, setRun] = useState<RunHook | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const [bankAccount, setBankAccount] = useState<any>(null)

  const [modal, setModal] = useState<null | 'submit' | 'approve' | 'execute' | 'fail' | 'cancel' | 'add-lines'>(null)
  const [reason, setReason] = useState('')
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceLite[]>([])
  const [invQuery, setInvQuery] = useState('')
  const [pickedIds, setPickedIds] = useState<string[]>([])
  const [loadingInv, setLoadingInv] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/payment-runs/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setRun(data.paymentRun)
      setLines(data.lines || [])
      setBankAccount(data.bankAccount)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const lifecycle = async (action: string, extra?: any) => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/payment-runs/' + id + '/lifecycle', {
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

  const loadAvailableInvoices = async () => {
    setModal('add-lines')
    setPickedIds([])
    setInvQuery('')
    setLoadingInv(true)
    try {
      const res = await fetch('/api/wavecore/procurement/supplier-invoices?status=APPROVED&limit=200')
      const data = await res.json()
      if (res.ok) {
        const existing = new Set(lines.map((l: any) => l.supplierInvoiceId))
        setAvailableInvoices((data.supplierInvoices || []).filter((i: InvoiceLite) => !existing.has(i.id)))
      }
    } catch {}
    finally { setLoadingInv(false) }
  }

  const saveAddLines = async () => {
    if (pickedIds.length === 0) { setError('Pick at least one invoice'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/payment-runs/' + id + '/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ supplierInvoiceIds: pickedIds }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(pickedIds.length + ' invoice(s) added')
      setModal(null)
      fetchAll()
    } finally { setWorking(false) }
  }

  const removeLine = async (lineId: string) => {
    if (!confirm('Remove this invoice from the run?')) return
    const res = await fetch('/api/wavecore/procurement/payment-runs/' + id + '/lines/' + lineId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Line removed'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const deleteRun = async () => {
    if (!confirm('Delete this DRAFT run? Cannot be undone.')) return
    const res = await fetch('/api/wavecore/procurement/payment-runs/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) router.push('/wavecore-erp/procurement/payment-runs')
    else { const d = await res.json(); setError(d.error || 'Delete failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-700 text-neutral-200'
      case 'PENDING_APPROVAL': return 'bg-amber-900/50 text-amber-200'
      case 'APPROVED': return 'bg-blue-900/50 text-blue-200'
      case 'EXECUTING': return 'bg-cyan-900/50 text-cyan-200'
      case 'EXECUTED': return 'bg-green-900/50 text-green-200'
      case 'FAILED': return 'bg-red-900/50 text-red-200'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  )
  if (error && !run) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/payment-runs" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )
  if (!run) return null

  const isDraft = run.status === 'DRAFT'
  const isPending = run.status === 'PENDING_APPROVAL'
  const isApproved = run.status === 'APPROVED'
  const isExecuted = run.status === 'EXECUTED'
  const isFailed = run.status === 'FAILED'
  const isCancelled = run.status === 'CANCELLED'
  const canSubmit = isDraft && lines.length > 0
  const canApprove = isPending
  const canExecute = isApproved && lines.length > 0
  const canFail = isApproved
  const canCancel = isDraft || isPending || isApproved
  const canDelete = isDraft || isFailed
  const canDownload = isApproved || isExecuted
  const canEditLines = isDraft

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'lines',    label: 'Lines',    icon: Layers, count: lines.length },
    { key: 'activity', label: 'Activity', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Payment Run</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/payment-runs" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Payment Runs
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {isExecuted && (
          <div className="mb-4 p-4 rounded-xl bg-green-900/20 text-green-200 border border-green-800 flex items-center gap-3">
            <CheckCheck className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Run executed</p>
              <p className="text-xs text-green-300/80">All {run.invoiceCount} invoices marked PAID on {run.executedAt ? new Date(run.executedAt).toLocaleString('en-GB') : '—'}</p>
            </div>
          </div>
        )}
        {isFailed && run.failureReason && (
          <div className="mb-4 p-4 rounded-xl bg-red-900/20 text-red-200 border border-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Execution failed</p>
              <p className="text-xs text-red-300/80">{run.failureReason}</p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-white/90">{run.runNumber}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(run.status)}>{STATUS_LABELS[run.status] || run.status}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">{METHOD_LABELS[run.method] || run.method}</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <Wallet className="w-7 h-7" /> {run.invoiceCount} invoice{run.invoiceCount !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
                {run.paymentDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />pay {new Date(run.paymentDate).toLocaleDateString('en-GB')}</span>}
                {run.cutoffDate && <span>cutoff {new Date(run.cutoffDate).toLocaleDateString('en-GB')}</span>}
                {run.approvedByName && <span className="flex items-center gap-1"><CheckCheck className="w-3 h-3" />approved by {run.approvedByName}</span>}
                {run.executedAt && <span>executed {new Date(run.executedAt).toLocaleDateString('en-GB')}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl lg:text-4xl font-bold text-white">{run.currency} {Number(run.totalAmount || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Total payout</p>
            </div>
          </div>

          {/* Lifecycle actions */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {canSubmit && (
              <button onClick={() => setModal('submit')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                <Send className="w-4 h-4" /> Submit for approval
              </button>
            )}
            {canApprove && (
              <button onClick={() => setModal('approve')} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg">
                <Check className="w-4 h-4" /> Approve
              </button>
            )}
            {canExecute && (
              <button onClick={() => setModal('execute')} className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg">
                <Play className="w-4 h-4" /> Execute
              </button>
            )}
            {canFail && (
              <button onClick={() => setModal('fail')} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Mark Failed
              </button>
            )}
            {canCancel && (
              <button onClick={() => setModal('cancel')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Ban className="w-4 h-4" /> Cancel
              </button>
            )}
            {canDelete && !isApproved && (
              <button onClick={deleteRun} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            {canDownload && (
              <a
                href={'/api/wavecore/procurement/payment-runs/' + id + '/export'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" /> Bank file
              </a>
            )}
            <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
              <FileDown className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-1 mb-6 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-emerald-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Header</h3>
              <div className="space-y-3 text-sm">
                <Row label="Payment date" value={run.paymentDate ? new Date(run.paymentDate).toLocaleDateString('en-GB') : null} />
                <Row label="Cutoff date" value={run.cutoffDate ? new Date(run.cutoffDate).toLocaleDateString('en-GB') : null} />
                <Row label="Method" value={METHOD_LABELS[run.method] || run.method} />
                <Row label="Currency" value={run.currency} />
                <Row label="Invoices" value={String(run.invoiceCount)} />
                <Row label="Total" value={run.currency + ' ' + Number(run.totalAmount || 0).toLocaleString()} bold />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Approval & execution</h3>
              <div className="space-y-3 text-sm">
                <Row label="Approved at" value={run.approvedAt ? new Date(run.approvedAt).toLocaleString('en-GB') : null} />
                <Row label="Approved by" value={run.approvedByName} />
                <Row label="Executed at" value={run.executedAt ? new Date(run.executedAt).toLocaleString('en-GB') : null} />
                <Row label="Created by" value={run.createdByName} />
              </div>
            </div>

            {bankAccount && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-500" /> Bank Account</h3>
                <div className="space-y-2 text-sm">
                  <Row label="Bank" value={bankAccount.bankName} />
                  <Row label="Account name" value={bankAccount.accountName} />
                  <Row label="Account #" value={bankAccount.accountNumber} />
                </div>
              </div>
            )}

            {run.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{run.notes}</p>
              </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <TimeStamp label="Created" value={run.createdAt} />
                <TimeStamp label="Updated" value={run.updatedAt} />
                <TimeStamp label="Approved" value={run.approvedAt} />
                <TimeStamp label="Executed" value={run.executedAt} />
              </div>
            </div>
          </div>
        )}

        {tab === 'lines' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-500" /> Invoices in this run</h3>
              {canEditLines && (
                <button onClick={loadAvailableInvoices} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add invoices
                </button>
              )}
            </div>
            {lines.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No invoices on this run yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Paid at</th>
                      {canEditLines && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l: any, i: number) => (
                      <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">
                          {l.supplierInvoiceId ? (
                            <Link href={'/wavecore-erp/procurement/supplier-invoices/' + l.supplierInvoiceId} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                              {l.invoiceNumber}
                            </Link>
                          ) : (l.invoiceNumber || '—')}
                        </td>
                        <td className="px-4 py-3">{l.supplierName || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold">{Number(l.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                            l.status === 'PAID' ? 'bg-green-900/50 text-green-300' :
                            l.status === 'FAILED' ? 'bg-red-900/50 text-red-300' :
                            'bg-neutral-800 text-neutral-400'
                          )}>{l.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500">
                          {l.paidAt ? new Date(l.paidAt).toLocaleString('en-GB') : '—'}
                        </td>
                        {canEditLines && (
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

        {tab === 'activity' && (
          <ActivityFeed entityId={id} />
        )}
      </main>

      {/* Modals */}
      {modal === 'submit' && (
        <Modal title="Submit for approval" onClose={() => setModal(null)}>
          <p className="text-sm text-neutral-500">This will move the run to <strong>Pending Approval</strong>. Once approved, it can be executed and invoices will be marked PAID.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={async () => { const ok = await lifecycle('SUBMIT'); if (ok) setModal(null) }} disabled={working} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
            </button>
          </div>
        </Modal>
      )}

      {modal === 'approve' && (
        <Modal title="Approve payment run" onClose={() => setModal(null)}>
          <p className="text-sm text-neutral-500 mb-3">You will be recorded as the approver. After approval, the run can be executed.</p>
          <Field label="Comment (optional)">
            <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={async () => { const ok = await lifecycle('APPROVE', { reason }); if (ok) { setModal(null); setReason('') } }} disabled={working} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
            </button>
          </div>
        </Modal>
      )}

      {modal === 'execute' && (
        <Modal title="Execute payment run" onClose={() => setModal(null)}>
          <div className="p-4 rounded-xl bg-amber-900/10 border border-amber-800 mb-4">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4" /> Confirm execution
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This will mark all {run.invoiceCount} invoices as <strong>PAID</strong> and record the payment reference. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={async () => { const ok = await lifecycle('EXECUTE'); if (ok) setModal(null) }} disabled={working} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Execute
            </button>
          </div>
        </Modal>
      )}

      {modal === 'fail' && (
        <Modal title="Mark run as failed" onClose={() => setModal(null)}>
          <Field label="Failure reason *">
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={async () => { const ok = await lifecycle('FAIL', { reason }); if (ok) { setModal(null); setReason('') } }} disabled={working || !reason.trim()} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Mark Failed
            </button>
          </div>
        </Modal>
      )}

      {modal === 'cancel' && (
        <Modal title="Cancel payment run" onClose={() => setModal(null)}>
          <Field label="Reason (optional)">
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Keep</button>
            <button onClick={async () => { const ok = await lifecycle('CANCEL', { reason }); if (ok) { setModal(null); setReason('') } }} disabled={working} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Cancel run
            </button>
          </div>
        </Modal>
      )}

      {modal === 'add-lines' && (
        <Modal title="Add invoices" onClose={() => setModal(null)} width="max-w-3xl">
          <input value={invQuery} onChange={e => setInvQuery(e.target.value)} placeholder="Search invoice number or supplier…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm mb-3" />
          <div className="max-h-[400px] overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            {loadingInv ? <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-emerald-500" /></div>
            : availableInvoices.length === 0 ? <p className="p-6 text-center text-sm text-neutral-500">No approved invoices available</p>
            : availableInvoices
                .filter(i => !invQuery || (i.invoiceNumber || '').toLowerCase().includes(invQuery.toLowerCase()) || (i.supplierName || '').toLowerCase().includes(invQuery.toLowerCase()))
                .map(i => {
                  const picked = pickedIds.includes(i.id)
                  return (
                    <button key={i.id} onClick={() => setPickedIds(prev => picked ? prev.filter(x => x !== i.id) : [...prev, i.id])} className={'w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition ' + (picked ? 'bg-emerald-900/10' : '')}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-xs font-bold text-emerald-500">{i.invoiceNumber}</p>
                          <p className="text-sm font-medium">{i.supplierName || 'Unknown supplier'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{i.currency} {Number(i.total || 0).toLocaleString()}</p>
                          {picked && <p className="text-[10px] text-emerald-500 mt-1 font-bold">✓ selected</p>}
                        </div>
                      </div>
                    </button>
                  )
                })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={saveAddLines} disabled={working || pickedIds.length === 0} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add {pickedIds.length}
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
      <span className={bold ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}>{value || '—'}</span>
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

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, children, onClose, width = 'max-w-lg' }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={'w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl ' + width}>
        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
