'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Lock, Shield, Zap, CheckCircle, Loader2, Phone,
  Smartphone, AlertCircle, Fingerprint, KeyRound
} from 'lucide-react'

export default function SubscriptionPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pushing, setPushing] = useState(false)
  const [stkSent, setStkSent] = useState(false)
  const [checkoutId, setCheckoutId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/wavecore/subscription')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        if (data.subscribed) setSuccess(true)
      }
    } catch {} finally { setLoading(false) }
  }

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '')
    return /^(?:\+?254|0)(?:7\d{8}|1\d{8})$/.test(cleaned)
  }

  const handleSTKPush = async () => {
    if (!validatePhone(phoneNumber)) {
      setError('Invalid phone number. Use format: 0712345678 or +254712345678')
      return
    }

    setPushing(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStkSent(true)
        setCheckoutId(data.checkoutRequestId)
      } else if (data.needsConfig) {
        setError('M-Pesa not configured. Please add Consumer Key in Vercel env.')
      } else {
        setError(data.error || 'STK Push failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setPushing(false)
    }
  }

  const handleVerifyPayment = async () => {
    setVerifying(true)
    // Poll for payment status
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/wavecore/subscription')
        if (res.ok) {
          const data = await res.json()
          if (data.subscribed) {
            setSuccess(true)
            setTimeout(() => window.location.href = '/wavecore-erp', 2000)
            return true
          }
        }
        return false
      } catch { return false }
    }

    // Poll up to 10 times (every 3 seconds = 30 seconds)
    for (let i = 0; i < 10; i++) {
      const paid = await checkStatus()
      if (paid) return
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    setVerifying(false)
    setError('Payment not confirmed yet. Please wait or try again.')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
  }

  if (success || status?.subscribed) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Subscription Active!</h1>
          <p className="text-muted-foreground mb-6">
            Expires: {new Date(status?.expiresAt || Date.now() + 30*86400000).toLocaleDateString()}
          </p>
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Redirecting to dashboard...</p>
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
          <p className="text-muted-foreground mt-1">Secure M-Pesa Subscription</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border p-8">
          <div className="text-center mb-6">
            <p className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">KSh 500</p>
            <p className="text-muted-foreground mt-1">per month</p>
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-green-50 text-center"><Shield className="w-5 h-5 text-green-500 mx-auto mb-1" /><p className="text-xs">Encrypted</p></div>
            <div className="p-3 rounded-xl bg-blue-50 text-center"><Fingerprint className="w-5 h-5 text-blue-500 mx-auto mb-1" /><p className="text-xs">Verified</p></div>
            <div className="p-3 rounded-xl bg-purple-50 text-center"><KeyRound className="w-5 h-5 text-purple-500 mx-auto mb-1" /><p className="text-xs">Secure</p></div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {!stkSent ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">M-Pesa Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-center font-mono" placeholder="0712345678" />
                </div>
              </div>
              <button onClick={handleSTKPush} disabled={pushing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {pushing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                {pushing ? 'Sending...' : 'Send STK Push (Enter PIN)'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Smartphone className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-pulse" />
              <h3 className="font-bold mb-2">STK Push Sent!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your M-Pesa PIN on your phone to complete payment.
              </p>
              <button onClick={handleVerifyPayment} disabled={verifying}
                className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {verifying ? 'Verifying...' : 'I\'ve Entered PIN - Complete'}
              </button>
              <button onClick={() => setStkSent(false)} className="text-sm text-indigo-500 mt-3">
                Use different number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}