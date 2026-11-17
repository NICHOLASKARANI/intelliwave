'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, Check, X } from 'lucide-react'

interface Approval {
  id: string
  documentType: string
  documentId: string
  documentNumber: string | null
  amount: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedByName: string | null
  decidedByName: string | null
  decidedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [counts, setCounts] = useState<{ PENDING: number; APPROVED: number; REJECTED: number }>({ PENDING: 0, APPROVED: 0, REJECTED: 0 })
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rejectModal, setRejectModal] = useState<Approval | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')

  const load = async (status: typeof tab) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/approvals/inbox?status=' + status, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setApprovals(data.approvals || [])
      setCounts(data.counts || { PENDING: 0, APPROVED: 0, REJECTED: 0 })
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(tab) /* eslint-disable-next-line */ }, [tab])

  const approve = async (a: Approval) => {
    if (!confirm('Approve ' + (a.documentNumber || a.id) + '?')) return
    setBusy(a.id); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/wavecore/finance/approvals/' + a.id + '/approve', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Approve failed'); return }
      setSuccess('Approved ' + (a.documentNumber || a.id))
      load(tab)
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const reject = async () => {
    if (!rejectModal) return
    const a = rejectModal
    setBusy(a.id); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/wavecore/finance/approvals/' + a.id + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Reject failed'); return }
      setSuccess('Rejected ' + (a.documentNumber || a.id))
      setRejectModal(null)
      setRejectReason('')
      load(tab)
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const fmt = (n: number | null) => n == null ? '—' : 'KSh ' + Number(n).toLocaleString()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Finance
          </Link>
          <h1 className="font-bold">Approval Inbox</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold">Pending Approvals</h2>
          {counts.PENDING > 0 && (
            <span className="ml-2 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
              {counts.PENDING}
            </span>
          )}
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-300 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="flex gap-2 mb-6">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={'px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ' + (tab === t ? 'bg-amber-600 text-white' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500')}>
              {t === 'PENDING' && <Clock className="w-4 h-4" />}
              {t === 'APPROVED' && <CheckCircle2 className="w-4 h-4" />}
              {t === 'REJECTED' && <XCircle className="w-4 h-4" />}
              {t} <span className="ml-1 text-xs">({counts[t] || 0})</span>
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" /></div>
          ) : approvals.length === 0 ? (
            <div className="p-12 text-center text-sm text-neutral-500">
              No {tab.toLowerCase()} approvals.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Document</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Requested By</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map(a => (
                    <tr key={a.id} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {a.documentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{a.documentNumber || a.documentId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-right font-bold">{fmt(a.amount)}</td>
                      <td className="px-4 py-3 text-neutral-500">{a.requestedByName || '—'}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(a.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        {a.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => approve(a)} disabled={busy === a.id}
                              className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40">
                              {busy === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                            </button>
                            <button onClick={() => { setRejectModal(a); setRejectReason('') }} disabled={busy === a.id}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40">
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : a.status === 'APPROVED' ? (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Approved by {a.decidedByName || '—'} {a.decidedAt ? '· ' + new Date(a.decidedAt).toLocaleDateString() : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 dark:text-red-400" title={a.rejectionReason || ''}>
                            Rejected by {a.decidedByName || '—'} {a.decidedAt ? '· ' + new Date(a.decidedAt).toLocaleDateString() : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-2">Reject {rejectModal.documentNumber || rejectModal.id.slice(0, 8)}</h3>
            <p className="text-sm text-neutral-500 mb-4">Please provide a reason for rejection.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" rows={3} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800">Cancel</button>
              <button onClick={reject} disabled={busy === rejectModal.id}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-40">
                {busy === rejectModal.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}