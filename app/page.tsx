'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { LiveMetrics } from '@/components/features/live-metrics'
import { TrustBadges } from '@/components/sections/trust-badges'
import { ClientLogos } from '@/components/sections/client-logos'
import { RealCaseStudies } from '@/components/sections/real-case-studies'
import { EnterpriseDashboard } from '@/components/features/enterprise-dashboard'
import { ProductShowcase } from '@/components/sections/product-showcase'
import { AIProposalGenerator } from '@/components/features/ai-proposal-generator'
import { GlobalActivityFeed } from '@/components/features/global-activity-feed'
import { RoboticsInnovation } from '@/components/sections/robotics-innovation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield } from 'lucide-react'
import Link from 'next/link'

// Smooth Animated Counter Hook
function useAnimatedCounter(end: number, duration: number = 2000, suffix: string = '', prefix: string = '') {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (isInView && !hasStarted) {
      setHasStarted(true)
      let startTime: number
      let animationFrame: number

      const easeOutExpo = (t: number): number => {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      }

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easeOutExpo(progress)
        
        setCount(Math.floor(easedProgress * end))

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        }
      }

      animationFrame = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animationFrame)
    }
  }, [isInView, end, duration, hasStarted])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return {
    displayValue: `${prefix}${formatNumber(count)}${suffix}`,
    ref,
    isAnimating: hasStarted && count < end,
  }
}

// Animated Stat Card
function AnimatedStat({ value, suffix, prefix, label }: { value: number; suffix: string; prefix: string; label: string }) {
  const { displayValue, ref, isAnimating } = useAnimatedCounter(value, 2500, suffix, prefix)

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      className="text-center p-6 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all"
    >
      <span
        ref={ref}
        className={`text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tabular-nums ${
          isAnimating ? 'animate-pulse' : ''
        }`}
      >
        {displayValue}
      </span>
      <div className="text-sm text-neutral-500 mt-2 font-medium">{label}</div>
    </motion.div>
  )
}

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-neutral-950 via-indigo-950 to-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">SOC 2 Type II Certified</span>
              <span className="text-neutral-600">•</span>
              <span className="text-sm text-neutral-400">ISO 27001</span>
              <span className="text-neutral-600">•</span>
              <span className="text-sm text-neutral-400">GDPR Compliant</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6"
            >
              Enterprise AI Solutions{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Built for Modern Businesses
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Custom AI systems, intelligent automation, SaaS platforms, and cloud infrastructure 
              designed to accelerate growth. Trusted by 450,000+ businesses.
            </motion.p>

            {/* Animated Stats in Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto"
            >
              <AnimatedStat value={450000} suffix="+" label="Active Users" prefix="" />
              <AnimatedStat value={100} suffix="+" label="Countries" prefix="" />
              <AnimatedStat value={500} suffix="+" label="AI Engineers" prefix="" />
              <AnimatedStat value={10000} suffix="+" label="Projects Delivered" prefix="" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/contact">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-2xl shadow-xl shadow-indigo-500/25">
                  Book Consultation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-neutral-700 text-white hover:bg-neutral-800">
                  View Products
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== LIVE METRICS ========== */}
      <section className="py-12 bg-white dark:bg-neutral-950 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveMetrics />
        </div>
      </section>

      {/* ========== TRUST BADGES ========== */}
      <TrustBadges />

      {/* ========== CLIENT LOGOS ========== */}
      <ClientLogos />

      {/* ========== GLOBAL ACTIVITY FEED ========== */}
      <section className="py-6 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlobalActivityFeed />
        </div>
      </section>

      {/* ========== PRODUCT SHOWCASE ========== */}
      <ProductShowcase />

      {/* ========== ROBOTICS & AI INNOVATION ========== */}
      <RoboticsInnovation />

      {/* ========== ENTERPRISE DASHBOARD ========== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Enterprise-Grade{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Analytics
              </span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              Real-time business intelligence at your fingertips
            </p>
          </div>
          <EnterpriseDashboard />
        </div>
      </section>

      {/* ========== REAL CASE STUDIES ========== */}
      <RealCaseStudies />

      {/* ========== AI PROPOSAL GENERATOR ========== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Get Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Custom Proposal
              </span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              Generate a professional project proposal in seconds
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <AIProposalGenerator />
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join 450,000+ businesses that trust IntelliWave for enterprise AI solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-neutral-100 px-8 py-6 text-lg rounded-2xl font-bold">
                Schedule a Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/30 text-white hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}