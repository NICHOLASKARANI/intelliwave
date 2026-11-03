'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Receipt, Calendar, TrendingUp, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'

interface BillingData {
  authenticated: boolean
  subscriptionStatus?: string | null
  subscribed?: boolean
  subscriptionEndDate?: string | null
  daysLeft?: number | null
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/wavecore/auth/session', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) {
          window.location.href = 'https://www.intelliwavve.com/wavecore-erp/auth/login?returnTo=/wavve-si/dashboard/billing'
          return
        }
        setData(d)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300"><AlertCircle className="w-6 h-6 mb-2" /><p>{error}</p></div>
  }

  const isActive = !!data?.subscribed
  const daysLeft = data?.daysLeft ?? 0
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
          <p className="text-sm text-slate-400">Manage your plan and payment methods</p>
        </div>
      </div>

      {/* Current Plan */}
      <div className={`border rounded-2xl p-6 mb-6 ${isActive ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Current Plan</p>
            <h2 className="text-2xl font-bold text-white">
              {isActive ? 'Active Subscription' : 'No Active Subscription'}
            </h2>
          </div>
          <span className={`text-sm font-bold px-4 py-2 rounded-lg ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {data?.subscriptionStatus || 'INACTIVE'}
          </span>
        </div>

        {isActive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-xs text-slate-400 mb-1">Renews On</p>
              <p className="text-sm font-bold text-white">
                {data?.subscriptionEndDate ? new Date(data.subscriptionEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-xs text-slate-400 mb-1">Days Remaining</p>
              <p className={`text-sm font-bold ${isExpiringSoon ? 'text-amber-400' : 'text-white'}`}>{daysLeft} days</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-xs text-slate-400 mb-1">Status</p>
              <p className="text-sm font-bold text-green-400">Active</p>
            </div>
          </div>
        )}

        {isExpiringSoon && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Your subscription expires in {daysLeft} days. Renew now to avoid interruption.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link href="https://www.intelliwavve.com/wavecore-erp/subscription" className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all">
          <Receipt className="w-6 h-6 text-blue-400 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Manage Subscription</h3>
          <p className="text-sm text-slate-400 mb-3">View all plans, upgrade, or change your billing period</p>
          <span className="text-xs text-blue-400 flex items-center gap-1">Open WaveCore ERP <ArrowRight className="w-3 h-3" /></span>
        </Link>

        <Link href="https://www.intelliwavve.com/wavecore-erp/subscription/pay" className="group bg-slate-900 border border-slate-800 hover:border-green-500/50 rounded-2xl p-6 transition-all">
          <CreditCard className="w-6 h-6 text-green-400 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">Renew Now</h3>
          <p className="text-sm text-slate-400 mb-3">Quick renewal via M-Pesa</p>
          <span className="text-xs text-green-400 flex items-center gap-1">Pay with M-Pesa <ArrowRight className="w-3 h-3" /></span>
        </Link>
      </div>

      {/* Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-3">Billing Information</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Billing managed through your WaveCore ERP account</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> All payments via M-Pesa — receipts sent to your phone</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Subscription auto-expires on end date — renew anytime</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Your data is preserved on expiry — access restores immediately on renewal</li>
        </ul>
      </div>
    </div>
  )
}