'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, CreditCard, Building2, Smartphone, Loader2, ArrowRight } from 'lucide-react'

type Plan = { id: string; name: string; price: number; features: string[] }
type Method = 'mpesa' | 'bank'

const PLANS: Plan[] = [
  {
    id: 'wavecore-erp',
    name: 'WaveCore ERP',
    price: 2500,
    features: ['Full ERP suite', 'AI automation', 'M-Pesa reconciliation', 'Multi-user', 'KRA compliance'],
  },
  {
    id: 'wavvemarket',
    name: 'WavveMarket',
    price: 1500,
    features: ['Seller storefront', 'AI smart routing', 'Buyer protection', 'Instant payouts'],
  },
  {
    id: 'wavve-si',
    name: 'Wavve SI',
    price: 3500,
    features: ['Restaurant & hospitality', 'KDS + orders + tables', 'AI analytics', 'Multi-branch'],
  },
  {
    id: 'bundle',
    name: 'Full Bundle (Best Value)',
    price: 5500,
    features: ['Everything in all 3', 'Priority support', '40% savings vs separate', 'Founding member pricing locked'],
  },
]

const BANK_DETAILS = {
  accountName: 'NIC NOVARANN LAUNCHPAD ENTERPRISES',
  businessNumber: '400200',
  accountNumber: '01103362733001',
}

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('bundle')
  const [method, setMethod] = useState<Method>('mpesa')
  const [phone, setPhone] = useState('')
  const [txnRef, setTxnRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [exec, setExec] = useState<string | null>(null)
  const [product, setProduct] = useState<string | null>(null)

  useEffect(() => {
    // Read cookies set by middleware
    const readCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
      return match ? decodeURIComponent(match[2]) : null
    }
    const execCookie = readCookie('iw_exec')
    const productCookie = readCookie('iw_product')
    setExec(execCookie)
    setProduct(productCookie)
    if (productCookie) {
      const found = PLANS.find((p) => p.id === productCookie)
      if (found) setSelectedPlan(found.id)
    }
  }, [])

  const plan = PLANS.find((p) => p.id === selectedPlan) || PLANS[3]

  const handleMpesa = async () => {
    if (!phone || phone.length < 9) {
      setMessage('Enter a valid M-Pesa phone number')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/wavecore/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.startsWith('+') ? phone : '254' + phone.replace(/^0/, ''),
          amount: plan.price,
          planId: selectedPlan,
          exec,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setMessage('Check your phone — enter your M-Pesa PIN to complete payment.')
      } else {
        setMessage(data.error || 'Payment could not be initiated. Please try again.')
      }
    } catch {
      setMessage('Network error. Please try again.')
    }
    setLoading(false)
  }

  const handleBankTransfer = async () => {
    if (!txnRef || txnRef.length < 6) {
      setMessage('Enter the transaction reference from your bank')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/subscription/bank-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          amount: plan.price,
          txnRef,
          exec,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setMessage('Payment submitted for verification. Your access unlocks within 2 hours of confirmation.')
      } else {
        setMessage(data.error || 'Could not submit. Please contact support.')
      }
    } catch {
      setMessage('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
            Activate Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">IntelliWavve</span> Access
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Choose your plan, pay via M-Pesa or bank transfer, and unlock full access instantly.
            {exec && <span className="block mt-2 text-sm text-amber-400">Referred by Executive: {exec}</span>}
          </p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border-2 border-green-500/30 rounded-3xl p-12 text-center max-w-2xl mx-auto">
            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Payment Submitted</h2>
            <p className="text-slate-300 mb-8">{message}</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Plan selection */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={'text-left p-6 rounded-2xl border-2 transition-all ' + (selectedPlan === p.id ? 'bg-amber-500/10 border-amber-400 shadow-xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    {selectedPlan === p.id && <CheckCircle2 className="w-6 h-6 text-amber-400" />}
                  </div>
                  <div className="text-3xl font-extrabold text-white mb-4">
                    KSh {p.price.toLocaleString()}<span className="text-sm font-normal text-slate-400">/month</span>
                  </div>
                  <ul className="space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-sm text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Payment method */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>

              <div className="flex gap-2 mb-6 p-1 bg-slate-800 rounded-2xl">
                <button
                  onClick={() => setMethod('mpesa')}
                  className={'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ' + (method === 'mpesa' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white')}
                >
                  <Smartphone className="w-4 h-4" /> M-Pesa (Kenya)
                </button>
                <button
                  onClick={() => setMethod('bank')}
                  className={'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ' + (method === 'bank' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white')}
                >
                  <Building2 className="w-4 h-4" /> Bank Transfer (Global)
                </button>
              </div>

              {message && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {message}
                </div>
              )}

              {method === 'mpesa' && (
                <div>
                  <p className="text-sm text-slate-400 mb-4">
                    You&apos;ll receive an M-Pesa prompt on your phone. Enter your PIN to complete payment.
                  </p>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number (e.g., 0712345678)"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white mb-4 focus:outline-none focus:border-green-500"
                  />
                  <button
                    onClick={handleMpesa}
                    disabled={loading}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    Pay KSh {plan.price.toLocaleString()} via M-Pesa
                  </button>
                </div>
              )}

              {method === 'bank' && (
                <div>
                  <p className="text-sm text-slate-400 mb-4">
                    For global users paying from outside Kenya. Transfer the exact amount to the account below, then submit your transaction reference.
                  </p>
                  <div className="bg-slate-800 rounded-xl p-4 mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Account Name</span>
                      <span className="text-white font-mono text-sm">{BANK_DETAILS.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Business Number</span>
                      <span className="text-white font-mono text-sm">{BANK_DETAILS.businessNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Account Number</span>
                      <span className="text-white font-mono text-sm">{BANK_DETAILS.accountNumber}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                      <span className="text-slate-400 text-sm">Amount</span>
                      <span className="text-amber-400 font-bold">KSh {plan.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="Bank transaction reference (e.g., 1234567890)"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white mb-4 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleBankTransfer}
                    disabled={loading}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                    Submit Transaction Reference
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              Need help? <Link href="/contact" className="text-blue-400 hover:underline">Contact support</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}