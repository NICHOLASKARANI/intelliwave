'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'

type Payment = {
  id: string
  planId: string
  amount: number
  currency: string
  txnReference: string
  execId: string | null
  email: string | null
  payerName: string | null
  bankName: string | null
  status: string
  createdAt: string
}

export default function BankPaymentsAdmin() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [msg, setMsg] = useState('')

  const load = async (pwd: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/bank-payments?status=' + filter, {
        headers: { 'x-admin-password': pwd },
      })
      if (res.status === 401) {
        setAuthed(false)
        setMsg('Invalid password')
        setLoading(false)
        return
      }
      const data = await res.json()
      setPayments(data.payments || [])
      setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 })
      setAuthed(true)
      setMsg('')
    } catch {
      setMsg('Network error')
    }
    setLoading(false)
  }

  const approve = async (id: string) => {
    const res = await fetch('/api/admin/bank-payments/' + id + '/approve', {
      method: 'POST',
      headers: { 'x-admin-password': password },
    })
    if (res.ok) load(password)
  }

  const reject = async (id: string) => {
    const note = prompt('Rejection reason:') || 'Could not verify'
    const res = await fetch('/api/admin/bank-payments/' + id + '/reject', {
      method: 'POST',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    if (res.ok) load(password)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full">
          <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white text-center mb-2">CEO Access Only</h1>
          <p className="text-sm text-slate-400 text-center mb-6">Enter admin password to view pending bank payments</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(password)}
            placeholder="Admin password"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white mb-4"
          />
          <button
            onClick={() => load(password)}
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Access Dashboard'}
          </button>
          {msg && <p className="text-sm text-red-400 text-center mt-4">{msg}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Bank Payments Dashboard</h1>
            <p className="text-slate-400 text-sm">Verify transaction references against your bank statement, then approve or reject.</p>
          </div>
          <button
            onClick={() => load(password)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl"
          >
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <p className="text-xs text-amber-300 uppercase">Pending</p>
            <p className="text-3xl font-bold text-amber-400">{counts.pending}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <p className="text-xs text-green-300 uppercase">Approved</p>
            <p className="text-3xl font-bold text-green-400">{counts.approved}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <p className="text-xs text-red-300 uppercase">Rejected</p>
            <p className="text-3xl font-bold text-red-400">{counts.rejected}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setTimeout(() => load(password), 50) }}
              className={'px-4 py-2 rounded-xl font-medium ' + (filter === s ? 'bg-white text-slate-900' : 'bg-white/10 text-white')}
            >
              {s}
            </button>
          ))}
        </div>

        {payments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            No {filter.toLowerCase()} payments
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold">{p.currency} {p.amount.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">Plan: {p.planId}</p>
                  </div>
                  <span className={'text-xs px-3 py-1 rounded-full font-bold ' + (p.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : p.status === 'APPROVED' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')}>
                    {p.status}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-2 text-sm mb-4">
                  <div><span className="text-slate-500">Txn Ref:</span> <span className="font-mono text-white">{p.txnReference}</span></div>
                  <div><span className="text-slate-500">Submitted:</span> {new Date(p.createdAt).toLocaleString()}</div>
                  {p.email && <div><span className="text-slate-500">Email:</span> {p.email}</div>}
                  {p.payerName && <div><span className="text-slate-500">Payer:</span> {p.payerName}</div>}
                  {p.bankName && <div><span className="text-slate-500">Bank:</span> {p.bankName}</div>}
                  {p.execId && <div><span className="text-slate-500">Referred by:</span> {p.execId}</div>}
                </div>
                {p.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Approve
                    </button>
                    <button
                      onClick={() => reject(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold"
                    >
                      <XCircle className="w-5 h-5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}