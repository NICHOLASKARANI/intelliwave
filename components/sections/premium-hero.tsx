'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PremiumLogo } from '@/components/ui/premium-logo'

export function PremiumHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50])

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Premium grid */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.5) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />
      
      {/* Aurora layers */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], rotate: [0, 5, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/30 to-purple-600/20 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.15, 0.3, 0.15], rotate: [0, -5, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/30 to-cyan-600/20 rounded-full blur-3xl" 
      />

      {/* Neural network lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <motion.line x1="10%" y1="20%" x2="30%" y2="40%" stroke="#6366f1" strokeWidth="0.5"
          animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 4, repeat: Infinity }} />
        <motion.line x1="70%" y1="30%" x2="90%" y2="50%" stroke="#8b5cf6" strokeWidth="0.5"
          animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} />
        <motion.line x1="20%" y1="60%" x2="50%" y2="80%" stroke="#06b6d4" strokeWidth="0.5"
          animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 2 }} />
        <motion.line x1="60%" y1="70%" x2="80%" y2="20%" stroke="#6366f1" strokeWidth="0.5"
          animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity, delay: 0.5 }} />
      </svg>

      <motion.div style={{ opacity, scale, y }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-8"
        >
          <PremiumLogo />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">Enterprise AI Platform</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-400">SOC 2 Type II Certified</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
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
          transition={{ delay: 0.7 }}
          className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          For Governments, Global Enterprises, Financial Institutions, Healthcare Systems, 
          Universities, and the Industries of Tomorrow.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
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

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
        >
          {['SOC 2 Type II', 'ISO 27001', 'GDPR Compliant', '99.99% SLA'].map((badge) => (
            <span key={badge} className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              {badge}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}