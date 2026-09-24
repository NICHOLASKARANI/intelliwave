'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Mail, Loader2, CheckCircle2, Key, MessageCircle, ShieldCheck,
  ArrowLeft, Shield, Globe, Award, BadgeCheck, Sparkles, Lock,
  Eye, EyeOff, Check, XCircle, ArrowRight,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [channel, setChannel] = useState<'email' | 'sms' | ''>('')
  const [masked, setMasked] = useState('')
  const [resendIn, setResendIn] = useState(0)

  const pwChecks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  }
  const pwPassCount = Object.values(pwChecks).filter(Boolean).length

  const startResendTimer = () => {
    setResendIn(60)
    const int = setInterval(() => {
      setResendIn(s => { if (s <= 1) { clearInterval(int); return 0 } return s - 1 })
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
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const resendOtp = async () => { if (resendIn > 0) return; await requestOtp() }

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
      if (res.ok && data.verified) { setResetToken(data.resetToken); setStep(3); setError('') }
      else { setError(data.error || 'Invalid or expired code') }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const completeReset = async () => {
    if (!newPassword || !confirmPassword) { setError('All fields required'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (pwPassCount < 4) { setError('Password must include uppercase, lowercase, number, and special character'); return }
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
      } else { setError(data.error || 'Unable to update password') }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  const trustBadges = [
    { label: 'SOC 2 Type II', icon: Shield },
    { label: 'ISO 27001', icon: Award },
    { label: 'GDPR', icon: Globe },
    { label: 'Kenya DPA', icon: BadgeCheck },
  ]

  const stepInfo = [
    { n: 1, label: 'Identify' },
    { n: 2, label: 'Verify' },
    { n: 3, label: 'Reset' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* LEFT hero */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full filter blur-3xl" />

        <div className="relative z-10 w-full flex flex-col p-12 xl:p-16">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={48} height={48} className="rounded-xl shadow-lg" />
            <div>
              <p className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                IntelliWavve
              </p>
              <p className="text-[10px] text-indigo-300/70 font-semibold tracking-widest uppercase">
                Global AI Company
              </p>
            </div>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/10 text-xs text-indigo-200 font-bold w-fit mb-6">
              <ShieldCheck className="w-3 h-3 text-green-400" /> Secure password recovery
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Forgot your password?<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                We&apos;ve got you.
              </span>
            </h1>

            <p className="text-lg text-slate-300 mb-10 max-w-xl">
              Verify your identity with a secure one-time code, then set a new password. Your account stays protected throughout the process.
            </p>

            <div className="space-y-4">
              {stepInfo.map(s => (
                <div key={s.n} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                    step >= s.n
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white/5 border border-white/10 text-slate-500'
                  }`}>
                    {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${step >= s.n ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
                    <p className="text-xs text-slate-500">
                      {s.n === 1 && 'Enter your email or phone'}
                      {s.n === 2 && 'Enter the 6-digit code we send you'}
                      {s.n === 3 && 'Choose your new password'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-8 border-t border-white/10">
            {trustBadges.map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                <b.icon className="w-3.5 h-3.5 text-indigo-400" />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 lg:p-12 relative">
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full filter blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          {success ? (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 border border-slate-700/50 shadow-2xl text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Password updated</h1>
              <p className="text-slate-400 mb-6 text-sm">Redirecting you to sign in…</p>
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-slate-700/50 shadow-2xl">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={44} height={44} className="rounded-xl shadow-lg" />
                <div>
                  <p className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    IntelliWavve
                  </p>
                  <p className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase">
                    Password Reset
                  </p>
                </div>
              </div>

              <Link href="/wavecore-erp/auth/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-4">
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </Link>

              {/* Step progress */}
              <div className="flex gap-2 mb-7">
                {[1, 2, 3].map(n => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-all ${step >= n ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-700'}`} />
                ))}
              </div>

              {step === 1 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Reset your password</h2>
                    <p className="text-sm text-slate-400">Enter the email or phone registered to your account</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && requestOtp()}
                        placeholder="you@company.com or 0712345678"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={requestOtp}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-2xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                      Send verification code
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Enter verification code</h2>
                    <p className="text-sm text-slate-400">
                      We sent a 6-digit code to <strong className="text-white">{masked || (channel === 'email' ? 'your email' : 'your phone')}</strong>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex gap-2">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Never share this code. It expires in 10 minutes.</span>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                      placeholder="● ● ● ● ● ●"
                      maxLength={6}
                      autoFocus
                      className="w-full px-4 py-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white text-center text-3xl tracking-[0.6em] font-bold placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />

                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={verifyOtp}
                      disabled={loading || otp.length < 6}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-2xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Verify code
                    </button>

                    <div className="text-center text-xs text-slate-400">
                      Didn&apos;t receive it?{' '}
                      <button
                        onClick={resendOtp}
                        disabled={resendIn > 0 || loading}
                        className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 font-bold"
                      >
                        {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Set new password</h2>
                    <p className="text-sm text-slate-400">Choose a strong password to protect your account</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="New password"
                        autoFocus
                        className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      {confirmPassword && confirmPassword === newPassword && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>

                    {newPassword && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { k: 'length', label: '8+ characters' },
                          { k: 'upper', label: 'Uppercase' },
                          { k: 'lower', label: 'Lowercase' },
                          { k: 'number', label: 'Number' },
                          { k: 'special', label: 'Special char' },
                        ].map(req => {
                          const pass = pwChecks[req.k as keyof typeof pwChecks]
                          return (
                            <div key={req.k} className="flex items-center gap-1.5 text-[11px]">
                              {pass ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                              <span className={pass ? 'text-slate-300' : 'text-slate-500'}>{req.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={completeReset}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:shadow-2xl hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                      Update password
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}