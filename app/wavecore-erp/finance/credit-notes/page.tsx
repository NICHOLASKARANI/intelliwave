'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, CheckCircle2, AlertTriangle, FileMinus, X } from 'lucide-react'

interface CreditNote {
  id: string
  creditNoteNumber: string
  invoiceId?: string | null
  supplierInvoiceId?: string | null
  customerName?: string | null
  supplierName?: string | null
  date: string
  reason?: string | null
  subtotal: number | null
  taxAmount: number | null
  total: number | null
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPLIED' | 'REJECTED'
  requiresApproval: boolean | null
  approvalId: string | null
  approvedAt: string | null
  appliedAt: string | null
  createdAt: string
}

export default function CreditNotesPage() {
  const [tab, setTab] = useState<'customer' | 'supplier'>('customer')
  const [notes, setNotes] = useState<CreditNote[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    customerName: '', supplierName: '', reason: '',
    subtotal: '', taxAmount: '', date: new Date().toISOString().split('T')[0],
  })

  const csrf = () => (document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || '')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/wavecore/finance/credit-notes/' + tab, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setNotes(data.creditNotes || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [tab])

  const create = async () => {
    setBusy('create'); setError(''); setSuccess('')
    try {
      const subtotal = Number(form.subtotal) || 0
      const taxAmount = Number(form.taxAmount) || 0
      const total = subtotal + taxAmount

      if (total <= 0) { setError('Total must be positive'); setBusy(null); return }

      const body: any = {
        date: form.date, reason: form.reason || null,
        subtotal, taxAmount, total,
      }
      if (tab === 'customer') body.customerName = form.customerName || null
      else body.supplierName = form.supplierName || null

      const res = await fetch('/api/wavecore/finance/credit-notes/' + tab, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }

      setSuccess('Credit note ' + (data.creditNote?.creditNoteNumber || '') + ' created' + (data.requiresApproval ? ' (awaiting approval)' : ''))
      setShowCreate(false)
      setForm({ customerName: '', supplierName: '', reason: '', subtotal: '', taxAmount: '', date: new Date().toISOString().split('T')[0] })
      load()
    } catch (e: any) { setError(e.message || 'Network error') }
    finally { setBusy(null) }
  }

  const approve = async (n: CreditNote) => {
    if (!confirm('Approve credit note ' + n.creditNoteNumber + '? This will post to the General Ledger.')) return
    setBusy(n.id); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/wavecore/finance/credit-notes/' + tab + '/' + n.id + '/approve', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf() },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Approve failed'); return }
      setSuccess('Approved ' + n.creditNoteNumber)
      load()
    } catch { setError('Network error') }
    finally { setBusy(null) }
  }

  const fmt = (n: number | null) => n == null ? '—' : 'KSh ' + Number(n).toLocaleString()

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
      PENDING_APPROVAL: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
      APPLIED: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
      REJECTED: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
    }
    return map[s] || map.DRAFT
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Finance
          </Link>
          <h1 className="font-bold">Credit Notes</h1>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <FileMinus className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold">Credit Notes</h2>
        </div>

        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-300 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

        <div className="flex gap-2 mb-6">
          {(['customer', 'supplier'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={'px-4 py-2.5 rounded-xl text-sm font-bold ' + (tab === t ? 'bg-orange-600 text-white' : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500')}>
              {t === 'customer' ? 'Customer (AR)' : 'Supplier (AP)'}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>
          ) : notes.length === 0 ? (
            <div className="p-12 text-center text-sm text-neutral-500">
              No {tab} credit notes yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="text-left px-4 py-3">Number</th>
                    <th className="text-left px-4 py-3">{tab === 'customer' ? 'Customer' : 'Supplier'}</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map(n => (
                    <tr key={n.id} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-mono text-xs">{n.creditNoteNumber}</td>
                      <td className="px-4 py-3">{n.customerName || n.supplierName || '—'}</td>
                      <td className="px-4 py-3 text-xs">{new Date(n.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right font-bold">{fmt(n.total)}</td>
                      <td className="px-4 py-3"><span className={'px-2 py-0.5 rounded text-xs font-bold ' + statusBadge(n.status)}>{n.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        {(n.status === 'DRAFT' || n.status === 'PENDING_APPROVAL') ? (
                          <button onClick={() => approve(n)} disabled={busy === n.id}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold disabled:opacity-40">
                            {busy === n.id ? 'Approving...' : 'Approve'}
                          </button>
                        ) : n.status === 'APPLIED' ? (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Applied {n.appliedAt ? new Date(n.appliedAt).toLocaleDateString() : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">—</span>
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

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">New {tab} credit note</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">{tab === 'customer' ? 'Customer name' : 'Supplier name'}</label>
                <input value={tab === 'customer' ? form.customerName : form.supplierName}
                  onChange={e => setForm({ ...form, [tab === 'customer' ? 'customerName' : 'supplierName']: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Reason</label>
                <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g., Goods returned"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Subtotal</label>
                  <input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} min="0" step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">VAT</label>
                  <input type="number" value={form.taxAmount} onChange={e => setForm({ ...form, taxAmount: e.target.value })} min="0" step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm" />
                </div>
              </div>
              <div className="pt-2 text-sm text-neutral-500">
                Total: <span className="font-bold text-neutral-900 dark:text-white">
                  KSh {((Number(form.subtotal) || 0) + (Number(form.taxAmount) || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-100 dark:bg-neutral-800">Cancel</button>
              <button onClick={create} disabled={busy === 'create'}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40">
                {busy === 'create' ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}