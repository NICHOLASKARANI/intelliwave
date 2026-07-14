'use client'

import { motion } from 'framer-motion'
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
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Sparkles, Shield, Zap, Globe, 
  Cpu, TrendingUp, CheckCircle, Building2, Users 
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ========================================== HERO SECTION ========================================== */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        {/* Premium grid background */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.4) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
        
        {/* Animated gradient orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl" 
        />

        {/* Premium rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-blue-500/8"
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-10 rounded-full border border-purple-500/8"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-20 rounded-full border border-cyan-500/8"
          />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Enterprise AI Platform</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-400">SOC 2 Type II Certified</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
              transition={{ delay: 0.4 }}
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
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl shadow-blue-500/25 font-semibold">
                  Explore Platform <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10 backdrop-blur-xl font-semibold">
                  View Live Demo
                </Button>
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {[
                { icon: Users, value: '450K+', label: 'Active Users' },
                { icon: Globe, value: '100+', label: 'Countries' },
                { icon: Cpu, value: '500+', label: 'AI Engineers' },
                { icon: TrendingUp, value: '10K+', label: 'Projects Delivered' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                    <Icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================== TRUST BADGES (No Tech Partners) ========================================== */}
      <TrustBadges />

      {/* ========================================== GLOBAL ACTIVITY FEED ========================================== */}
      <section className="py-4 bg-white dark:bg-neutral-950 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlobalActivityFeed />
        </div>
      </section>

      {/* ========================================== ENTERPRISE ARCHITECTURE ========================================== */}
      <EnterpriseArchitecture />

      {/* ========================================== AI CAPABILITIES ========================================== */}
      <AICapabilities />

      {/* ========================================== MISSION CONTROL ========================================== */}
      <MissionControl />

      {/* ========================================== DIGITAL TWIN ========================================== */}
      <DigitalTwin />

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
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Enterprise?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join 450,000+ organizations that trust Intelliwavve for enterprise AI solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-7 text-lg rounded-2xl font-bold shadow-2xl">
                Schedule a Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-2xl border-2 border-white/40 text-white hover:bg-white/10 font-bold">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}