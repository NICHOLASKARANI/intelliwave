'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Lock, Shield, Zap, CheckCircle, Loader2, Phone,
  CreditCard, ArrowRight, AlertCircle, Fingerprint, KeyRound
} from 'lucide-react'

export default function SubscriptionPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mpesaReceipt, setMpesaReceipt] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    if (locked && lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
    if (locked && lockTimer === 0) {
      setLocked(false)
      setAttempts(0)
    }
  }, [locked, lockTimer])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/wavecore/subscription')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch {} finally { setLoading(false) }
  }

  // Validate phone number (Kenyan format)
  function validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s-]/g, '')
    const regex = /^(?:\+?254|0)(?:7\d{8}|1\d{8})$/
    return regex.test(cleaned)
  }

  // Validate M-Pesa receipt (e.g., RBT123456789)
  function validateReceipt(receipt: string): boolean {
    const regex = /^[A-Z]{3}\d{9,15}$/i
    return regex.test(receipt.trim())
  }

  const handlePay = async () => {
    // Security checks
    if (locked) {
      setError(`Account temporarily locked. Try again in ${lockTimer}s`)
      return
    }

    if (!validatePhone(phoneNumber)) {
      setError('Invalid phone number. Use format: 0712345678 or +254712345678')
      return
    }

    if (!validateReceipt(mpesaReceipt)) {
      setError('Invalid M-Pesa receipt. Format: RBT123456789')
      return
    }

    if (attempts >= 5) {
      setLocked(true)
      setLockTimer(60)
      setError('Too many attempts. Account locked for 60 seconds.')
      return
    }

    setPaying(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'MPESA',
          phoneNumber: phoneNumber.replace(/[\s-]/g, ''),
          mpesaReceipt: mpesaReceipt.trim().toUpperCase(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/wavecore-erp'
        }, 3000)
      } else {
        setAttempts(attempts + 1)
        setError(data.error || 'Payment verification failed')
      }
    } catch (err) {
      setAttempts(attempts + 1)
      setError('Network error. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (status?.subscribed) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Subscription Active!</h1>
          <p className="text-muted-foreground mb-6">
            Expires: {new Date(status.expiresAt).toLocaleDateString()} ({status.daysRemaining} days)
          </p>
          <Link href="/wavecore-erp" className="inline-block px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">Subscription active for 30 days</p>
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={64} height={64} className="rounded-xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold">WaveCore ERP</h1>
          <p className="text-muted-foreground mt-1">Secure Subscription</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border p-8">
          {/* Price */}
          <div className="text-center mb-6">
            <p className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">KSh 500</p>
            <p className="text-muted-foreground mt-1">per month</p>
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950 text-center">
              <Shield className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs font-medium">Encrypted</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-center">
              <Fingerprint className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs font-medium">Verified</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-center">
              <KeyRound className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs font-medium">Secure</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {locked && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 text-sm mb-4 text-center">
              Account locked. Try again in {lockTimer} seconds.
            </div>
          )}

          {/* Payment Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">M-Pesa Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-center font-mono"
                  placeholder="0712345678"
                  disabled={locked}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">M-Pesa Receipt Number</label>
              <input
                type="text"
                value={mpesaReceipt}
                onChange={(e) => setMpesaReceipt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-center font-mono uppercase"
                placeholder="RBT123456789"
                disabled={locked}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Send KSh 500 to Paybill 4760783, then enter receipt
            </p>

            <button 
              onClick={handlePay} 
              disabled={paying || locked}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {paying ? 'Verifying...' : 'Activate - KSh 500'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}