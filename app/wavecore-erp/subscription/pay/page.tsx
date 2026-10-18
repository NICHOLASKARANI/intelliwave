'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Smartphone, ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Clock, Phone, Receipt, ShieldCheck, Sparkles, Calendar, Zap,
} from 'lucide-react'

type Stage = 'form' | 'sending' | 'waiting' | 'success' | 'failed'

interface Plan {
  key: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'
  name: string
  duration: string
  days: number
  price: number
  popular?: boolean
}

const PLANS: Plan[] = [
  { key: 'MONTHLY',    name: 'Monthly',     duration: '1 month',   days: 30,  price: 500 },
  { key: 'QUARTERLY',  name: '3 Months',    duration: '3 months',  days: 90,  price: 1350, popular: true },
  { key: 'SEMIANNUAL', name: '6 Months',    duration: '6 months',  days: 180, price: 2750 },
  { key: 'YEARLY',     name: '1 Year',      duration: '12 months', days: 365, price: 5000 },
]

export default function MpesaPayPage() {
  const router = useRouter()

  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]) // default to 3 months
  const [phoneNumber, setPhoneNumber] = useState('')
  const [stage, setStage] = useState<Stage>('form')
  const [error, setError] = useState('')
  const [checkoutId, setCheckoutId] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const [txData, setTxData] = useState<any>(null)

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''

  // Poll for transaction status while waiting
  useEffect(() => {
    if (stage !== 'waiting' || !checkoutId) return

    let cancelled = false
    const poll = async () => {
      if (cancelled) return
      try {
        const res = await fetch('/api/wavecore/mpesa/status/' + encodeURIComponent(checkoutId))
        const data = await res.json()
        if (res.ok) {
          if (data.isSuccess) { setTxData(data); setStage('success'); return }
          if (data.isFailed) { setTxData(data); setStage('failed'); setError(data.resultDescription || 'Payment failed'); return }
        }
        const next = pollCount + 1
        setPollCount(next)
        if (next > 40) { setStage('failed'); setError('Payment timed out after 2 minutes. Please try again.'); return }
        setTimeout(poll, 3000)
      } catch {
        if (!cancelled) {
          const next = pollCount + 1
          setPollCount(next)
          if (next > 40) { setStage('failed'); setError('Network error while checking status.') }
          else setTimeout(poll, 3000)
        }
      }
    }

    setTimeout(poll, 3000)
    return () => { cancelled = true }
    /* eslint-disable-next-line */
  }, [stage, checkoutId, pollCount])

  const submit = async () => {
    setError('')
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '')
    if (!/^(?:\+?254|0)(?:7\d{8}|1\d{8})$/.test(cleaned)) {
      setError('Enter a valid Safaricom number (e.g. 0712345678)')
      return
    }

    setStage('sending')
    try {
      const res = await fetch('/api/wavecore/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          phoneNumber: cleaned,
          plan: selectedPlan.key,
          // 🧪 TEST MODE — KSh 5 override. Revert this to selectedPlan.price after testing.
          amount: 5,
          days: selectedPlan.days,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setStage('failed')
        setError(data.error || 'Failed to send STK Push')
        return
      }
      setCheckoutId(data.checkoutRequestId)
      setPollCount(0)
      setStage('waiting')
    } catch (e) {
      setStage('failed')
      setError('Network error: ' + (e as Error).message)
    }
  }

  const reset = () => {
    setStage('form'); setError(''); setCheckoutId(''); setPollCount(0); setTxData(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Subscription · M-Pesa</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/subscription" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Subscription
        </Link>

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-6 lg:p-8 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Smartphone className="w-8 h-8" /> Pay with M-Pesa
          </h1>
          <p className="text-white/80 text-sm">Secure payment via Safaricom M-Pesa</p>
        </div>

        {/* Stage: FORM */}
        {stage === 'form' && (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-4">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Choose Duration</h3>
              <div className="space-y-3">
                {PLANS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPlan(p)}
                    className={
                      'w-full text-left p-4 rounded-xl border-2 transition relative ' +
                      (selectedPlan.key === p.key
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-green-300')
                    }
                  >
                    {p.popular && (
                      <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wide">
                        Best Value
                      </span>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-500" />
                          {p.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">{p.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          KSh {p.price.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {(p.price / p.days).toFixed(1)} KSh/day
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 mb-4">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-3">Phone Number</h3>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="0712345678"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-lg font-mono"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                You&apos;ll get a prompt on your phone to enter your M-Pesa PIN.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!phoneNumber || phoneNumber.length < 9}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <Smartphone className="w-5 h-5" />
              TEST MODE: Pay KSh 5 for {selectedPlan.name}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              Secure Safaricom payment · STK Push
            </div>
          </>
        )}

        {/* Stage: SENDING */}
        {stage === 'sending' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-green-500 mb-4" />
            <p className="font-bold text-lg mb-1">Sending M-Pesa request…</p>
            <p className="text-sm text-neutral-500">This takes a few seconds</p>
          </div>
        )}

        {/* Stage: WAITING */}
        {stage === 'waiting' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center animate-pulse">
              <Smartphone className="w-10 h-10 text-green-500" />
            </div>
            <p className="font-bold text-xl mb-2">Check your phone 📱</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
              We sent an M-Pesa prompt to <strong>{phoneNumber}</strong>. Enter your PIN to complete
              the payment of <strong>KSh {selectedPlan.price.toLocaleString()}</strong>.
            </p>

            <div className="flex items-center justify-center gap-3 text-xs text-neutral-500 mb-4">
              <Clock className="w-3.5 h-3.5" />
              <span>Checking status every 3 seconds ({pollCount}/40)</span>
            </div>

            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-green-500 h-1.5 transition-all"
                style={{ width: Math.min(100, (pollCount / 40) * 100) + '%' }}
              ></div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                onClick={async () => {
                  if (!checkoutId) return
                  try {
                    const r = await fetch('/api/wavecore/mpesa/query', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
                      body: JSON.stringify({ checkoutRequestId: checkoutId }),
                    })
                    const d = await r.json()
                    if (d.isSuccess) { setTxData(d); setStage('success') }
                    else if (d.status === 'FAILED') { setTxData(d); setStage('failed'); setError(d.resultDescription || 'Payment failed') }
                  } catch { /* ignore */ }
                }}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Check Status Now
              </button>
              <button onClick={reset} className="text-xs text-neutral-500 hover:text-red-500">
                Cancel and start over
              </button>
            </div>
          </div>
        )}

        {/* Stage: SUCCESS */}
        {stage === 'success' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-green-500 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <p className="font-bold text-3xl mb-2 text-green-600 dark:text-green-400">Payment Successful!</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Your {selectedPlan.name} plan is now active.
            </p>

            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-left text-sm mb-6 space-y-2">
              <div className="flex justify-between"><span className="text-neutral-500">Plan</span><span className="font-bold">{selectedPlan.name} ({selectedPlan.days} days)</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Amount</span><span className="font-bold">KSh {selectedPlan.price.toLocaleString()}</span></div>
              {txData?.mpesaReceipt && (
                <div className="flex justify-between"><span className="text-neutral-500">M-Pesa Receipt</span><span className="font-mono text-xs font-bold">{txData.mpesaReceipt}</span></div>
              )}
              <div className="flex justify-between"><span className="text-neutral-500">Phone</span><span className="font-mono text-xs">{phoneNumber}</span></div>
            </div>

            <button
              onClick={() => router.push('/wavecore-erp/subscription')}
              className="w-full px-6 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" /> View My Subscription
            </button>

            <p className="mt-6 text-xs text-neutral-500">
              A confirmation SMS has been sent to your phone.
            </p>
          </div>
        )}

        {/* Stage: FAILED */}
        {stage === 'failed' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-red-500 p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <p className="font-bold text-2xl mb-2">Payment Failed</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              {error || 'The payment was not completed. Please try again.'}
            </p>
            <button onClick={reset} className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}