'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Mail, Lock, Phone, Eye, EyeOff, Loader2, Shield, Globe, Zap,
  ArrowRight, User, CheckCircle2, XCircle, Sparkles, Server, Clock,
  BadgeCheck, TrendingUp, Users, Award, Check,
} from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // === VALIDATION HELPERS (client-side, non-blocking) ===
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
  const isValidPhone = (v: string) => /^(\+?254|0)[17]\d{8}$/.test(v.trim().replace(/[\s-]/g, ''))
  const isValidName = (v: string) => v.trim().length >= 2

  const pwChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  const pwPassCount = Object.values(pwChecks).filter(Boolean).length
  const pwStrength = pwPassCount

  const pwStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][pwStrength] || ''
  const pwStrengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'][pwStrength] || 'bg-slate-700'

  const handleSignup = async () => {
    setTouched({ name: true, email: true, phone: true, password: true })

    if (!isValidName(name)) { setError('Please enter your full name (at least 2 characters)'); return }
    if (!isValidEmail(email)) { setError('Please enter a valid email address'); return }
    if (!isValidPhone(phone)) { setError('Please enter a valid Kenyan phone number (e.g. 0712345678)'); return }
    if (pwStrength < 4) { setError('Password must include uppercase, lowercase, number, and special character'); return }
    if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => { window.location.href = '/wavecore-erp/subscription' }, 2000)
      } else {
        setError(data.error || 'Signup failed. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const trustBadges = [
    { label: 'SOC 2 Type II', icon: Shield },
    { label: 'ISO 27001', icon: Award },
    { label: 'GDPR', icon: Globe },
    { label: 'Kenya DPA', icon: BadgeCheck },
  ]

  const stats = [
    { value: '5,000+', label: 'Businesses' },
    { value: '100+', label: 'Countries' },
    { value: '99.99%', label: 'Uptime' },
    { value: '< 50ms', label: 'Response' },
  ]

  const highlights = [
    { icon: Sparkles, title: 'Free 14-day trial', desc: 'No credit card required' },
    { icon: Server, title: 'Full ERP suite', desc: 'HR · Projects · Manufacturing · Helpdesk · Marketplace' },
    { icon: TrendingUp, title: 'AI-powered insights', desc: 'Predictive analytics built into every module' },
    { icon: Clock, title: '5-minute setup', desc: 'Be productive before your coffee gets cold' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* LEFT: Hero panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full filter blur-3xl" />

        <div className="relative z-10 w-full flex flex-col p-12 xl:p-16">
          {/* Logo */}
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

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/10 text-xs text-indigo-200 font-bold w-fit mb-6">
              <Sparkles className="w-3 h-3 text-amber-400" /> Now with WaveMarket + AI Copilot
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Run your entire business<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                from one platform.
              </span>
            </h1>

            <p className="text-lg text-slate-300 mb-10 max-w-xl">
              Join thousands of enterprises using IntelliWavve to manage HR, projects, manufacturing, helpdesk, and marketplace — with AI-native intelligence built into every workflow.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-10">
              {highlights.map(h => (
                <div key={h.title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                    <h.icon className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{h.title}</p>
                    <p className="text-xs text-slate-400">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/10">
              {stats.map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges footer */}
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

      {/* RIGHT: Form panel */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile hero background */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full filter blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          {success ? (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 border border-slate-700/50 shadow-2xl text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to IntelliWavve</h1>
              <p className="text-slate-400 mb-6 text-sm">Your account is ready. Redirecting to subscription setup…</p>
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 lg:p-10 border border-slate-700/50 shadow-2xl">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={44} height={44} className="rounded-xl shadow-lg" />
                <div>
                  <p className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    IntelliWavve
                  </p>
                  <p className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase">
                    WaveCore ERP
                  </p>
                </div>
              </div>

              <div className="mb-7">
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">Create your account</h2>
                <p className="text-sm text-slate-400">Free 14-day trial · No credit card required</p>
              </div>

              <div className="space-y-4">
                {/* NAME */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, name: true }))}
                      placeholder="John Doe"
                      autoComplete="name"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        touched.name && name && !isValidName(name) ? 'border-red-500/50' : 'border-slate-600/50'
                      }`}
                    />
                    {touched.name && name && isValidName(name) && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, email: true }))}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        touched.email && email && !isValidEmail(email) ? 'border-red-500/50' : 'border-slate-600/50'
                      }`}
                    />
                    {touched.email && email && isValidEmail(email) && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* PHONE */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                      placeholder="0712 345 678"
                      autoComplete="tel"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        touched.phone && phone && !isValidPhone(phone) ? 'border-red-500/50' : 'border-slate-600/50'
                      }`}
                    />
                    {touched.phone && phone && isValidPhone(phone) && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, password: true }))}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
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

                  {/* Strength meter */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              level <= pwStrength ? pwStrengthColor : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex justify-between">
                        <span>Strength</span>
                        <span className={`font-bold ${
                          pwStrength >= 5 ? 'text-green-400' :
                          pwStrength >= 4 ? 'text-lime-400' :
                          pwStrength >= 3 ? 'text-yellow-400' :
                          pwStrength >= 2 ? 'text-orange-400' : 'text-red-400'
                        }`}>{pwStrengthLabel}</span>
                      </p>
                    </div>
                  )}

                  {/* Requirements checklist */}
                  {password && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
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
                            {pass ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-slate-600 flex-shrink-0" />
                            )}
                            <span className={pass ? 'text-slate-300' : 'text-slate-500'}>{req.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-400 leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 font-medium">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 font-medium">Privacy Policy</Link>
                  </span>
                </label>

                {/* Error banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Trust mini-strip */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 text-center">
                  Enterprise-grade security
                </p>
                <div className="flex justify-center gap-4 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> 256-bit AES</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> bcrypt</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Rate-limited</span>
                </div>
              </div>

              {/* Footer links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link href="/wavecore-erp/auth/login" className="text-indigo-400 hover:text-indigo-300 font-bold">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Mobile trust badges */}
          <div className="lg:hidden mt-6 flex justify-center gap-3 flex-wrap">
            {trustBadges.map(b => (
              <div key={b.label} className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                <b.icon className="w-3 h-3" />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}