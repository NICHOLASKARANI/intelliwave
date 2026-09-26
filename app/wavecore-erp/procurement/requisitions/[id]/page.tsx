'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ClipboardList, ArrowLeft, Loader2, AlertTriangle, CheckCircle2,
  Send, Trash2, FileDown, Check, XCircle, UserCog,
  Clock, CheckCheck, User, Calendar, Package, DollarSign,
  FileText, Activity, History, AlertCircle, X, Plus, Save,
} from 'lucide-react'

type Tab = 'overview' | 'lines' | 'approvals' | 'activity' | 'attachments'

export default function RequisitionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [req, setReq] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])

  // Modals
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [delegateModal, setDelegateModal] = useState(false)
  const [addLineModal, setAddLineModal] = useState(false)

  const [comment, setComment] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [delegateTo, setDelegateTo] = useState('')
  const [delegateNote, setDelegateNote] = useState('')
  const [newLine, setNewLine] = useState<any>({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' })
  const [working, setWorking] = useState(false)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setReq(data.requisition)
      setLines(data.lines || [])
      setApprovals(data.approvals || [])
      setActivity(data.activity || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const submitReq = async () => {
    if (!confirm('Submit this requisition for approval?')) return
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions/' + id + '/submit', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submit failed'); return }
      flash(data.status === 'APPROVED' ? 'Auto-approved (no rules matched)' : 'Submitted for approval')
      fetchAll()
    } finally { setWorking(false) }
  }

  const approve = async () => {
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions/' + id + '/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ comment }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Approve failed'); return }
      flash(data.message || 'Approved')
      setApproveModal(false)
      setComment('')
      fetchAll()
    } finally { setWorking(false) }
  }

  const reject = async () => {
    if (!rejectReason.trim()) { setError('Rejection reason required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions/' + id + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Reject failed'); return }
      flash('Rejected')
      setRejectModal(false)
      setRejectReason('')
      fetchAll()
    } finally { setWorking(false) }
  }

  const delegate = async () => {
    if (!delegateTo.trim()) { setError('User ID required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions/' + id + '/delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ delegateToUserId: delegateTo, comment: delegateNote }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Delegate failed'); return }
      flash('Delegated')
      setDelegateModal(false)
      setDelegateTo('')
      setDelegateNote('')
      fetchAll()
    } finally { setWorking(false) }
  }

  const deleteReq = async () => {
    if (!confirm('Delete this draft requisition? Cannot be undone.')) return
    const res = await fetch('/api/wavecore/procurement/requisitions/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) router.push('/wavecore-erp/procurement/requisitions')
    else { const d = await res.json(); setError(d.error || 'Delete failed') }
  }

  const addLine = async () => {
    if (!newLine.description.trim()) { setError('Description required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions/' + id + '/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(newLine),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Line added')
      setAddLineModal(false)
      setNewLine({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' })
      fetchAll()
    } finally { setWorking(false) }
  }

  const removeLine = async (lineId: string) => {
    if (!confirm('Remove this line?')) return
    const res = await fetch('/api/wavecore/procurement/requisitions/' + id + '/lines/' + lineId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Line removed'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-700 text-neutral-200'
      case 'SUBMITTED': return 'bg-amber-900/50 text-amber-200'
      case 'APPROVED': return 'bg-green-900/50 text-green-200'
      case 'REJECTED': return 'bg-red-900/50 text-red-200'
      case 'CONVERTED': return 'bg-indigo-900/50 text-indigo-200'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-400'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const stepColor = (s: string) => {
    switch (s) {
      case 'APPROVED': return 'bg-green-900/50 text-green-300'
      case 'REJECTED': return 'bg-red-900/50 text-red-300'
      case 'PENDING': return 'bg-amber-900/50 text-amber-300'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  )

  if (error && !req) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/requisitions" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )

  if (!req) return null

  const isDraft = req.status === 'DRAFT'
  const isSubmitted = req.status === 'SUBMITTED'
  const currentStep = approvals.find((a: any) => a.status === 'PENDING')

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview',   label: 'Overview',   icon: FileText },
    { key: 'lines',      label: 'Lines',      icon: Package, count: lines.length },
    { key: 'approvals',  label: 'Approvals',  icon: CheckCheck, count: approvals.length },
    { key: 'activity',   label: 'Activity',   icon: Activity, count: activity.length },
    { key: 'attachments',label: 'Attachments',icon: ClipboardList },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Requisition</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/requisitions" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Requisitions
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-white/90">{req.requisitionNumber}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(req.status)}>{req.status}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">{req.priority}</span>
                {req.isEmergency && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">EMERGENCY</span>}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{req.title}</h1>
              {req.description && <p className="text-white/80 text-sm mb-3 max-w-2xl">{req.description}</p>}
              <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.requestedByName || 'Unknown'}</span>
                {req.neededBy && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />needed by {new Date(req.neededBy).toLocaleDateString('en-GB')}</span>}
                <span>{req.category}</span>
                <span>{req.type}</span>
                <span>Created {new Date(req.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-3xl lg:text-4xl font-bold text-white">{req.currency} {Number(req.totalAmount || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Total amount</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {isDraft && (
              <>
                <button onClick={submitReq} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit for approval
                </button>
                <button onClick={deleteReq} className="px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            {isSubmitted && currentStep && (
              <>
                <button onClick={() => setApproveModal(true)} className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => setRejectModal(true)} className="px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => setDelegateModal(true)} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                  <UserCog className="w-4 h-4" /> Delegate
                </button>
              </>
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
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-emerald-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
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
                <Row label="Category" value={req.category} />
                <Row label="Priority" value={req.priority} />
                <Row label="Type" value={req.type} />
                <Row label="Currency" value={req.currency} />
                <Row label="Cost Center" value={req.costCenter} />
                <Row label="Location" value={req.location} />
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Totals</h3>
              <div className="space-y-3 text-sm">
                <Row label="Subtotal" value={req.currency + ' ' + Number(req.subtotal || 0).toLocaleString()} />
                <Row label="Tax" value={req.currency + ' ' + Number(req.taxAmount || 0).toLocaleString()} />
                <Row label="Total" value={req.currency + ' ' + Number(req.totalAmount || 0).toLocaleString()} bold />
              </div>
            </div>
            {req.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{req.notes}</p>
              </div>
            )}
            {req.rejectionReason && (
              <div className="bg-red-900/10 dark:bg-red-900/20 rounded-2xl border border-red-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-red-500 font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Rejection reason</h3>
                <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{req.rejectionReason}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lines' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Package className="w-4 h-4 text-emerald-500" /> Line Items</h3>
              {isDraft && (
                <button onClick={() => setAddLineModal(true)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Line
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
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3">UoM</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Tax %</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                      {isDraft && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l: any) => (
                      <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="px-4 py-3 text-neutral-500">{l.lineNumber}</td>
                        <td className="px-4 py-3">{l.description}</td>
                        <td className="px-4 py-3 text-right">{l.quantity}</td>
                        <td className="px-4 py-3 text-neutral-500">{l.unitOfMeasure}</td>
                        <td className="px-4 py-3 text-right">{Number(l.unitPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{l.taxRate}%</td>
                        <td className="px-4 py-3 text-right font-bold">{Number(l.lineTotal).toLocaleString()}</td>
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
              <p className="text-center text-sm text-neutral-500 py-12">Not yet submitted for approval</p>
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
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + stepColor(a.status)}>{a.status}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {a.decidedAt ? new Date(a.decidedAt).toLocaleString('en-GB') : a.dueAt ? 'Due ' + new Date(a.dueAt).toLocaleString('en-GB') : 'Pending'}
                        </p>
                        {a.comment && <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-2 p-2 rounded bg-neutral-50 dark:bg-neutral-800/50">{a.comment}</p>}
                        {a.delegatedTo && <p className="text-[10px] text-indigo-500 mt-1">Delegated</p>}
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
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold">
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

        {tab === 'attachments' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-neutral-500 text-sm">Attachment uploads will come in a future phase</p>
          </div>
        )}
      </main>

      {/* Approve modal */}
      {approveModal && (
        <Modal title="Approve requisition" onClose={() => setApproveModal(false)}>
          <Field label="Comment (optional)">
            <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setApproveModal(false)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={approve} disabled={working} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
            </button>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <Modal title="Reject requisition" onClose={() => setRejectModal(false)}>
          <Field label="Rejection reason *">
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setRejectModal(false)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={reject} disabled={working} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
            </button>
          </div>
        </Modal>
      )}

      {/* Delegate modal */}
      {delegateModal && (
        <Modal title="Delegate approval" onClose={() => setDelegateModal(false)}>
          <Field label="Delegate to (User ID) *">
            <input value={delegateTo} onChange={e => setDelegateTo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          </Field>
          <Field label="Note (optional)">
            <textarea rows={2} value={delegateNote} onChange={e => setDelegateNote(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setDelegateModal(false)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={delegate} disabled={working} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />} Delegate
            </button>
          </div>
        </Modal>
      )}

      {/* Add line modal */}
      {addLineModal && (
        <Modal title="Add line item" onClose={() => setAddLineModal(false)}>
          <Field label="Description *">
            <input value={newLine.description} onChange={e => setNewLine({ ...newLine, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qty">
              <input type="number" value={newLine.quantity} onChange={e => setNewLine({ ...newLine, quantity: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
            </Field>
            <Field label="Unit price">
              <input type="number" value={newLine.unitPrice} onChange={e => setNewLine({ ...newLine, unitPrice: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
            </Field>
            <Field label="Tax %">
              <input type="number" value={newLine.taxRate} onChange={e => setNewLine({ ...newLine, taxRate: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
            </Field>
          </div>
          <Field label="Unit of measure">
            <select value={newLine.unitOfMeasure} onChange={e => setNewLine({ ...newLine, unitOfMeasure: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              {['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setAddLineModal(false)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={addLine} disabled={working} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
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
      <span className={bold ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}>{value || '—'}</span>
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div className="mb-3">
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      {children}
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
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}