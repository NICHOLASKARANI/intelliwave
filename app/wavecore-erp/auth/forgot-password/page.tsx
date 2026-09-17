'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle, Key, MessageCircle, ShieldCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [channel, setChannel] = useState<'email' | 'sms' | ''>('')
  const [masked, setMasked] = useState('')
  const [resendIn, setResendIn] = useState(0)

  const startResendTimer = () => {
    setResendIn(60)
    const int = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) { clearInterval(int); return 0 }
        return s - 1
      })
    }, 1000)
  }

  const requestOtp = async () => {
    if (!identifier.trim()) { setError('Email or phone required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/wavecore/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })
      const data = await res.json()
      if (res.ok) {
        setChannel(data.channel || '')
        setMasked(data.destination || '')
        setStep(2)
        startResendTimer()
      } else {
        setError(data.error || 'Unable to send code')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally { setLoading(false) }
  }

  const resendOtp = async () => {
    if (resendIn > 0) return
    await requestOtp()
  }

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/wavecore/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      })
      const data = await res.json()
      if (res.ok && data.verified) {
        setResetToken(data.resetToken)
        setStep(3)
        setError('')
      } else {
        setError(data.error || 'Invalid or expired code')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally { setLoading(false) }
  }

  const completeReset = async () => {
    if (!newPassword || !confirmPassword) { setError('All fields required'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/wavecore/auth/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => { window.location.href = '/wavecore-erp/auth/login' }, 2000)
      } else {
        setError(data.error || 'Unable to update password')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally { setLoading(false) }
  }

  const dot = (s: number) => (
    <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-blue-500' : 'bg-slate-700'}`} style={{ width: '60px' }} />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        {success ? (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Password Updated</h1>
            <p className="text-slate-400 mb-6">Redirecting to login...</p>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={48} height={48} className="rounded-xl object-cover shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold text-white">Reset Password</h1>
                <p className="text-xs text-slate-400">WaveCore ERP</p>
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3].map(dot)}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 text-center">
                  Enter your email or phone number. We&apos;ll send you a 6-digit verification code.
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or Phone Number"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">{error}</div>}
                <button
                  onClick={requestOtp}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 text-center">
                  A 6-digit code was sent to <strong className="text-white">{masked || (channel === 'email' ? 'your email' : 'your phone')}</strong>.
                </p>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>For your security, do not share this code with anyone. It expires in 10 minutes.</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">{error}</div>}
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Verify Code
                </button>
                <div className="text-center text-xs text-slate-400">
                  Didn&apos;t receive it?{' '}
                  <button
                    onClick={resendOtp}
                    disabled={resendIn > 0 || loading}
                    className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 text-center">Create your new password</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">{error}</div>}
                <button
                  onClick={completeReset}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                  Update Password
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/wavecore-erp/auth/login" className="text-sm text-blue-400 hover:text-blue-300">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}