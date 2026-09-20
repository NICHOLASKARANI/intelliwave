'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Wallet as WalletIcon, Loader2, DollarSign, TrendingUp, Lock, RefreshCw,
  ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, X, Send, AlertTriangle,
  Banknote, TrendingDown, Receipt,
} from 'lucide-react'

const TYPE_LABELS: Record<string, { label: string; color: string; sign: number }> = {
  SALE_PENDING: { label: 'Sale (pending)', color: 'text-yellow-400', sign: 1 },
  SALE_SETTLED: { label: 'Sale (settled)', color: 'text-green-400', sign: 1 },
  PAYOUT_REQUEST: { label: 'Payout', color: 'text-red-400', sign: -1 },
  PAYOUT_COMPLETED: { label: 'Payout done', color: 'text-red-400', sign: -1 },
  REFUND: { label: 'Refund', color: 'text-orange-400', sign: -1 },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-blue-400', sign: 1 },
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [summary, setSummary] = useState<any>({})
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPayout, setShowPayout] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ amount: '' })
  const [requesting, setRequesting] = useState(false)
  const [filterType, setFilterType] = useState<'ALL' | 'SALE' | 'PAYOUT'>('ALL')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/wallet')
      const data = await res.json()
      setWallet(data.wallet)
      setSummary(data.summary || {})
      setTransactions(data.transactions || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const requestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const amount = Number(payoutForm.amount)
    if (amount <= 0) { setError('Invalid amount'); return }
    if (amount > Number(summary.availableBalance || 0)) { setError('Insufficient available balance'); return }
    setRequesting(true)
    try {
      const res = await fetch('/api/marketplace/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(data.message || 'Payout request submitted')
      setShowPayout(false)
      setPayoutForm({ amount: '' })
      fetchAll()
    } finally { setRequesting(false) }
  }

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (filterType === 'SALE') list = list.filter(t => t.type.startsWith('SALE'))
    if (filterType === 'PAYOUT') list = list.filter(t => t.type.startsWith('PAYOUT'))
    return list
  }, [transactions, filterType])

  const available = Number(summary.availableBalance || 0)
  const pending = Number(summary.pendingBalance || 0)
  const reserve = Number(summary.reserveBalance || 0)
  const lifetime = Number(summary.lifetimeEarnings || 0)
  const today = Number(summary.todaySales || 0)
  const month = Number(summary.monthSales || 0)

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace/seller" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">Seller · Wallet</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/wavecore-erp/marketplace/seller" className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold">
              Dashboard
            </Link>
            <Link href="/wavecore-erp/marketplace/seller/commission" className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold">
              Earnings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <WalletIcon className="w-7 h-7 text-emerald-400" /> Wallet
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Balance · Transactions · Payouts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button
              onClick={() => { setShowPayout(true); setPayoutForm({ amount: String(available) }) }}
              disabled={available <= 0}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Banknote className="w-5 h-5" /> Request Payout
            </button>
          </div>
        </div>

        {error && <div className="p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Balance cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
            <WalletIcon className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {available.toLocaleString()}</p>
            <p className="text-xs opacity-90">Available for Payout</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg">
            <Clock className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {pending.toLocaleString()}</p>
            <p className="text-xs opacity-90">Pending (not yet delivered)</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
            <Lock className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {reserve.toLocaleString()}</p>
            <p className="text-xs opacity-90">Reserve (refund holdback)</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
            <TrendingUp className="w-6 h-6 mb-2" />
            <p className="text-3xl font-bold">KES {lifetime.toLocaleString()}</p>
            <p className="text-xs opacity-90">Lifetime Earnings</p>
          </div>
        </div>

        {/* Today / Month */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-1">Today's Sales</p>
            <p className="text-2xl font-bold text-emerald-400">KES {today.toLocaleString()}</p>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-1">This Month</p>
            <p className="text-2xl font-bold text-cyan-400">KES {month.toLocaleString()}</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="p-5 border-b border-neutral-800 flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" /> Transactions ({filtered.length})
            </h3>
            <div className="flex gap-1 bg-neutral-800 rounded-xl p-1">
              {(['ALL', 'SALE', 'PAYOUT'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold transition ' + (filterType === f ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white')}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-500" />
              <p className="text-sm text-neutral-500">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filtered.map(tx => {
                const meta = TYPE_LABELS[tx.type] || { label: tx.type, color: 'text-white', sign: 1 }
                const isNegative = Number(tx.amount) < 0
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + (isNegative ? 'bg-red-900/40' : 'bg-green-900/40')}>
                        {isNegative ? <ArrowUpRight className="w-5 h-5 text-red-400" /> : <ArrowDownLeft className="w-5 h-5 text-green-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={'text-sm font-bold ' + meta.color}>{meta.label}</p>
                        <p className="text-xs text-neutral-500 truncate">{tx.description || '—'}</p>
                        <p className="text-[10px] text-neutral-600">{new Date(tx.createdAt).toLocaleString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={'font-bold ' + (isNegative ? 'text-red-400' : 'text-green-400')}>
                        {isNegative ? '' : '+'}KES {Math.abs(Number(tx.amount)).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-neutral-500">Balance: KES {Number(tx.balance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* PAYOUT MODAL */}
      {showPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowPayout(false)}>
          <form onSubmit={requestPayout} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" /> Request Payout
              </h2>
              <button type="button" onClick={() => setShowPayout(false)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-900/20 border border-emerald-800/50 text-sm text-emerald-200">
                Available: <b>KES {available.toLocaleString()}</b>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Amount to Withdraw</label>
                <input
                  type="number"
                  min="1"
                  max={available}
                  step="1"
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm({ amount: e.target.value })}
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-lg font-bold"
                />
              </div>
              <div className="p-3 rounded-xl bg-blue-900/20 border border-blue-800/50 text-xs text-blue-200">
                <p><b>Payout process:</b> Funds will be sent to your registered M-Pesa / bank account within 3-5 business days.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => setShowPayout(false)} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" disabled={requesting} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Payout Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}