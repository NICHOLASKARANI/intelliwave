'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Phone, Loader2, CheckCircle, Shield, Globe, Zap, ArrowRight, BadgeCheck, Key, MessageCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1=identifier, 2=OTP, 3=reset
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [returnedOtp, setReturnedOtp] = useState('')

  const handleRequestOTP = async () => {
    if (!identifier) {
      setError('Email or phone number is required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })
      const data = await res.json()
      if (res.ok) {
        setReturnedOtp(data.otp || '')
        setResetToken(data.resetToken || '')
        setStep(2)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }
    if (otp === returnedOtp) {
      setStep(3)
      setError('')
    } else {
      setError('Invalid OTP. Please try again.')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
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
        {success ? (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
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

            {/* Step indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-blue-500' : 'bg-slate-700'}`} style={{ width: '60px' }} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 text-center">Enter your email or phone number to receive OTP</p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or Phone Number"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">{error}</div>}
                <button onClick={handleRequestOTP} disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                  Send OTP
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 text-center">Enter the 6-digit OTP sent to {identifier}</p>
                {returnedOtp && (
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs">
                    Test OTP: <strong>{returnedOtp}</strong> (Remove in production)
                  </div>
                )}
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-300 text-sm">{error}</div>}
                <button onClick={handleVerifyOTP}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Verify OTP
                </button>
                <button onClick={() => setStep(1)} className="w-full text-sm text-slate-400 hover:text-white">
                  ← Change email/phone
                </button>
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
                <button onClick={handleResetPassword} disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                  Reset Password
                </button>
              </div>
            )}

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