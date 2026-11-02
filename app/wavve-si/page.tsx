'use client'
import { useState, useMemo, useEffect } from 'react'
import { WAVVE_SI_SYSTEMS, TIER_LABELS, type Tier } from '@/lib/wavve-si/modules'
import { Search, ArrowRight, Sparkles, Globe, Shield, Zap, Layers, LogIn, UserPlus } from 'lucide-react'

export default function Page() {
  const [search, setSearch] = useState('')
  const [activeTier, setActiveTier] = useState<Tier | 'all'>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const filtered = useMemo(() => {
    return WAVVE_SI_SYSTEMS.filter(s => {
      const q = search.toLowerCase()
      const matchesSearch = q === '' || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      const matchesTier = activeTier === 'all' || s.tier === activeTier
      return matchesSearch && matchesTier
    })
  }, [search, activeTier])

  const tiers: (Tier | 'all')[] = ['all', 'core', 'expansion', 'specialist', 'advanced']

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        {mounted && Array.from({ length: 120 }).map((_, i) => {
          const size = i % 3 === 0 ? 'w-1 h-1' : i % 3 === 1 ? 'w-0.5 h-0.5' : 'w-1.5 h-1.5'
          const left = (i * 37) % 100
          const top = (i * 73) % 100
          const delay = (i % 10) * 0.3
          const duration = 2 + (i % 5)
          return (
            <div
              key={i}
              className={`absolute ${size} bg-white rounded-full`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                opacity: 0.4 + (i % 4) * 0.15,
                animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
              }}
            />
          )
        })}
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
      `}</style>

      <div className="sticky top-20 z-40 bg-[#0a0e27]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Wavve SI · World-Class Enterprise Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://www.intelliwavve.com/wavecore-erp/auth/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Sign In
            </a>
            <a href="https://www.intelliwavve.com/wavecore-erp/auth/signup" className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Sign Up
            </a>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-300 font-semibold text-sm mb-8 border border-blue-500/30">
            <Globe className="w-4 h-4" /> Powered by IntelliWavve · Global Enterprise Technology
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-br from-white via-blue-100 to-blue-400 bg-clip-text text-transparent leading-tight">
            Wavve SI
          </h1>
          <p className="text-2xl md:text-3xl text-blue-300 mb-3 font-light tracking-wide">
            Wavve Super Intelligence
          </p>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-2">
            One Ecosystem. 100 Intelligent Systems. Unlimited Possibilities.
          </p>
          <p className="text-base text-slate-400 max-w-2xl mx-auto mb-10">
            The Operating Ecosystem for Modern Organisations. From a duka in Kenya to enterprises in 100+ countries — one platform, every industry, one intelligent future.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <a href="https://www.intelliwavve.com/wavecore-erp/auth/signup" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="https://www.intelliwavve.com/wavecore-erp/auth/login" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 backdrop-blur transition-all flex items-center gap-2">
              <LogIn className="w-5 h-5" /> Sign In
            </a>
            <a href="https://www.intelliwavve.com/wavecore-erp/auth/forgot-password" className="px-6 py-4 text-slate-400 hover:text-white font-semibold rounded-xl transition-all text-sm">
              Forgot password?
            </a>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> SOC 2 Type II</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> ISO 27001</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> GDPR</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Kenya DPA</span>
            <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> 99.99% Uptime</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
          {[{ value: '100', label: 'Management Systems', icon: Layers },{ value: '100+', label: 'Countries Ready', icon: Globe },{ value: '20', label: 'Industries Covered', icon: Sparkles },{ value: '4', label: 'Billing Options', icon: Zap }].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                <Icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-10">
          <div className="relative mb-6 max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="text" placeholder="Search 100 systems by name, industry, or capability..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {tiers.map(t => (
              <button key={t} onClick={() => setActiveTier(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTier === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'}`}>
                {t === 'all' ? 'All 100 Systems' : TIER_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-6 text-center">
          Showing <span className="text-blue-400 font-bold">{filtered.length}</span> of 100 systems
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sys) => (
            <a key={sys.id} href="https://www.intelliwavve.com/wavecore-erp/auth/login" className="block bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-white/10 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-slate-500">#{String(sys.id).padStart(3, '0')}</span>
                <span className="text-xs px-2 py-1 rounded bg-white/10 text-slate-300">{sys.category}</span>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{sys.shortName}</h3>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{sys.description}</p>
              <div className="flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Sign in to access <ArrowRight className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p>No systems match "{search}"</p>
          </div>
        )}

        <div className="mt-20 text-center bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to unlock all 100 systems?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            One subscription. Every industry. Built for small businesses in Kenya and enterprises worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://www.intelliwavve.com/wavecore-erp/auth/signup" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Start Free Trial
            </a>
            <a href="https://www.intelliwavve.com/wavecore-erp/subscription" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 backdrop-blur transition-all">
              View Pricing
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 py-8 text-center text-xs text-slate-500">
        Powered by IntelliWavve · Global Enterprise Technology · From Africa to the World
      </div>
    </div>
  )
}