'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/wavecore-erp" className="inline-flex items-center gap-3 mb-6">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-400/30 shadow-2xl shadow-indigo-500/20">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={56} height={56} className="object-cover" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your WaveCore account</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400">
              <input type="checkbox" className="rounded border-gray-600" /> Remember me
            </label>
            <Link href="/wavecore-erp/auth/forgot-password" className="text-indigo-400 hover:text-indigo-300">Forgot password?</Link>
          </div>

          <Button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold group">
            Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/wavecore-erp/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">Create one</Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Protected by enterprise-grade encryption. Your data is secure.
        </p>
      </div>
    </div>
  )
}