'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Smartphone, ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle,
  CreditCard, Clock, Phone, Sparkles, Receipt, ShieldCheck,
} from 'lucide-react'

type Stage = 'form' | 'sending' | 'waiting' | 'success' | 'failed'

interface Plan {
  key: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  name: string
  price: number
  features: string[]
}

const PLANS: Plan[] = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: 500,
    features: ['Up to 5 users', 'Core ERP modules', 'Email support'],
  },
  {
    key: 'PROFESSIONAL',
    name: 'Professional',
    price: 2500,
    features: ['Up to 25 users', 'All modules + AI', 'Priority support'],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: 10000,
    features: ['Unlimited users', 'Dedicated infrastructure', '24/7 support'],
  },
]

export default function MpesaPayPage() {
  const router = useRouter()

  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0])
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
        if (!res.ok) {
          setPollCount(c => c + 1)
          if (pollCount > 40) {
            setStage('failed')
            setError('Payment timed out. Please try again.')
          } else {
            setTimeout(poll, 3000)
          }
          return
        }

        if (data.isSuccess) {
          setTxData(data)
          setStage('success')
          return
        }
        if (data.isFailed) {
          setTxData(data)
          setStage('failed')
          setError(data.resultDescription || 'Payment failed')
          return
        }

        // Still pending — keep polling for up to 2 minutes
        const next = pollCount + 1
        setPollCount(next)
        if (next > 40) {
          setStage('failed')
          setError('Payment timed out after 2 minutes. Please try again.')
          return
        }
        setTimeout(poll, 3000)
      } catch (e) {
        if (!cancelled) {
          setPollCount(c => c + 1)
          if (pollCount > 40) {
            setStage('failed')
            setError('Network error while checking status.')
          } else {
            setTimeout(poll, 3000)
          }
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
        body: JSON.stringify({ phoneNumber: cleaned, plan: selectedPlan.key }),
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
    setStage('form')
    setError('')
    setCheckoutId('')
    setPollCount(0)
    setTxData(null)
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
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Choose Plan</h3>
              <div className="space-y-3">
                {PLANS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPlan(p)}
                    className={
                      'w-full text-left p-4 rounded-xl border-2 transition ' +
                      (selectedPlan.key === p.key
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-green-300')
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{p.features.join(' · ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          KSh {p.price.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-neutral-500">per month</p>
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
                Enter your Safaricom M-Pesa number. You&apos;ll get a prompt on your phone to enter your PIN.
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
              Pay KSh {selectedPlan.price.toLocaleString()} with M-Pesa
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

            <button onClick={reset} className="mt-6 text-xs text-neutral-500 hover:text-red-500">
              Cancel and start over
            </button>
          </div>
        )}

        {/* Stage: SUCCESS */}
        {stage === 'success' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-green-500 p-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <p className="font-bold text-2xl mb-2">Payment Successful!</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Your subscription is now active.
            </p>

            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-left text-sm mb-6 space-y-2">
              <div className="flex justify-between"><span className="text-neutral-500">Plan</span><span className="font-bold">{selectedPlan.name}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Amount</span><span className="font-bold">KSh {selectedPlan.price.toLocaleString()}</span></div>
              {txData?.mpesaReceipt && (
                <div className="flex justify-between"><span className="text-neutral-500">M-Pesa Receipt</span><span className="font-mono text-xs font-bold">{txData.mpesaReceipt}</span></div>
              )}
              <div className="flex justify-between"><span className="text-neutral-500">Phone</span><span className="font-mono text-xs">{phoneNumber}</span></div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/wavecore-erp/subscription')}
                className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                View Subscription
              </button>
              <button onClick={reset} className="px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">
                Make Another Payment
              </button>
            </div>
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