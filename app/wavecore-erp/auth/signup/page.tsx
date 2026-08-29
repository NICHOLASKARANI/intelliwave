'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Mail, Lock, Phone, Eye, EyeOff, Loader2,
  Shield, Globe, Zap, ArrowRight, User, CheckCircle,
  Building2, Sparkles, Server, Clock, BadgeCheck
} from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const checkPasswordStrength = (pass: string) => {
    let strength = 0
    if (pass.length >= 8) strength++
    if (/[A-Z]/.test(pass)) strength++
    if (/[a-z]/.test(pass)) strength++
    if (/[0-9]/.test(pass)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) strength++
    return strength
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordStrength(checkPasswordStrength(value))
  }

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      setError('All fields are required')
      return
    }
    if (passwordStrength < 4) {
      setError('Password must include uppercase, lowercase, number, and special character')
      return
    }
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
        setTimeout(() => {
          window.location.href = '/wavecore-erp/subscription'
        }, 2000)
      } else {
        setError(data.error || 'Signup failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']

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
            <h1 className="text-2xl font-bold text-white mb-2">Account Created!</h1>
            <p className="text-slate-400 mb-6">Redirecting to subscription setup...</p>
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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

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
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Password"
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
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level} className={`h-1 flex-1 rounded-full ${level <= passwordStrength ? strengthColors[passwordStrength] : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{strengthLabels[passwordStrength]}</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-5 h-5" /></>
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
                <li>• Rate limiting</li>
                <li>• Password hashing (bcrypt)</li>
              </ul>
            </div>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                <Link href="/wavecore-erp/auth/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                Forgot Password?
              </Link>
              <p className="text-sm text-slate-400 mt-2">
                Already have an account??{' '}
                <Link href="/wavecore-erp/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}