'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Mail, Lock, Phone, Eye, EyeOff, Loader2, Sparkles,
  Shield, Globe, Zap, ArrowRight, User, CheckCircle
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

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google'
  }

  const handleFacebookSignup = () => {
    window.location.href = '/api/auth/facebook'
  }

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      setError('All fields are required')
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
        setError(data.error || 'Signup failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative flex items-center justify-center p-4 overflow-hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-neutral-950" />
      <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-indigo-500/10 rounded-full animate-spin" style={{ animationDuration: '60s' }} />

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={64} height={64} className="rounded-2xl mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
            <p className="text-neutral-400 mt-1">Join IntelliWavve ERP</p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-neutral-400 mb-4">Redirecting to subscription...</p>
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {/* Social Login */}
              <div className="space-y-3 mb-6">
                {/* Google Button - Real Logo */}
                <button onClick={handleGoogleSignup}
                  className="w-full py-3 rounded-xl bg-white text-neutral-800 font-medium hover:shadow-lg transition-all flex items-center justify-center gap-3">
                  <svg viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Facebook Button - Real Logo */}
                <button onClick={handleFacebookSignup}
                  className="w-full py-3 rounded-xl bg-[#1877F2] text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-3">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-neutral-500">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm mb-4 text-center">
                  {error}
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Full Name" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Email Address" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Phone Number" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Password" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="w-4 h-4 text-neutral-500" /> : <Eye className="w-4 h-4 text-neutral-500" />}
                  </button>
                </div>

                <button onClick={handleSignup} disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {loading ? 'Creating...' : 'Create Account'}
                </button>

                <p className="text-center text-sm text-neutral-400">
                  Already have an account?{' '}
                  <Link href="/wavecore-erp/auth/login" className="text-indigo-400 font-medium">Sign In</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}