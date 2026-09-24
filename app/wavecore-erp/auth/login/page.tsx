'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Mail, Lock, Eye, EyeOff, Loader2, Shield, Globe, Zap,
  ArrowRight, CheckCircle2, Sparkles, Server, Clock, BadgeCheck,
  Award, TrendingUp, Users, Fingerprint,
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => { window.location.href = '/wavecore-erp' }, 1500)
      } else {
        setError(data.error || 'Login failed. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally { setLoading(false) }
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
    { icon: Server, title: 'Full ERP suite', desc: 'HR · Projects · Manufacturing · Helpdesk' },
    { icon: TrendingUp, title: 'AI-powered insights', desc: 'Predictive analytics in every module' },
    { icon: Fingerprint, title: 'Bank-grade security', desc: 'SOC 2 · ISO 27001 · GDPR compliant' },
    { icon: Users, title: 'Trusted worldwide', desc: 'Deployed across 100+ countries' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* LEFT: Hero panel */}
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
              <Sparkles className="w-3 h-3 text-amber-400" /> Trusted by 5,000+ enterprises worldwide
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Welcome back to<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                your command center.
              </span>
            </h1>

            <p className="text-lg text-slate-300 mb-10 max-w-xl">
              Sign in to access your entire business — HR, projects, manufacturing, helpdesk, marketplace, and AI-powered analytics — from one unified platform.
            </p>

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

            <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/10">
              {stats.map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{s.label}</p>
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

      {/* RIGHT: Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 lg:p-12 relative">
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full filter blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          {success ? (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 border border-slate-700/50 shadow-2xl text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-slate-400 mb-6 text-sm">Signing you into your dashboard…</p>
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
                    WaveCore ERP
                  </p>
                </div>
              </div>

              <div className="mb-7">
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1">Sign in</h2>
                <p className="text-sm text-slate-400">Access your enterprise workspace</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs uppercase tracking-wide text-slate-400 font-bold">Password</label>
                    <Link href="/wavecore-erp/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="Enter your password"
                      autoComplete="current-password"
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
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-400">Keep me signed in for 24 hours</span>
                </label>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                    <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Signing In…</>
                  ) : (
                    <>Sign In <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 text-center">
                  Enterprise-grade security
                </p>
                <div className="flex justify-center gap-4 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> 256-bit AES</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> JWT</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Rate-limited</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-purple-500" /> 24h session</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Don&apos;t have an account?{' '}
                  <Link href="/wavecore-erp/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-bold">
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}