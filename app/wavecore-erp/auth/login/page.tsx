'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Mail, Lock, Eye, EyeOff, Loader2,
  Shield, Globe, Zap, ArrowRight, CheckCircle,
  BadgeCheck, Key, Clock
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        setTimeout(() => {
          window.location.href = '/wavecore-erp'
        }, 1500)
      } else {
        setError(data.error || 'Login failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-emerald-600/10 rounded-full filter blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md">
        {success ? (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back!</h1>
            <p className="text-slate-400 mb-6">Redirecting to your dashboard...</p>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={48} height={48} className="rounded-xl object-cover shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold text-white">WaveCore ERP</h1>
                <p className="text-xs text-slate-400">Enterprise Resource Planning</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex justify-center gap-4 mb-6 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> Secure</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Global</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Fast</span>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Signing In...</>
                ) : (
                  <>Sign In <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>

            {/* Security info */}
            <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-xs text-slate-400 flex items-center gap-2 mb-2">
                <BadgeCheck className="w-4 h-4 text-green-500" /> Enterprise Security
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• 256-bit encryption</li>
                <li>• JWT authentication</li>
                <li>• Brute-force protection</li>
                <li>• Secure session (24h)</li>
              </ul>
            </div>

            {/* Signup link */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/wavecore-erp/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                  Create Account
                </Link>
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Sessions expire after 24 hours
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}