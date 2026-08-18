'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Mail, Lock, Phone, Eye, EyeOff, Chrome } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentStep, setPaymentStep] = useState(false)

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
        // Signup successful - redirect to payment
        setPaymentStep(true)
        setTimeout(() => {
          window.location.href = '/wavecore-erp/subscription'
        }, 2000)
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    // Google OAuth flow
    window.location.href = '/api/auth/google'
  }

  const handleFacebookSignup = () => {
    // Facebook OAuth flow
    window.location.href = '/api/auth/facebook'
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/images/Wavecore.jpeg" alt="IntelliWavve" width={64} height={64} className="rounded-xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-1">Join IntelliWavve - World's Largest Software Company</p>
        </div>

        {paymentStep ? (
          <div className="bg-green-50 dark:bg-green-950 rounded-2xl border border-green-200 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Chrome className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-4">
              Redirecting to payment... KSh 500 to access WaveCore ERP
            </p>
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {/* Social Login */}
            <div className="space-y-2">
              <button onClick={handleGoogleSignup}
                className="w-full py-3 rounded-xl border flex items-center justify-center gap-2 hover:bg-neutral-50">
                <Chrome className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">Continue with Google</span>
              </button>
              <button onClick={handleFacebookSignup}
                className="w-full py-3 rounded-xl bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700">
                <span className="text-sm font-medium">f</span>
                <span className="text-sm font-medium">Continue with Facebook</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border" placeholder="Enter your name" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border" placeholder="Enter your email" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border" placeholder="e.g., 0712345678" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border" placeholder="Create a password" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <button onClick={handleSignup} disabled={loading || !name || !email || !phone || !password}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Account Now'}
            </button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/wavecore-erp/auth/login" className="text-blue-600 font-medium">
                Login
              </Link>
            </p>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to pay KSh 500/month for WaveCore ERP access
            </p>
          </div>
        )}
      </div>
    </div>
  )
}