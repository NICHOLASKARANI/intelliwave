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
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Sparkles, Shield, Globe, Cpu, TrendingUp, 
  CheckCircle, Users, Building2, Cloud, Bot, Satellite,
  ArrowUpRight, Lock, Server, Database, Wifi,
  HardHat, Stethoscope, Scale, ShoppingCart, Dumbbell,
  Scissors, Wrench, Code2, Monitor, Store
} from 'lucide-react'
import Link from 'next/link'

// ============================================================
// ANIMATED COUNTER — Only for real, sourced numbers
// ============================================================
function AnimatedCounter({ end, duration = 2500, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
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

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

// ============================================================
// REAL SERVICE CARDS — Using your actual images
// ============================================================
const servicesData = [
  { title: 'AI Business Automation', image: '/images/Aibusinessautomation.jpeg', desc: 'Intelligent automation for enterprise operations', href: '/ai-engineering' },
  { title: 'E-Commerce Platforms', image: '/images/eccomerce.jpeg', desc: 'Scalable online stores with M-Pesa integration', href: '/services' },
  { title: 'Real Estate Solutions', image: '/images/real estate.jpeg', desc: 'Property management and real estate platforms', href: '/services' },
  { title: 'Healthcare Systems', image: '/images/medicaldental clinnic.jpeg', desc: 'Medical and dental practice management', href: '/services' },
  { title: 'Restaurant & Hospitality', image: '/images/restaurant.jpeg', desc: 'POS and management systems for hospitality', href: '/services' },
  { title: 'Construction Management', image: '/images/constructioncompanies.jpeg', desc: 'Project management for construction firms', href: '/services' },
  { title: 'Law Firm Solutions', image: '/images/law firm website.jpeg', desc: 'Case management for legal practices', href: '/services' },
  { title: 'Fitness & Gym Management', image: '/images/gymfitness.jpeg', desc: 'Membership and scheduling platforms', href: '/services' },
  { title: 'Auto Repair Shops', image: '/images/Autorepairshops.jpeg', desc: 'Workshop and inventory management', href: '/services' },
  { title: 'Beauty & Spa Salons', image: '/images/beautysalonsspa.jpeg', desc: 'Booking and client management systems', href: '/services' },
]

// ============================================================
// ENGINEERING IMAGES — Real developer/engineer photos
// ============================================================
const engineeringImages = [
  { src: '/images/ai-engineering.jpg', alt: 'AI engineers building machine learning models', label: 'AI Engineering' },
  { src: '/images/software-development.jpg', alt: 'Software developers collaborating on enterprise applications', label: 'Software Development' },
  { src: '/images/cybersecurity.jpg', alt: 'Cybersecurity team monitoring threat detection systems', label: 'Cybersecurity Operations' },
  { src: '/images/cloud-devops.jpg', alt: 'Cloud engineers managing infrastructure and deployments', label: 'Cloud & DevOps' },
]

// ============================================================
// BUSINESS IMPACT IMAGES — Real results imagery
// ============================================================
const businessImages = [
  { src: '/images/Traders.jpeg', alt: 'Financial trading and market analysis', label: 'Financial Intelligence' },
  { src: '/images/Satelites.jpeg', alt: 'Satellite technology and space systems', label: 'Space Technology' },
  { src: '/images/great.jpeg', alt: 'Delivering exceptional enterprise results', label: 'Proven Results' },
  { src: '/images/ui.png', alt: 'Enterprise dashboard with premium UI/UX', label: 'Enterprise Design' },
]

// ============================================================
// HOMEPAGE — One compelling story
// ============================================================
export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <div className="overflow-hidden">
      {/* ========================================== HERO — Cinematic Opening ========================================== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        {/* Deep atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/80 to-slate-950" />
        
        {/* Aurora bands */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" 
        />
        <motion.div 
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-purple-500/10 via-cyan-500/5 to-transparent blur-3xl" 
        />

        {/* Orbiting rings — the signature element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 rounded-full border border-blue-500/5 animate-spin" style={{ animationDuration: '40s' }} />
          <div className="absolute inset-12 rounded-full border border-purple-500/5 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
          <div className="absolute inset-24 rounded-full border border-cyan-500/5 animate-spin" style={{ animationDuration: '18s' }} />
          <div className="absolute inset-36 rounded-full border border-blue-400/3 animate-spin" style={{ animationDuration: '14s', animationDirection: 'reverse' }} />
        </div>

        {/* Floating nodes on rings */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <div key={angle} className="absolute w-2 h-2 bg-blue-400/60 rounded-full"
            style={{
              top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 360}px)`,
              left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 360}px)`,
              transform: 'translate(-50%, -50%)',
              animation: `pulse ${2 + angle / 60}s ease-in-out infinite`
            }}
          />
        ))}

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Enterprise badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/3 backdrop-blur-xl border border-white/5 mb-10">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium tracking-wide">Enterprise AI Platform</span>
            </motion.div>

            {/* Main headline — large, confident, minimal */}
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.08]">
              Building the{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400">
                Intelligent Operating System
              </span>
            </motion.h1>

            {/* Subheadline — clear, direct */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9 }}
              className="text-xl md:text-2xl text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed font-light">
              For Governments, Global Enterprises, Financial Institutions, Healthcare Systems, 
              Universities, and the Industries of Tomorrow.
            </motion.p>

            {/* CTAs — clear choices */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-200 px-8 py-6 text-lg rounded-2xl font-semibold shadow-2xl shadow-white/10 group">
                  Start a Project <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/15 text-white hover:bg-white/5 backdrop-blur-xl font-semibold">
                  Explore Services
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================== TRUST ========================================== */}
      <TrustBadges />
      <section className="py-4 bg-white dark:bg-neutral-950 border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><GlobalActivityFeed /></div></section>

      {/* ========================================== REAL SERVICES ========================================== */}
      <section className="py-28 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
              Solutions for Every Industry
            </h2>
            <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-3xl mx-auto">
              Custom-built software and AI solutions tailored to your specific needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {servicesData.map((service, index) => (
              <motion.div key={service.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }}
                whileHover={{ y: -6 }} className="group relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer">
                <Link href={service.href}>
                  <div className="relative h-52 overflow-hidden">
                    <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-blue-500/20 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-bold text-lg tracking-tight">{service.title}</h3>
                      <p className="text-white/60 text-xs mt-1.5 leading-relaxed">{service.desc}</p>
                    </div>
                    <ArrowUpRight className="absolute top-4 right-4 w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== ENGINEERING EXCELLENCE ========================================== */}
      <section className="py-28 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
              Engineering Excellence
            </h2>
            <p className="text-xl text-neutral-500 dark:text-neutral-400">
              Production-grade systems built with rigorous engineering standards.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {engineeringImages.map((img) => (
              <div key={img.label} className="group relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-500">
                <div className="relative h-72">
                  <Image src={img.src} alt={img.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg">{img.label}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== ENTERPRISE ARCHITECTURE ========================================== */}
      <EnterpriseArchitecture />
      <AICapabilities />

      {/* ========================================== ENTERPRISE AI PLATFORM ========================================== */}
      <section className="py-28 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
              Enterprise AI Platform
            </h2>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-2xl">
            <Image src="/images/intelli-systems.png" alt="IntelliWavve Enterprise AI Platform" width={1200} height={600} className="w-full object-cover" priority />
            <div className="absolute bottom-0 left-0 right-0 p-10 text-white bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h3 className="text-3xl font-bold tracking-tight">IntelliWavve Enterprise AI Ecosystem</h3>
              <p className="text-white/70 text-lg mt-2">One unified platform for AI, automation, and enterprise operations</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== BUSINESS IMPACT ========================================== */}
      <section className="py-28 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
              Business Impact
            </h2>
            <p className="text-xl text-neutral-500 dark:text-neutral-400">
              Real results across industries and technologies.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessImages.map((img) => (
              <div key={img.label} className="group relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-500">
                <div className="relative h-60">
                  <Image src={img.src} alt={img.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-lg">{img.label}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== REMAINING SECTIONS ========================================== */}
      <DigitalTwin />
      <WorldMap />
      <GlobalInfrastructure />
      <ExecutiveROI />
      <EnterpriseTrust />
      <MissionControl />

      {/* ========================================== DASHBOARD ========================================== */}
      <section className="py-28 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white tracking-tight">Enterprise Analytics</h2>
          </div>
          <EnterpriseDashboard />
        </div>
      </section>

      {/* ========================================== AI PROPOSAL ========================================== */}
      <section className="py-28 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">Get Your Custom Proposal</h2>
          </div>
          <div className="max-w-2xl mx-auto"><AIProposalGenerator /></div>
        </div>
      </section>

      {/* ========================================== FINAL CTA ========================================== */}
      <section className="py-36 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Ready to Transform Your Enterprise?</h2>
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
            Tell us about your project. We'll respond with a preliminary assessment within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-200 px-10 py-7 text-lg rounded-2xl font-bold shadow-2xl shadow-white/10 group">
                Schedule a Consultation <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-2xl border-2 border-white/20 text-white hover:bg-white/10 font-bold">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}