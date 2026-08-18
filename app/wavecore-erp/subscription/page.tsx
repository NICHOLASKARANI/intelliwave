'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Lock, Shield, Zap, CheckCircle, Loader2, Phone, 
  Smartphone, CreditCard, ArrowRight
} from 'lucide-react'

export default function SubscriptionPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mpesaReceipt, setMpesaReceipt] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/wavecore/subscription')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch {} finally { setLoading(false) }
  }

  const handlePay = async () => {
    if (!phoneNumber || !mpesaReceipt) {
      setError('Please enter your M-Pesa phone number and receipt number')
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
          phoneNumber,
          mpesaReceipt,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/wavecore-erp'
        }, 3000)
      } else {
        setError(data.error || 'Payment verification failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  // Already subscribed
  if (status?.subscribed) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Subscription Active!</h1>
          <p className="text-muted-foreground mb-2">
            Your WaveCore ERP subscription is active
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Expires: {new Date(status.expiresAt).toLocaleDateString()} ({status.daysRemaining} days remaining)
          </p>
          <Link href="/wavecore-erp" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Your subscription is now active for 30 days
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
          <p className="text-muted-foreground mt-1">Complete Business Management Suite</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border p-8">
          {/* Price */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-5xl font-bold">KSh 500</p>
            <p className="text-muted-foreground mt-1">per month</p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>14 ERP Modules (Finance, CRM, Inventory, HR...)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>AI Copilot & Automation</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span>Multi-tenant Data Isolation</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-purple-500" />
              <span>M-Pesa Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-pink-500" />
              <span>Mobile Responsive</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4 text-center">
              {error}
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-center"
                  placeholder="e.g., 0712345678"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">M-Pesa Receipt Number</label>
              <input
                type="text"
                value={mpesaReceipt}
                onChange={(e) => setMpesaReceipt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-center"
                placeholder="e.g., RBT123456789"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Send KSh 500 to Paybill 123456, then enter the receipt number
            </p>

            <button 
              onClick={handlePay} 
              disabled={paying || !phoneNumber || !mpesaReceipt}
              className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {paying ? 'Verifying...' : 'Activate Subscription - KSh 500'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}