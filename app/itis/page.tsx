'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, TrendingUp, Shield, Zap, Globe, BarChart3, 
  Brain, Lock, Cloud, Smartphone, CheckCircle, Star, Play,
  Download, Users, LineChart, Activity, Bot, Cpu, Sparkles,
  HeadphonesIcon, BadgeCheck, RefreshCw, Eye, Target, Award
} from 'lucide-react'
import Link from 'next/link'

const derivPartnerUrl = process.env.NEXT_PUBLIC_DERIV_PARTNER_URL || 'https://partner-tracking.deriv.com/click?a=50987&o=1&c=3&link_id=1'

// Animated Counter
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  useEffect(() => {
    if (isInView && !hasStarted) {
      setHasStarted(true)
      let startTime: number
      let animationId: number
      const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        setCount(Math.floor(easeOutExpo(progress) * end))
        if (progress < 1) animationId = requestAnimationFrame(animate)
      }
      animationId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationId)
    }
  }, [isInView, end, duration, hasStarted])
  return (<span ref={ref} className="tabular-nums">{prefix}{count.toLocaleString()}{suffix}</span>)
}

const features = [
  { icon: Brain, title: 'AI Trading Intelligence', desc: 'Machine learning models that analyze markets and generate trading signals in real-time.' },
  { icon: BarChart3, title: 'Professional Charting', desc: 'Advanced charting with 100+ indicators, drawing tools, and multi-timeframe analysis.' },
  { icon: Activity, title: 'Live Portfolio Tracking', desc: 'Real-time portfolio valuation, P&L tracking, and performance analytics.' },
  { icon: Shield, title: 'Risk Management', desc: 'Automated risk controls, stop-loss management, and exposure monitoring.' },
  { icon: Zap, title: 'Automated Trading', desc: 'Algorithmic trading bots that execute strategies 24/7 across global markets.' },
  { icon: RefreshCw, title: 'Strategy Backtesting', desc: 'Test trading strategies against historical data with detailed performance reports.' },
  { icon: Eye, title: 'Paper Trading', desc: 'Practice trading with virtual funds in real market conditions before going live.' },
  { icon: Users, title: 'Copy Trading', desc: 'Follow and replicate successful traders strategies automatically.' },
  { icon: Bot, title: 'AI Strategy Builder', desc: 'Visual strategy builder powered by AI — no coding required.' },
  { icon: LineChart, title: 'Market Analytics', desc: 'Deep market insights, sentiment analysis, and trend detection.' },
  { icon: Target, title: 'Real-Time Alerts', desc: 'Customizable price alerts, news notifications, and signal alerts.' },
  { icon: Globe, title: 'Global Markets', desc: 'Trade forex, commodities, indices, crypto, and synthetic indices worldwide.' },
  { icon: Lock, title: 'Enterprise Security', desc: 'SSL encryption, 2FA, cold storage, and SOC 2 compliant infrastructure.' },
  { icon: Cloud, title: 'Cloud Platform', desc: 'Access your trading dashboard from anywhere on any device.' },
  { icon: Smartphone, title: 'Mobile Trading', desc: 'Full trading capability on iOS and Android with push notifications.' },
]

const stats = [
  { value: 100, suffix: '+', label: 'Tradeable Assets' },
  { value: 99.99, suffix: '%', label: 'Platform Uptime' },
  { value: 10, suffix: 'ms', label: 'Execution Speed' },
  { value: 24, suffix: '/7', label: 'Market Access' },
]

const trustBadges = [
  { icon: Shield, label: 'Enterprise Security' },
  { icon: Lock, label: 'SSL Encrypted' },
  { icon: BadgeCheck, label: 'Licensed Broker' },
  { icon: Award, label: 'AI-Powered' },
  { icon: Cloud, label: 'Cloud Platform' },
  { icon: HeadphonesIcon, label: '24/7 Support' },
]

