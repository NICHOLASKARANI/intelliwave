'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Shield, Zap, CheckCircle2, Loader2, Phone, Smartphone, AlertCircle,
  Fingerprint, KeyRound, Sparkles, Server, TrendingUp, Users, Clock,
  Globe, Award, BadgeCheck, HelpCircle, Star, Building2, Check,
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

  useEffect(() => { fetchStatus() }, [])

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
    setPushing(true); setError('')
    try {
      const res = await fetch('/api/wavecore/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })
      const data = await res.json()
      if (res.ok && data.success) { setStkSent(true); setCheckoutId(data.checkoutRequestId) }
      else if (data.needsConfig) { setError('M-Pesa not configured. Please add Consumer Key in Vercel env.') }
      else { setError(data.error || 'STK Push failed') }
    } catch { setError('Network error') }
    finally { setPushing(false) }
  }

  const handleVerifyPayment = async () => {
    setVerifying(true)
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/wavecore/subscription')
        if (res.ok) {
          const data = await res.json()
          if (data.subscribed) {
            setSuccess(true)
            setTimeout(() => { window.location.href = '/wavecore-erp' }, 2000)
            return true
          }
        }
        return false
      } catch { return false }
    }
    for (let i = 0; i < 10; i++) {
      const paid = await checkStatus()
      if (paid) return
      await new Promise(r => setTimeout(r, 3000))
    }
    setVerifying(false)
    setError('Payment not confirmed yet. Please wait or try again.')
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  )

  if (success || status?.subscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 border border-slate-700/50 shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Subscription Active</h1>
          <p className="text-slate-400 mb-6 text-sm">
            Expires: {new Date(status?.expiresAt || Date.now() + 30 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-xs text-slate-500 mt-4">Redirecting to dashboard…</p>
        </div>
      </div>
    )
  }

  const trustBadges = [
    { label: 'SOC 2', icon: Shield },
    { label: 'ISO 27001', icon: Award },
    { label: 'GDPR', icon: Globe },
    { label: 'Kenya DPA', icon: BadgeCheck },
  ]

  const includes = [
    { icon: Server, label: 'All ERP modules unlocked', desc: 'HR · Projects · Manufacturing · Helpdesk · Marketplace' },
    { icon: Sparkles, label: 'AI Copilot & analytics', desc: 'Predictive insights in every workflow' },
    { icon: Users, label: 'Unlimited users in your org', desc: 'Owner, admins, managers, employees' },
    { icon: TrendingUp, label: 'Automatic updates', desc: 'New features shipped weekly' },
    { icon: Shield, label: 'Enterprise-grade security', desc: 'AES-256 · RBAC · full audit logs' },
    { icon: Clock, label: '24/7 support SLA', desc: 'Response within 1 business hour' },
  ]

  const faqs = [
    { q: 'When does my subscription activate?', a: 'Immediately after M-Pesa confirms the payment — usually within seconds.' },
    { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard settings. You keep access until the end of your current billing period.' },
    { q: 'Do you offer annual plans?', a: 'Yes — contact sales for annual pricing with 20% savings.' },
    { q: 'What payment methods do you accept?', a: 'M-Pesa (primary). Enterprise customers can request bank transfer or purchase order.' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero band */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full filter blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 lg:px-8 py-16 lg:py-20">
          <div className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={48} height={48} className="rounded-xl shadow-lg" />
              <div className="text-left">
                <p className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                  IntelliWavve
                </p>
                <p className="text-[10px] text-indigo-300/70 font-semibold tracking-widest uppercase">
                  WaveCore ERP
                </p>
              </div>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/10 text-xs text-indigo-200 font-bold mb-6">
              <Sparkles className="w-3 h-3 text-amber-400" /> Simple monthly pricing · No setup fees
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Activate your<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                enterprise workspace.
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              One subscription. Every module. All future updates. Cancel anytime.
            </p>
          </div>

          {/* Price card */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-slate-700/50 shadow-2xl">
              <div className="text-center pb-8 border-b border-slate-800">
                <div className="inline-flex items-baseline gap-2 mb-2">
                  <span className="text-2xl text-slate-400">KSh</span>
                  <span className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    500
                  </span>
                  <span className="text-lg text-slate-400">/ month</span>
                </div>
                <p className="text-sm text-slate-400">Billed monthly via M-Pesa · Cancel anytime</p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mt-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!stkSent ? (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-bold text-white">Pay with M-Pesa</p>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">
                      Your M-Pesa number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSTKPush()}
                        placeholder="0712345678"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSTKPush}
                    disabled={pushing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {pushing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                    {pushing ? 'Sending STK Push…' : 'Send STK Push · Pay KSh 500'}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    You&apos;ll receive a prompt on your phone to enter your M-Pesa PIN
                  </p>
                </div>
              ) : (
                <div className="mt-8 text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
                    <Smartphone className="w-10 h-10 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Check your phone</h3>
                    <p className="text-sm text-slate-400">
                      Enter your M-Pesa PIN to complete the payment of KSh 500
                    </p>
                  </div>
                  <button
                    onClick={handleVerifyPayment}
                    disabled={verifying}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-green-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {verifying ? 'Verifying payment…' : "I've entered my PIN · Verify"}
                  </button>
                  <button onClick={() => setStkSent(false)} className="text-xs text-indigo-400 hover:text-indigo-300">
                    Use a different number
                  </button>
                </div>
              )}

              {/* Trust mini strip */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/10 text-center">
                    <Shield className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Encrypted</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                    <Fingerprint className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Verified</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-center">
                    <KeyRound className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Secure</p>
                  </div>
                </div>
                <div className="flex justify-center gap-3 text-[10px] text-slate-500">
                  {trustBadges.map(b => (
                    <span key={b.label} className="flex items-center gap-1">
                      <b.icon className="w-3 h-3 text-indigo-400" /> {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Everything included</h2>
          <p className="text-slate-400">One price. Unlimited value.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {includes.map(f => (
            <div key={f.label} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-600 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-white mb-1">{f.label}</p>
              <p className="text-xs text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <HelpCircle className="w-7 h-7 text-indigo-400" /> Common questions
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map(f => (
            <div key={f.q} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <p className="font-bold text-white mb-1">{f.q}</p>
              <p className="text-sm text-slate-400">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400 mb-3">Need a different plan or enterprise features?</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white font-bold text-sm transition-all">
            <Building2 className="w-4 h-4" /> Contact Enterprise Sales
          </Link>
        </div>
      </div>
    </div>
  )
}