'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Inbox, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X, Check,
  XCircle, Clock, AlertCircle, History, TrendingUp, User, Calendar,
  Package, ChevronRight, RefreshCw,
} from 'lucide-react'

type Tab = 'inbox' | 'history'

export default function ApprovalInboxPage() {
  const [tab, setTab] = useState<Tab>('inbox')
  const [inbox, setInbox] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [counts, setCounts] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [working, setWorking] = useState(false)
  const [rejectModal, setRejectModal] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [inboxRes, historyRes, countsRes] = await Promise.all([
        fetch('/api/wavecore/procurement/approvals/inbox?limit=50'),
        fetch('/api/wavecore/procurement/approvals/history?limit=30'),
        fetch('/api/wavecore/procurement/approvals/counts'),
      ])
      const inboxData = await inboxRes.json()
      const historyData = await historyRes.json()
      const countsData = await countsRes.json()
      setInbox(inboxData.inbox || [])
      setHistory(historyData.history || [])
      setCounts(countsData || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const approve = async (approvalId: string) => {
    setWorking(true)
    try {
      const item = inbox.find(a => a.approvalId === approvalId)
      if (!item) return
      const res = await fetch('/api/wavecore/procurement/requisitions/' + item.requisitionId + '/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(data.message || 'Approved')
      fetchAll()
    } finally { setWorking(false) }
  }

  const reject = async () => {
    if (!rejectModal || !rejectReason.trim()) { setError('Reason required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/requisitions/' + rejectModal.requisitionId + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Rejected')
      setRejectModal(null)
      setRejectReason('')
      fetchAll()
    } finally { setWorking(false) }
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'bg-red-900/50 text-red-300'
      case 'HIGH': return 'bg-orange-900/50 text-orange-300'
      case 'LOW': return 'bg-neutral-800 text-neutral-400'
      default: return 'bg-blue-900/50 text-blue-300'
    }
  }

  const dueLabel = (dueAt?: string) => {
    if (!dueAt) return null
    const ms = new Date(dueAt).getTime() - Date.now()
    const hours = Math.round(ms / (1000 * 60 * 60))
    if (hours < 0) return { text: Math.abs(hours) + 'h overdue', cls: 'text-red-500' }
    if (hours < 24) return { text: 'due in ' + hours + 'h', cls: 'text-amber-500' }
    const days = Math.round(hours / 24)
    return { text: 'due in ' + days + 'd', cls: 'text-neutral-500' }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Approvals</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/requisitions" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Requisitions
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <Inbox className="w-8 h-8" /> Approval Inbox
              </h1>
              <p className="text-white/80 text-sm">Approve or reject requisitions assigned to you</p>
            </div>
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Kpi icon={Clock} label="Pending" value={counts.pending || 0} color="text-amber-500" />
          <Kpi icon={AlertCircle} label="Overdue" value={counts.overdue || 0} color="text-red-500" />
          <Kpi icon={CheckCircle2} label="Approved today" value={counts.approvedToday || 0} color="text-green-500" />
          <Kpi icon={XCircle} label="Rejected today" value={counts.rejectedToday || 0} color="text-rose-500" />
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-1 mb-6 border border-neutral-200 dark:border-neutral-800">
          <button onClick={() => setTab('inbox')} className={'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ' + (tab === 'inbox' ? 'bg-amber-600 text-white' : 'text-neutral-500')}>
            <Inbox className="w-3.5 h-3.5" /> Inbox {inbox.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{inbox.length}</span>}
          </button>
          <button onClick={() => setTab('history')} className={'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ' + (tab === 'history' ? 'bg-amber-600 text-white' : 'text-neutral-500')}>
            <History className="w-3.5 h-3.5" /> My History {history.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{history.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500" /></div>
        ) : tab === 'inbox' ? (
          inbox.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-neutral-500">All caught up — no pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inbox.map((item: any) => {
                const due = dueLabel(item.dueAt)
                return (
                  <div key={item.approvalId} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-[280px]">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link href={'/wavecore-erp/procurement/requisitions/' + item.requisitionId} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                            {item.requisitionNumber}
                          </Link>
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + priorityColor(item.priority)}>{item.priority}</span>
                          {item.isEmergency && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/50 text-red-300">EMERGENCY</span>}
                          <span className="text-[10px] text-neutral-500">step {item.stepNumber} of {item.totalApprovalSteps}</span>
                        </div>
                        <Link href={'/wavecore-erp/procurement/requisitions/' + item.requisitionId} className="font-bold text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400">
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-500 flex-wrap">
                          {item.requestedByName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.requestedByName}</span>}
                          {item.neededBy && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />by {new Date(item.neededBy).toLocaleDateString('en-GB')}</span>}
                          {due && <span className={'font-bold ' + due.cls}>{due.text}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-neutral-900 dark:text-white">
                          {item.currency} {Number(item.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0 ml-auto">
                        <button onClick={() => approve(item.approvalId)} disabled={working} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => { setRejectModal(item); setRejectReason('') }} disabled={working} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <History className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
              <p className="text-neutral-500">No decisions yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {history.map((h: any) => (
                <Link key={h.id} href={'/wavecore-erp/procurement/requisitions/' + h.requisitionId} className="block p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{h.requisitionNumber}</span>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (h.status === 'APPROVED' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300')}>
                          {h.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{h.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Step {h.stepNumber} · {new Date(h.decidedAt).toLocaleString('en-GB')}
                        {h.requestedByName && <> · requested by {h.requestedByName}</>}
                      </p>
                      {h.comment && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 italic">&quot;{h.comment}&quot;</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">{h.currency} {Number(h.totalAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </main>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setRejectModal(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h2 className="text-lg font-bold">Reject requisition</h2>
                <p className="text-xs text-neutral-500">{rejectModal.requisitionNumber} · {rejectModal.title}</p>
              </div>
              <button onClick={() => setRejectModal(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Rejection reason *</label>
              <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => setRejectModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
              <button onClick={reject} disabled={working || !rejectReason.trim()} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      <Icon className={'w-5 h-5 mb-2 ' + color} />
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{label}</p>
    </div>
  )
}