'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, ArrowRight, CheckCircle, Clock, Trophy, Zap } from 'lucide-react'

export default function ExecutivesLanding() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', location: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  // ─── 7-Day 100-User Sprint Countdown ───
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    // Sprint ends 7 days from first visit (persisted in localStorage so it doesn't reset)
    const KEY = 'iw_sprint_deadline'
    let deadline = localStorage.getItem(KEY)
    if (!deadline) {
      deadline = String(Date.now() + 7 * 24 * 60 * 60 * 1000)
      localStorage.setItem(KEY, deadline)
    }
    const endTime = parseInt(deadline, 10)

    const tick = () => {
      const diff = Math.max(0, endTime - Date.now())
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

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
      <div className="max-w-6xl mx-auto">

        {/* ═══ 7-DAY 100-USER SPRINT — LIVE COUNTDOWN ═══ */}
        <div className="mb-12 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-amber-400/50 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-6 h-6 text-amber-400" />
            <span className="text-sm font-bold text-amber-300 uppercase tracking-widest">
              Live Sprint — Limited Time
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-center text-white mb-2">
            7-Day 100-User Sprint
          </h2>
          <p className="text-center text-slate-300 mb-6 max-w-2xl mx-auto">
            First Executive to onboard 100 paying subscribers in 7 days unlocks{' '}
            <span className="text-amber-400 font-bold">KSh 20,000 bonus cash</span> — on top of your monthly tier reward.
          </p>

          <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-xl mx-auto">
            {[
              { label: 'DAYS', value: timeLeft.days },
              { label: 'HRS', value: timeLeft.hours },
              { label: 'MIN', value: timeLeft.minutes },
              { label: 'SEC', value: timeLeft.seconds },
            ].map((t) => (
              <div key={t.label} className="bg-black/40 rounded-2xl p-3 md:p-4 border border-amber-400/30 text-center">
                <div className="text-2xl md:text-4xl font-extrabold text-white tabular-nums">
                  {String(t.value).padStart(2, '0')}
                </div>
                <div className="text-[10px] md:text-xs text-amber-300 font-bold mt-1 tracking-widest">
                  {t.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Sprint ends automatically — no extensions</span>
          </div>
        </div>

        {/* ═══ LEADERBOARD ═══ */}
        <div className="mb-12 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl md:text-2xl font-bold text-white">Top Executives</h3>
            <span className="ml-auto text-xs text-slate-500">Live rankings</span>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Leaderboard updates as Executives onboard paying users. Be the first to hit L3.
          </p>
          <div className="space-y-2">
            {[
              { rank: 1, name: 'Be the first', subs: 0, level: '—' },
              { rank: 2, name: 'Your name here', subs: 0, level: '—' },
              { rank: 3, name: 'Your name here', subs: 0, level: '—' },
            ].map((e) => (
              <div key={e.rank} className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-sm">
                  {e.rank}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{e.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{e.subs} subs</p>
                  <p className="text-xs text-amber-400 font-bold">{e.level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ EXISTING GRID (PRESERVED) ═══ */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
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
    </div>
  )
}