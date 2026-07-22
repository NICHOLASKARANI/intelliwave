'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Brain, BarChart3, Shield, Zap, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const derivPartnerUrl = process.env.NEXT_PUBLIC_DERIV_PARTNER_URL || 'https://partner-tracking.deriv.com/click?a=50987&o=1&c=3&link_id=1'

const highlights = [
  { icon: Brain, title: 'AI-Powered Signals', desc: 'Machine learning models generate real-time trading signals.' },
  { icon: BarChart3, title: 'Professional Charts', desc: '100+ indicators with multi-timeframe analysis.' },
  { icon: Shield, title: 'Risk Management', desc: 'Automated stop-loss and exposure monitoring.' },
  { icon: Zap, title: 'Automated Trading', desc: 'Algorithmic bots that trade 24/7.' },
]

export function ITISShowcase() {
  return (
    <section className="py-28 bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(34,197,94,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Flagship Product</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              IntelliWavve{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">Trader Intelligence</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Enterprise AI-powered trading platform. Advanced analytics, automated strategies, 
              and real-time market insights — powered by Deriv&apos;s regulated brokerage.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {highlights.map((h) => { const Icon = h.icon; return (
                <div key={h.title} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Icon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div><p className="text-white font-semibold text-sm">{h.title}</p><p className="text-gray-400 text-xs">{h.desc}</p></div>
                </div>
              )})}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/itis">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl shadow-green-500/25 font-semibold group">
                  Explore ITIS <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href={derivPartnerUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/15 text-white hover:bg-white/5 backdrop-blur-xl font-semibold">
                  Start Trading
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden border-2 border-green-500/20 shadow-2xl shadow-green-500/10">
            <div className="aspect-[4/3] bg-gradient-to-br from-green-900/50 to-slate-900/50 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
                <p className="text-green-400 font-mono text-lg mb-2">ITIS Dashboard</p>
                <div className="grid grid-cols-3 gap-3">
                  {['EUR/USD', 'BTC/USD', 'Gold'].map((pair) => (
                    <div key={pair} className="p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white">{pair}<br /><span className="text-green-400">+1.2%</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-bold">Live Market Preview</p>
              <p className="text-green-400 text-sm">Powered by Deriv • Licensed Broker</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}