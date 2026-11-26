'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
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
  Scissors, Wrench, Code2, Monitor, Store, Download,
  Briefcase, GraduationCap, Heart, Truck, Factory,
  Zap, Star, Activity, BarChart3, Brain
 } from 'lucide-react'
import Link from 'next/link'

// ============================================================
// ANIMATED COUNTER â€” Smooth, professional
// ============================================================
function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const startTime = performance.now()
      
      const updateCount = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(eased * end))
        
        if (progress < 1) {
          requestAnimationFrame(updateCount)
        } else {
          setCount(end)
        }
      }
      
      requestAnimationFrame(updateCount)
    }
  }, [isInView, end])

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>
}
// ============================================================
// DATA
// ============================================================

const engineeringImages = [
  { src: '/images/ai-engineering.jpg', alt: 'AI engineers building machine learning models', label: 'AI Engineering' },
  { src: '/images/software-development.jpg', alt: 'Software developers collaborating on enterprise applications', label: 'Software Development' },
  { src: '/images/cybersecurity.jpg', alt: 'Cybersecurity team monitoring threat detection systems', label: 'Cybersecurity Operations' },
  { src: '/images/cloud-devops.jpg', alt: 'Cloud engineers managing infrastructure and deployments', label: 'Cloud & DevOps' },
]


// ============================================================
// HOMEPAGE â€” World-Class Enterprise Experience
// ============================================================
export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <div className="overflow-hidden">
      {/* ========================================== HERO â€” Cinematic with World Map Background ========================================== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        {/* Deep cosmos atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950/80 to-slate-950" />
        
        {/* World Map Background Layer */}
        <div className="absolute inset-0 opacity-[0.05]">
          <Image src="/images/world-map-bg.png" alt="" fill className="object-cover" priority />
        </div>

        {/* Aurora atmospheric bands */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" 
        />
        <motion.div 
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-purple-500/10 via-cyan-500/5 to-transparent blur-3xl" 
        />

        {/* Orbiting rings â€” Earth-like orbital system */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px]">
          <div className="absolute inset-0 rounded-full border border-blue-500/5 animate-spin" style={{ animationDuration: '45s' }} />
          <div className="absolute inset-12 rounded-full border border-purple-500/5 animate-spin" style={{ animationDuration: '28s', animationDirection: 'reverse' }} />
          <div className="absolute inset-24 rounded-full border border-cyan-500/5 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute inset-36 rounded-full border border-blue-400/3 animate-spin" style={{ animationDuration: '16s', animationDirection: 'reverse' }} />
          <div className="absolute inset-48 rounded-full border border-purple-400/2 animate-spin" style={{ animationDuration: '12s' }} />
        </div>

        {/* Floating tech nodes on rings */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <div key={angle} 
            className="absolute w-2.5 h-2.5 bg-blue-400/70 rounded-full shadow-lg shadow-blue-500/50"
            style={{
              top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 400}px)`,
              left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 400}px)`,
              transform: 'translate(-50%, -50%)',
              animation: `pulse ${2.5 + angle / 50}s ease-in-out infinite`
            }}
          />
        ))}

        {/* Floating tech icons */}
        {[
          { icon: Brain, top: '12%', left: '8%', delay: 0 },
          { icon: Cloud, top: '18%', right: '10%', delay: 1 },
          { icon: Shield, bottom: '22%', left: '12%', delay: 2 },
          { icon: Cpu, top: '28%', right: '18%', delay: 1.5 },
          { icon: Globe, bottom: '28%', right: '12%', delay: 3 },
          { icon: TrendingUp, top: '35%', left: '6%', delay: 2.5 },
          { icon: Activity, bottom: '15%', right: '8%', delay: 3.5 },
          { icon: BarChart3, top: '45%', left: '15%', delay: 4 },
        ].map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div key={index}
              className="absolute p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-400/30 transition-all"
              style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
              animate={{ y: [0, -25, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}
            >
              <Icon className="w-5 h-5 text-blue-400" />
            </motion.div>
          )
        })}

        {/* ═══ CINEMATIC ENHANCEMENT LAYERS (additive) ═══ */}

        {/* Vignette — dark corners */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.6)_100%)] pointer-events-none" />

        {/* Diagonal light beam */}
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-[800px] h-[1200px] bg-gradient-to-b from-blue-400/20 via-cyan-300/10 to-transparent blur-3xl -rotate-12 pointer-events-none"
          style={{ transformOrigin: 'top left' }}
        />

        {/* Perspective grid horizon */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: 'linear-gradient(rgba(96,165,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          }}
        />

        {/* Starfield */}
        {[...Array(40)].map((_, i) => {
          const top = (i * 37) % 100
          const left = (i * 53) % 100
          const delay = (i % 5) * 0.8
          return (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full pointer-events-none"
              style={{ top: top + '%', left: left + '%' }}
              animate={{ opacity: [0.1, 0.7, 0.1] }}
              transition={{ duration: 3 + (i % 4), repeat: Infinity, delay, ease: 'easeInOut' }}
            />
          )
        })}

        {/* Letterbox bands */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Main Content */}
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">

            {/* Main Headline */}
            {/* Main Headline */}
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.08] uppercase">
              Building the{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400">
                Intelligent Infrastructure
              </span>
              <br className="hidden md:block" />
              <span className="text-white/90">
                for a Multiplanetary Future.
              </span>
            </motion.h1>

            {/* Subheadline */}
            {/* Subheadline */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9 }}
              className="text-xl md:text-2xl text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed font-light">
              Engineering the intelligent systems, enterprise platforms and digital foundations that will power the next era of human civilization — on Earth and beyond.
            </motion.p>

          </div>
        </motion.div>
      </section>

      {/* ========================================== TRUST BADGES + ACTIVITY ========================================== */}
