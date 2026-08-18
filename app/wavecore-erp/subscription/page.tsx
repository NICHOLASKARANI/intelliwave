'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Lock, Shield, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SubscriptionPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [mpesaReceipt, setMpesaReceipt] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

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
      setError('Please enter your M-Pesa phone number and receipt')
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
      
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        setPhoneNumber('')
        setMpesaReceipt('')
      } else {
        const data = await res.json()
        setError(data.error || 'Payment verification failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={64} height={64} className="rounded-xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold">WaveCore ERP Subscription</h1>
          <p className="text-muted-foreground mt-1">Access all ERP modules</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-8">
          {status?.subscribed ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Active Subscription</h2>
              <p className="text-muted-foreground mb-4">
                Your subscription is active until {new Date(status.expiresAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {status.daysRemaining} days remaining
              </p>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Subscription Required</h2>
                <p className="text-muted-foreground mb-6">
                  Pay KSh 500/month to access WaveCore ERP
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure M-Pesa payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Instant activation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>30 days access</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-center"
                  placeholder="M-Pesa phone number (e.g., 0712345678)"
                />
                <input
                  type="text"
                  value={mpesaReceipt}
                  onChange={(e) => setMpesaReceipt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-center"
                  placeholder="M-Pesa receipt number (e.g., RBT123456789)"
                />
                <Button 
                  onClick={handlePay} 
                  disabled={paying || !phoneNumber || !mpesaReceipt}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {paying ? 'Processing...' : 'Activate KSh 500 Subscription'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}