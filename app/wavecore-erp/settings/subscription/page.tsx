'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CreditCard, CheckCircle2, AlertTriangle, Clock, DollarSign,
  RefreshCw, Loader2, XCircle, Receipt, Calendar, TrendingUp,
  Zap, Shield, Crown, ArrowUpRight, Smartphone, Info,
} from 'lucide-react'

export default function SubscriptionPage() {
  const [history, setHistory] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/settings/subscription/history')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setHistory(data.history || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const statusColor = (s: string, expired: boolean) => {
    if (expired) return { bg: 'from-neutral-600 to-neutral-800', text: 'text-neutral-300', label: 'Expired' }
    if (s === 'ACTIVE') return { bg: 'from-green-600 to-emerald-800', text: 'text-green-300', label: 'Active' }
    if (s === 'TRIAL') return { bg: 'from-blue-600 to-indigo-800', text: 'text-blue-300', label: 'Trial' }
    return { bg: 'from-neutral-600 to-neutral-800', text: 'text-neutral-300', label: s }
  }

  const daysRemaining = Number(summary.daysRemaining || 0)
  const urgency =
    daysRemaining <= 0 ? 'expired' :
    daysRemaining <= 3 ? 'critical' :
    daysRemaining <= 7 ? 'warning' :
    'healthy'

  const urgencyStyles = {
    expired: { bg: 'from-red-900/40 to-rose-900/40', border: 'border-red-700', text: 'text-red-300', icon: XCircle, msg: 'Subscription expired — renew now to restore access' },
    critical: { bg: 'from-red-900/30 to-orange-900/30', border: 'border-red-600', text: 'text-red-300', icon: AlertTriangle, msg: `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left — renew immediately` },
    warning: { bg: 'from-yellow-900/30 to-amber-900/30', border: 'border-yellow-600', text: 'text-yellow-300', icon: AlertTriangle, msg: `${daysRemaining} days remaining — renew soon` },
    healthy: { bg: 'from-green-900/30 to-emerald-900/30', border: 'border-green-700', text: 'text-green-300', icon: CheckCircle2, msg: `${daysRemaining} days remaining — subscription active` },
  }

  const style = urgencyStyles[urgency]
  const UrgencyIcon = style.icon

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/settings" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Settings · Subscription & Billing</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <CreditCard className="w-7 h-7 text-indigo-400" /> Subscription & Billing
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Plan status · Billing history · Renewal</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <Link href="/wavecore-erp/subscription" className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40">
              <Zap className="w-5 h-5" /> Renew / Upgrade
            </Link>
          </div>
        </div>

        {error && <div className="p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* STATUS BANNER */}
            <div className={`rounded-2xl border ${style.border} bg-gradient-to-r ${style.bg} p-5 flex items-center gap-4`}>
              <UrgencyIcon className={`w-10 h-10 ${style.text} flex-shrink-0`} />
              <div className="flex-1">
                <p className={`text-lg font-bold ${style.text}`}>{style.msg}</p>
                {summary.expiresAt && (
                  <p className="text-sm text-neutral-400 mt-1">
                    Expires: {new Date(summary.expiresAt).toLocaleString('en-GB')}
                  </p>
                )}
              </div>
              {urgency !== 'healthy' && (
                <Link href="/wavecore-erp/subscription" className="px-4 py-2 rounded-xl bg-white text-neutral-900 font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Renew Now
                </Link>
              )}
            </div>

            {/* CURRENT PLAN CARD */}
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-700 p-6 lg:p-8 text-white">
              <div className="flex flex-wrap justify-between items-start gap-6">
                <div>
                  <p className="text-sm opacity-80 uppercase tracking-widest font-bold mb-2">Current Plan</p>
                  <h2 className="text-4xl font-extrabold flex items-center gap-3 mb-3">
                    <Crown className="w-8 h-8" /> {summary.currentPlan || 'No Active Plan'}
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{summary.currentCurrency || 'KES'} {Number(summary.currentAmount || 500).toLocaleString()}</span>
                    <span className="text-sm opacity-80">/ month</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80 uppercase tracking-widest font-bold mb-2">Status</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    urgency === 'healthy' ? 'bg-green-500 text-white' :
                    urgency === 'warning' ? 'bg-yellow-500 text-white' :
                    urgency === 'critical' ? 'bg-red-500 text-white' :
                    'bg-neutral-700 text-neutral-300'
                  }`}>
                    {summary.currentStatus || 'NONE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Days Remaining</p>
                  <p className="text-2xl font-extrabold">{daysRemaining}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Next Billing</p>
                  <p className="text-lg font-bold">{summary.nextBillingAt ? new Date(summary.nextBillingAt).toLocaleDateString('en-GB') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Total Paid</p>
                  <p className="text-lg font-bold">{summary.currentCurrency} {Number(summary.totalPaid || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Last Receipt</p>
                  <p className="text-xs font-mono font-bold truncate">{summary.lastMpesaReceipt || '—'}</p>
                </div>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Calendar className="w-6 h-6 text-indigo-500 mb-2" />
                <p className="text-3xl font-extrabold text-white">{daysRemaining}</p>
                <p className="text-xs text-neutral-400 mt-1">Days Remaining</p>
              </div>
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <DollarSign className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-3xl font-extrabold text-white">{Number(summary.totalPaid || 0).toLocaleString()}</p>
                <p className="text-xs text-neutral-400 mt-1">Total Paid ({summary.currentCurrency})</p>
              </div>
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Receipt className="w-6 h-6 text-cyan-500 mb-2" />
                <p className="text-3xl font-extrabold text-white">{summary.paymentCount || 0}</p>
                <p className="text-xs text-neutral-400 mt-1">Payments Made</p>
              </div>
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <TrendingUp className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-3xl font-extrabold text-white">{summary.historyCount || 0}</p>
                <p className="text-xs text-neutral-400 mt-1">Total Records</p>
              </div>
            </div>

            {/* PLAN DETAILS */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> What's Included
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'All ERP modules — HR, Manufacturing, Sales, Inventory, CRM, Finance',
                  'Unlimited users within tenant',
                  'Branded PDF reports across all modules',
                  'Audit logging on every action',
                  'Role-based access control',
                  'Kenya-compliant payroll (PAYE, NSSF, SHIF, Housing Levy)',
                  'M-Pesa payment integration',
                  'Priority email support',
                ].map(feature => (
                  <div key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-neutral-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BILLING HISTORY */}
            <div>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Billing History
              </h3>
              {history.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <Receipt className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
                  <p className="text-neutral-400">No billing history yet</p>
                  <Link href="/wavecore-erp/subscription" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    <Zap className="w-4 h-4" /> Subscribe Now
                  </Link>
                </div>
              ) : (
                <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-800">
                        <tr>
                          <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Date</th>
                          <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">Plan</th>
                          <th className="text-right p-3 text-xs uppercase tracking-wide text-neutral-400">Amount</th>
                          <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Days</th>
                          <th className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400">M-Pesa Receipt</th>
                          <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Status</th>
                          <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(h => {
                          const sc = statusColor(h.status, h.isExpired)
                          return (
                            <tr key={h.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                              <td className="p-3 text-xs text-neutral-400">{new Date(h.createdAt).toLocaleDateString('en-GB')}</td>
                              <td className="p-3 text-white font-medium">{h.plan || '—'}</td>
                              <td className="p-3 text-right text-white font-bold">{h.currency} {Number(h.amount).toLocaleString()}</td>
                              <td className="p-3 text-center text-neutral-300">{h.daysCovered ?? '—'}</td>
                              <td className="p-3 font-mono text-xs text-cyan-400">{h.mpesaReceipt || '—'}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold ${sc.text} bg-gradient-to-r ${sc.bg}`}>
                                  {h.isExpired ? 'EXPIRED' : sc.label.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button onClick={() => setDetail(h)} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">View</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* INFO PANEL */}
            <div className="bg-blue-900/20 rounded-2xl border border-blue-800/50 p-5 flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200 space-y-1">
                <p><b>How renewal works:</b> Your subscription is monthly. On the expiry date, you'll be redirected to the subscription page to renew via M-Pesa.</p>
                <p><b>Auto-renew:</b> Currently disabled — you control every payment manually. Contact support to enable auto-renew.</p>
                <p><b>Need help?</b> Email support@intelliwavve.com or use the in-app chat.</p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* RECEIPT DETAIL MODAL */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" /> Payment Receipt
              </h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Row label="Transaction ID" value={detail.id} mono />
              <Row label="M-Pesa Receipt" value={detail.mpesaReceipt} mono highlight />
              <Row label="Plan" value={detail.plan} />
              <Row label="Amount" value={`${detail.currency} ${Number(detail.amount).toLocaleString()}`} />
              <Row label="Paid On" value={detail.startDate ? new Date(detail.startDate).toLocaleString('en-GB') : '—'} />
              <Row label="Valid Until" value={detail.endDate ? new Date(detail.endDate).toLocaleString('en-GB') : '—'} />
              <Row label="Days Covered" value={detail.daysCovered ?? '—'} />
              <Row label="Status" value={detail.isExpired ? 'EXPIRED' : detail.status} />
            </div>
            <div className="p-5 border-t border-neutral-800 flex justify-end">
              <button onClick={() => setDetail(null)} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, mono, highlight }: { label: string; value: any; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs uppercase tracking-wide text-neutral-500 font-bold flex-shrink-0">{label}</span>
      <span className={`text-sm text-right ${mono ? 'font-mono' : ''} ${highlight ? 'text-cyan-400 font-bold' : 'text-white'} break-all`}>
        {value || '—'}
      </span>
    </div>
  )
}