const pricingPlans = [
  { name: 'Starter', price: 'Free', features: ['Demo Account', 'Basic Charts', '5 Indicators', 'Paper Trading', 'Email Support'], cta: 'Start Free' },
  { name: 'Professional', price: 'KSh 2,500/mo', features: ['Live Account', 'Advanced Charts', '100+ Indicators', 'AI Signals', 'Priority Support', 'Automated Trading'], cta: 'Get Started', popular: true },
  { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Dedicated Server', 'Custom AI Models', 'API Access', 'White Label', 'SLA Guarantee'], cta: 'Contact Sales' },
]

const faqs = [
  { q: 'What is IntelliWavve Trader Intelligence System?', a: 'ITIS is an AI-powered trading platform that combines advanced analytics, automated trading, and risk management tools for professional traders.' },
  { q: 'Do I need a Deriv account?', a: 'Yes, ITIS integrates with Deriv as our licensed broker partner. You can create a Deriv account through our partner link.' },
  { q: 'Is my money safe?', a: 'Absolutely. Deriv is a regulated broker licensed by multiple financial authorities. Funds are held in segregated accounts.' },
  { q: 'Can I try ITIS for free?', a: 'Yes! Our Starter plan includes a free demo account with virtual funds for paper trading.' },
  { q: 'What markets can I trade?', a: 'Forex, commodities, cryptocurrencies, stocks, synthetic indices, and more — over 100 assets available.' },
  { q: 'Do you offer mobile trading?', a: 'Yes, ITIS is fully responsive and works on all devices. We also offer dedicated iOS and Android apps.' },
]

export default function ITISPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div className="overflow-hidden">
      {/* ========================================== HERO ========================================== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-slate-950/80 to-slate-950" />
        
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(34,197,94,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        {/* Floating trading elements */}
        <motion.div animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-20 right-20 w-32 h-32 rounded-2xl bg-green-500/10 backdrop-blur-xl border border-green-500/20 flex items-center justify-center">
          <TrendingUp className="w-12 h-12 text-green-400" />
        </motion.div>
        <motion.div animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-40 left-20 w-24 h-24 rounded-2xl bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 flex items-center justify-center">
          <Activity className="w-10 h-10 text-blue-400" />
        </motion.div>
        <motion.div animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} className="absolute top-1/3 left-10 w-20 h-20 rounded-2xl bg-purple-500/10 backdrop-blur-xl border border-purple-500/20 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-purple-400" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-green-500/10 backdrop-blur-xl border border-green-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">IntelliWavve Trader Intelligence System</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-[1.08]">
              Trade Smarter{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">with AI</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Enterprise AI-powered trading intelligence. Advanced analytics, automated strategies, 
              and real-time market insights — all in one platform.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <a href={derivPartnerUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl shadow-green-500/25 font-semibold group">
                  Start Trading Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/15 text-white hover:bg-white/5 backdrop-blur-xl font-semibold">
                  Request Enterprise Demo
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                  <div className="text-3xl md:text-4xl font-bold text-white">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================== TRUST BADGES ========================================== */}
      <section className="py-8 bg-white dark:bg-neutral-950 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6">
            {trustBadges.map((badge) => { const Icon = badge.icon; return (
              <div key={badge.label} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Icon className="w-4 h-4 text-green-500" />{badge.label}
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* ========================================== FEATURES GRID ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">
              Everything You Need to Trade
            </h2>
            <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-3xl mx-auto">
              Professional-grade tools powered by artificial intelligence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => { const Icon = feature.icon; return (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.03 }}
                whileHover={{ y: -4 }} className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-neutral-500">{feature.desc}</p>
              </motion.div>
            )})}
          </div>
        </div>
      </section>

      {/* ========================================== PRICING ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-neutral-900 dark:text-white tracking-tight">Simple Pricing</h2>
            <p className="text-xl text-neutral-500 dark:text-neutral-400">Start free, upgrade as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`relative p-8 rounded-2xl border-2 ${plan.popular ? 'border-green-500 bg-green-50 dark:bg-green-950/20 shadow-xl scale-105' : 'border-neutral-200 dark:border-neutral-800'} bg-white dark:bg-neutral-950`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</div>}
                <h3 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-white">{plan.name}</h3>
                <div className="text-4xl font-bold text-green-600 mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" />{f}</li>))}
                </ul>
                <a href={derivPartnerUrl} target="_blank" rel="noopener noreferrer">
                  <Button className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-500' : ''}`}>{plan.cta}</Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== FAQ ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-neutral-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">{faq.q}<ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" /></summary>
                <p className="px-5 pb-5 text-neutral-500 text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== CTA ========================================== */}
      <section className="py-32 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to Trade Smarter?</h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">Join thousands of traders using IntelliWavve AI for smarter trading decisions.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={derivPartnerUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100 px-10 py-7 text-lg rounded-2xl font-bold shadow-2xl group">
                Start Trading Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 font-bold">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}