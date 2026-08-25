'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle, Shield, Globe, Zap, ArrowRight, BadgeCheck, Key, Clock } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState(1) // 1 = email, 2 = reset password

  const handleRequestReset = async () => {
    if (!email) {
      setError('Email is required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setStep(2)
      } else {
        setError(data.error || 'Failed to send reset instructions')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetToken || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/wavecore-erp/auth/login'
        }, 2000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md">
        {success && step === 2 && !resetToken ? (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-slate-400 mb-6">
              We&apos;ve sent password reset instructions to <strong className="text-white">{email}</strong>
            </p>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-left">
              <p className="text-xs text-slate-400 mb-2">Enter the reset token from your email:</p>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Reset token"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">Enter new password:</p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              />
              <p className="text-xs text-slate-500 mt-2">Confirm password:</p>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
              />
              {error && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
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

            <div className="flex justify-center gap-4 mb-6 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> Secure</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Global</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Fast</span>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleRequestReset}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                ) : (
                  <>Send Reset Instructions <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-xs text-slate-400 flex items-center gap-2 mb-2">
                <BadgeCheck className="w-4 h-4 text-green-500" /> Secure Recovery
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Reset token expires in 30 minutes</li>
                <li>• Token sent to your registered email</li>
                <li>• Password must be at least 8 characters</li>
              </ul>
            </div>

            <div className="mt-6 text-center">
              <Link href="/wavecore-erp/auth/login" className="text-sm text-blue-400 hover:text-blue-300">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}