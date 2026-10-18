'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Shield, CheckCircle2, Loader2, AlertCircle, Sparkles, Server,
  TrendingUp, Users, Clock, Globe, Building2, Check, X, Crown,
  Calendar, Receipt, ArrowRight, Zap, Lock, BarChart3, Layers,
} from 'lucide-react'

interface SubData {
  subscription: any
  subscribed: boolean
  isTrialActive: boolean
  daysLeft: number | null
  plan: string
  status: string
  amount: number
  currency: string
  endDate: string | null
  mpesaReceipt: string | null
  orgName: string
}

const PLAN_NAMES: Record<string, string> = {
  STARTER: 'WaveCore ERP',
  PROFESSIONAL: 'WaveCore Pro',
  ENTERPRISE: 'WaveCore Enterprise',
  TRIAL: 'Free Trial',
}

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Past Due',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [data, setData] = useState<SubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/wavecore/subscription')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else if (res.status === 401) {
        router.push('/wavecore-erp/auth/login')
      } else {
        setError('Unable to load subscription')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const planActive = data?.subscribed || (data?.isTrialActive ?? false)
  const isPaid = data?.subscribed === true
  const isTrial = data?.status === 'TRIAL'
  const expiry = data?.endDate

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <Link href="/wavecore-erp" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
            Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 lg:p-10 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-6 h-6 text-amber-300" />
              <span className="text-xs uppercase tracking-widest text-white/80 font-bold">Subscription</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              {isPaid ? 'Your Plan is Active' : isTrial ? 'You are on a Trial' : 'Activate Your Plan'}
            </h1>
            <p className="text-white/80 text-sm lg:text-base">
              {isPaid
                ? 'Manage your subscription and billing below.'
                : isTrial
                  ? 'Upgrade to keep using WaveCore after your trial ends.'
                  : 'Choose a plan to unlock the full power of WaveCore ERP.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-300 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <div className="grid lg:grid-cols-3 gap-6 mb-8">

            {/* Current plan card */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl border-2 border-emerald-500 overflow-hidden shadow-2xl shadow-emerald-500/10">
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold ${
                        planActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      }`}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                        {STATUS_LABELS[data.status] || data.status}
                      </span>
                      {isPaid && <Receipt className="w-4 h-4 text-neutral-400" />}
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white">
                      {PLAN_NAMES[data.plan] || data.plan}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {data.currency} {Number(data.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isPaid ? 'Paid' : isTrial ? 'Trial period' : '—'}
                    </p>
                  </div>
                </div>

                {/* Key dates */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mb-1">Status</p>
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {planActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mb-1">Expires</p>
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {formatDate(expiry)}
                    </p>
                  </div>
                  {isTrial && data.daysLeft !== null && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 col-span-2">
                      <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-bold mb-1">Trial Ends In</p>
                      <p className="font-bold text-amber-700 dark:text-amber-300">
                        {data.daysLeft} day{data.daysLeft !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  {data.mpesaReceipt && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 col-span-2">
                      <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-bold mb-1">Last M-Pesa Receipt</p>
                      <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{data.mpesaReceipt}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/wavecore-erp')}
                    className="flex-1 min-w-[200px] px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Layers className="w-5 h-5" /> Continue to Dashboard
                  </button>
                  <Link
                    href="/wavecore-erp/subscription/pay"
                    className="flex-1 min-w-[200px] px-6 py-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-base flex items-center justify-center gap-2 transition-all"
                  >
                    <Zap className="w-5 h-5" /> {isPaid ? 'Renew Plan' : 'Activate Plan'}
                  </Link>
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 lg:p-8">
              <h3 className="text-sm uppercase tracking-wide text-neutral-500 font-bold mb-4">
                {isPaid ? 'What You Have' : 'What You Unlock'}
              </h3>
              <ul className="space-y-3">
                {[
                  'Full WaveCore ERP access',
                  'HR, Projects, Manufacturing',
                  'Inventory, Sales, Procurement',
                  'Documents & PDF tools',
                  'AI assistant & insights',
                  'Email support',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 dark:text-neutral-300">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Plan comparison (for upgrades) */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 lg:p-8 mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Subscription Plans</h2>
              <p className="text-sm text-neutral-500">Pay via M-Pesa · Instant activation</p>
            </div>
            <Link
              href="/wavecore-erp/subscription/pay"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center gap-2 hover:shadow-lg transition"
            >
              <Zap className="w-4 h-4" /> Pay Now
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { name: 'Monthly', price: 500, days: 30, badge: null, rate: '16.7' },
              { name: '3 Months', price: 1350, days: 90, badge: 'Best Value', rate: '15.0' },
              { name: '6 Months', price: 2750, days: 180, badge: null, rate: '15.3' },
              { name: '1 Year', price: 5000, days: 365, badge: 'Max Savings', rate: '13.7' },
            ].map(p => (
              <div
                key={p.name}
                className={`relative p-5 rounded-2xl border-2 ${p.badge ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-neutral-200 dark:border-neutral-800'}`}
              >
                {p.badge && (
                  <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wide">
                    {p.badge}
                  </span>
                )}
                <p className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-2">{p.name}</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">KSh {p.price.toLocaleString()}</p>
                <p className="text-xs text-neutral-500 mb-3">KSh {p.rate}/day</p>
                <Link
                  href="/wavecore-erp/subscription/pay"
                  className="block text-center w-full py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition"
                >
                  Choose
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 lg:p-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Frequently Asked</h2>
          <div className="space-y-4">
            {[
              { q: 'How does billing work?', a: 'You pay via M-Pesa. Your subscription is active for the exact days you purchased. When it expires, you can renew anytime from this page.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Since subscriptions are pre-paid, you keep access until your current period ends. No auto-renewal, no surprise charges.' },
              { q: 'What happens when my plan expires?', a: 'You lose access to the dashboard until you renew. Your data is preserved safely and instantly available on renewal.' },
              { q: 'Which payment methods do you accept?', a: 'Safaricom M-Pesa (STK Push). Pay from your phone with your M-Pesa PIN.' },
              { q: 'Is my data secure?', a: 'Yes. All payments go through Safaricom M-Pesa directly. We never store your M-Pesa PIN or card details.' },
            ].map((f, i) => (
              <details key={i} className="group border-b border-neutral-200 dark:border-neutral-800 pb-4 last:border-0">
                <summary className="cursor-pointer list-none flex justify-between items-center gap-3">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">{f.q}</span>
                  <span className="text-neutral-400 group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-neutral-500">
          Need help? <Link href="/contact" className="text-emerald-600 hover:underline font-bold">Contact Support</Link>
        </div>
      </main>
    </div>
  )
}