<section className="py-4 bg-white dark:bg-neutral-950 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><GlobalActivityFeed /></div>
      </section>

      {/* ========================================== DERIV TRADING ONBOARDING ========================================== */}

      {/* ========================================== IntelliWavve FLAGSHIP SHOWCASE ========================================== */}

      {/* ========================================== 1. 100 ECOSYSTEMS ========================================== */}
      <section className="py-24 md:py-32 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/executives" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-blue-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(59,130,246,0.45)] transition-all duration-700">
                <img
                  src="/banners/100-ecosystems.png"
                  alt="100 Business Ecosystems — IntelliWavve"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                One Intelligent Ecosystem. Solutions Across 100 Business Systems.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                IntelliWavve brings together 100 specialised business and industry systems designed to address diverse operational needs. From retail, healthcare and education to finance, logistics, manufacturing and professional services, our expanding digital ecosystem provides businesses with technology to streamline operations, improve productivity and accelerate digital transformation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 2. WAVECORE ERP ========================================== */}
      <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/wavecore-erp" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-cyan-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(6,182,212,0.45)] transition-all duration-700">
                <img
                  src="/banners/wavecore-erp.png"
                  alt="WaveCore ERP — Enterprise Management Platform"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                One Integrated Platform. Complete Enterprise Management.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                WaveCore ERP delivers an integrated approach to enterprise resource planning, connecting essential business operations through one intelligent platform. From inventory and procurement to sales, finance, human resource management and operational reporting, businesses gain greater visibility, coordination and control over their activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 3. WAVVE SI ========================================== */}
      <section className="py-24 md:py-32 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/wavve-si" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-purple-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(168,85,247,0.45)] transition-all duration-700">
                <img
                  src="/banners/wavvesi.png"
                  alt="Wavve SI — AI-Powered Business Systems"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                Artificial Intelligence Designed for Real Business Operations.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Wavve SI introduces an intelligent technology ecosystem designed to bring AI capabilities into everyday business operations. Through specialised industry systems, intelligent automation and AI-assisted workflows, organisations can enhance decision-making, optimise processes and explore new opportunities for innovation and operational efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 4. DIGITAL TWIN / DELEGATION ========================================== */}
      <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/executives" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-blue-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(59,130,246,0.45)] transition-all duration-700">
                <img
                  src="/banners/delegation-guiding.png"
                  alt="Digital Twin & Guided Transformation — IntelliWavve"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                Understand. Simulate. Optimise. Transform.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                IntelliWavve embraces digital transformation through intelligent operational modelling and guided business processes. Our vision is to help organisations understand their operational environments, coordinate responsibilities and explore improved workflows through connected digital systems. This approach supports better planning, operational visibility and more informed business decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 5. EXECUTIVE LEADERS ========================================== */}
      <section className="py-24 md:py-32 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/executives" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-cyan-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(6,182,212,0.45)] transition-all duration-700">
                <img
                  src="/banners/onboarding-leaders.png"
                  alt="Executive Leadership Network — IntelliWavve"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                Building a Global Network of Digital Transformation Leaders.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                IntelliWavve is developing an ecosystem of executive leaders, technology advocates and business development partners who introduce organisations to modern digital solutions. Through structured onboarding and customer acquisition opportunities, we aim to empower individuals to participate in the growth of digital technology while expanding IntelliWavve's reach across Kenya and international markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 6. 8 REGIONS ========================================== */}
      <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/wavve-si" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-purple-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(168,85,247,0.45)] transition-all duration-700">
                <img
                  src="/banners/teaching-wavvesi.png"
                  alt="Teaching Wavve SI Across 8 Regions — IntelliWavve"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                Taking Digital Intelligence Closer to Every Business Community.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Our expansion vision focuses on extending digital knowledge, AI awareness and technology adoption across eight strategic regions. Through demonstrations, training, digital education and community engagement, IntelliWavve aims to make advanced business technology more accessible to entrepreneurs, institutions and organisations, including those beyond major commercial centres.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 7. WAVVEMARKET ========================================== */}
      <section className="py-24 md:py-32 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/marketplace" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-blue-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(59,130,246,0.45)] transition-all duration-700">
                <img
                  src="/banners/wavvemarket.png"
                  alt="WavveMarket — Digital Commerce for Kenya"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                Connecting Kenyan Businesses Through Digital Commerce.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                WavveMarket is designed to connect buyers and sellers through a digital marketplace that makes product discovery, business visibility and online commerce more accessible. From independent retailers and wholesalers to growing enterprises, the platform creates opportunities for businesses to showcase their products, reach customers and participate in Kenya's evolving digital economy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 8. JOIN INTELLIWAVVE ========================================== */}
      <section className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/marketplace" className="block group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-purple-500/10 group-hover:shadow-[0_30px_90px_-15px_rgba(168,85,247,0.45)] transition-all duration-700">
                <img
                  src="/banners/join-wavvemarket.png"
                  alt="Join IntelliWavve — Connected Digital Business"
                  className="w-full block group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>
            <div className="mt-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
                Join the Future of Connected Digital Business.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Become part of the IntelliWavve ecosystem and participate in the next generation of digital commerce, enterprise management and artificial intelligence. Whether you are an entrepreneur, retailer, business leader, organisation or technology enthusiast, IntelliWavve provides an opportunity to explore connected digital solutions and contribute to a more digitally empowered economy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== FINAL CTA ========================================== */}
      <section className="py-36 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Ready to Transform Your Enterprise?
          </h2>
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