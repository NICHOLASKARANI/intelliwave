'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Crown, ArrowRight, CheckCircle } from 'lucide-react'

export default function ExecutivesLanding() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', location: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/executives/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
      setMessage('Application submitted! You will be notified once approved.')
    } else {
      setMessage(data.error || 'Application failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        {/* Left — Hero */}
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-sm mb-6 border border-amber-500/30">
            <Crown className="w-4 h-4" /> Executive Program
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            Become an <span className="text-amber-400">IntelliWavve AI Executive Leader</span>
          </h1>
          <p className="text-lg text-slate-300 mb-8">
            Earn KSh 3,000 to KSh 20,000 monthly by bringing paying customers to WaveCore ERP and WavveMarket.
          </p>

          <div className="space-y-4 mb-8">
            {[
              { level: '1', users: '30+ paying users', reward: 'KSh 3,000/month' },
              { level: '2', users: '60+ paying users', reward: 'KSh 8,000/month' },
              { level: '3', users: '100+ paying users', reward: 'KSh 20,000/month' },
            ].map((l) => (
              <div key={l.level} className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-amber-400">
                  L{l.level}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{l.users}</p>
                  <p className="text-amber-400 font-semibold">{l.reward}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-400">
            Already a leader? <Link href="/executives/login" className="text-amber-400 hover:underline">Log in here</Link>
          </p>
        </div>

        {/* Right — Application Form */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Apply Now</h2>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Application Submitted</h3>
              <p className="text-slate-400 mb-6">{message}</p>
              <Link href="/executives/login" className="inline-block px-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-bold">
                Go to Login <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className="p-3 rounded-lg bg-red-900/30 text-red-400 border border-red-800 text-sm">{message}</div>
              )}
              <input type="text" placeholder="Full Name" required
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              <input type="email" placeholder="Email Address" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              <input type="tel" placeholder="Phone (e.g. +254...)" required
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              <input type="text" placeholder="Location (e.g. Nairobi)" required
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              <input type="password" placeholder="Password (min 8 characters)" required minLength={8}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-bold disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <p className="text-xs text-slate-500 text-center">
                By applying, you agree to our program terms and commission rules.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}