'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { TrustBadges } from '@/components/sections/trust-badges'
import { EnterpriseArchitecture } from '@/components/sections/enterprise-architecture'
import { DigitalTwin } from '@/components/sections/digital-twin'
import { GlobalInfrastructure } from '@/components/sections/global-infrastructure'
import { ExecutiveROI } from '@/components/sections/executive-roi'
import { EnterpriseDashboard } from '@/components/features/enterprise-dashboard'
import { AIProposalGenerator } from '@/components/features/ai-proposal-generator'
import { GlobalActivityFeed } from '@/components/features/global-activity-feed'
import { AICapabilities } from '@/components/sections/ai-capabilities'
import { MissionControl } from '@/components/sections/mission-control'
import { EnterpriseTrust } from '@/components/sections/enterprise-trust'
import { WorldMap } from '@/components/sections/world-map'
import { AnimatedCounters } from '@/components/sections/animated-counters'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Sparkles, Shield, Zap, Globe, 
  Cpu, TrendingUp, CheckCircle, Users, Star,
  Building2, Cloud, Lock, Bot, Satellite
} from 'lucide-react'
import Link from 'next/link'

// Animated Counter Hook
function useAnimatedCounter(end: number, duration: number = 2500, suffix: string = '', prefix: string = '') {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

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
        const easedProgress = easeOutExpo(progress)
        setCount(Math.floor(easedProgress * end))
        if (progress < 1) animationId = requestAnimationFrame(animate)
      }
      animationId = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationId)
    }
  }, [isInView, end, duration, hasStarted])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  return { displayValue: `${prefix}${formatNumber(count)}${suffix}`, ref, isAnimating: hasStarted && count < end }
}

function AnimatedStat({ value, suffix, prefix, label, icon: Icon }: { value: number; suffix: string; prefix: string; label: string; icon: any }) {
  const { displayValue, ref, isAnimating } = useAnimatedCounter(value, 2500, suffix, prefix)

  return (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.05, y: -4 }}
      className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all"
    >
      <Icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
      <div className={`text-3xl md:text-4xl font-bold text-white tabular-nums ${isAnimating ? 'animate-pulse' : ''}`}>
        {displayValue}
      </div>
      <div className="text-sm text-gray-400 mt-2">{label}</div>
    </motion.div>
  )
}

export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  return (
    <div className="overflow-hidden">
      {/* ========================================== HERO SECTION ========================================== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.4) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
        
        {/* Aurora gradient orbs */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2], x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-3xl" 
        />

        {/* Premium rotating rings - THE GLOBE EFFECT */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-blue-500/8"
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-8 rounded-full border border-purple-500/8"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-16 rounded-full border border-cyan-500/8"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-24 rounded-full border border-blue-400/5"
          />
          {/* Glowing dots on rings */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <motion.div
              key={angle}
              className="absolute w-3 h-3 bg-blue-500 rounded-full"
              style={{
                top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 340}px)`,
                left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 340}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: angle / 100 }}
            />
          ))}
        </motion.div>

        {/* Floating tech icons */}
        {[
          { icon: Bot, top: '15%', left: '10%', delay: 0 },
          { icon: Cloud, top: '20%', right: '12%', delay: 1 },
          { icon: Shield, bottom: '25%', left: '15%', delay: 2 },
          { icon: Cpu, top: '30%', right: '20%', delay: 1.5 },
          { icon: Globe, bottom: '30%', right: '15%', delay: 3 },
          { icon: Satellite, top: '40%', left: '8%', delay: 2.5 },
        ].map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={index}
              className="absolute p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
              animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}
            >
              <Icon className="w-6 h-6 text-blue-400" />
            </motion.div>
          )
        })}

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Enterprise Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Enterprise AI Platform</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-400">99.99% Uptime</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
            >
              Building the{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Intelligent Operating System
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              For Governments, Global Enterprises, Financial Institutions, Healthcare Systems, 
              Universities, and the Industries of Tomorrow.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl shadow-blue-500/25 font-semibold group">
                  Explore Platform <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10 backdrop-blur-xl font-semibold">
                  View Live Demo
                </Button>
              </Link>
            </motion.div>

            {/* Animated Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <AnimatedStat value={450000} suffix="+" prefix="" label="Active Users" icon={Users} />
              <AnimatedStat value={100} suffix="+" prefix="" label="Countries Served" icon={Globe} />
              <AnimatedStat value={500} suffix="+" prefix="" label="AI Engineers" icon={Cpu} />
              <AnimatedStat value={10000} suffix="+" prefix="" label="Projects Delivered" icon={TrendingUp} />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================== TRUST BADGES ========================================== */}
      <TrustBadges />

      {/* ========================================== GLOBAL ACTIVITY FEED ========================================== */}
      <section className="py-4 bg-white dark:bg-neutral-950 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlobalActivityFeed />
        </div>
      </section>

      {/* ========================================== ANIMATED COUNTERS ========================================== */}
      <AnimatedCounters />

      {/* ========================================== ENTERPRISE ARCHITECTURE ========================================== */}
      <EnterpriseArchitecture />

      {/* ========================================== AI CAPABILITIES ========================================== */}
      <AICapabilities />

      {/* ========================================== MISSION CONTROL ========================================== */}
      <MissionControl />

      {/* ========================================== DIGITAL TWIN ========================================== */}
      <DigitalTwin />

      {/* ========================================== WORLD MAP ========================================== */}
      <WorldMap />

      {/* ========================================== GLOBAL INFRASTRUCTURE ========================================== */}
      <GlobalInfrastructure />

      {/* ========================================== EXECUTIVE ROI ========================================== */}
      <ExecutiveROI />

      {/* ========================================== ENTERPRISE TRUST ========================================== */}
      <EnterpriseTrust />

      {/* ========================================== ENTERPRISE DASHBOARD ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Enterprise-Grade{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Analytics</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Real-time business intelligence at your fingertips</p>
          </div>
          <EnterpriseDashboard />
        </div>
      </section>

      {/* ========================================== AI PROPOSAL GENERATOR ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Custom Proposal</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">AI-powered project proposals in seconds</p>
          </div>
          <div className="max-w-2xl mx-auto"><AIProposalGenerator /></div>
        </div>
      </section>

      {/* ========================================== FINAL CTA ========================================== */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Ready to Transform Your Enterprise?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Join 450,000+ organizations that trust IntelliWavve for enterprise AI solutions.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/contact">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-7 text-lg rounded-2xl font-bold shadow-2xl group">
                Schedule a Demo <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-2xl border-2 border-white/40 text-white hover:bg-white/10 font-bold">
                View Pricing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}