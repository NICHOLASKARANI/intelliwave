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
  ArrowUpRight, Star, Zap, Lock, Server, Database, Wifi,
  Smartphone, Palette, HeadphonesIcon, Briefcase, GraduationCap,
  Heart, Truck, Factory, Store, Landmark, Plane, Ship,
  HardHat, Stethoscope, Scale, ShoppingCart, Dumbbell,
  Scissors, Wrench, Camera, Music, Film, Newspaper
} from 'lucide-react'
import Link from 'next/link'

// ============================================================
// REAL ANIMATED COUNTER - Guaranteed to move on scroll
// ============================================================
function AnimatedCounter({ end, duration = 2500, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{formatNumber(count)}{suffix}
    </span>
  )
}

// ============================================================
// STAT CARD
// ============================================================
function AnimatedStat({ value, suffix, prefix, label, icon: Icon }: { value: number; suffix: string; prefix: string; label: string; icon: any }) {
  return (
    <motion.div whileHover={{ scale: 1.05, y: -4 }}
      className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 transition-all">
      <Icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
      <div className="text-3xl md:text-4xl font-bold text-white tabular-nums">
        <AnimatedCounter end={value} suffix={suffix} prefix={prefix} />
      </div>
      <div className="text-sm text-gray-400 mt-2">{label}</div>
    </motion.div>
  )
}

// ============================================================
// REAL SERVICE CARDS DATA
// ============================================================
const servicesData = [
  { title: 'AI Business Automation', image: '/images/Aibusinessautomation.jpeg', desc: 'Intelligent automation for enterprise operations', href: '/ai-engineering', icon: Bot },
  { title: 'E-Commerce Platforms', image: '/images/eccomerce.jpeg', desc: 'Scalable online stores with M-Pesa integration', href: '/services', icon: ShoppingCart },
  { title: 'Real Estate Solutions', image: '/images/real estate.jpeg', desc: 'Property management and real estate platforms', href: '/services', icon: Building2 },
  { title: 'Healthcare Systems', image: '/images/medicaldental clinnic.jpeg', desc: 'Medical and dental practice management', href: '/services', icon: Stethoscope },
  { title: 'Restaurant & Hospitality', image: '/images/restaurant.jpeg', desc: 'POS and management systems for hospitality', href: '/services', icon: Store },
  { title: 'Construction Management', image: '/images/constructioncompanies.jpeg', desc: 'Project management for construction firms', href: '/services', icon: HardHat },
  { title: 'Law Firm Solutions', image: '/images/law firm website.jpeg', desc: 'Case management for legal practices', href: '/services', icon: Scale },
  { title: 'Fitness & Gym Management', image: '/images/gymfitness.jpeg', desc: 'Membership and scheduling platforms', href: '/services', icon: Dumbbell },
  { title: 'Auto Repair Shops', image: '/images/Autorepairshops.jpeg', desc: 'Workshop and inventory management', href: '/services', icon: Wrench },
  { title: 'Beauty & Spa Salons', image: '/images/beautysalonsspa.jpeg', desc: 'Booking and client management systems', href: '/services', icon: Scissors },
]

// ============================================================
// ENTERPRISE FEATURES
// ============================================================
const enterpriseFeatures = [
  { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 Type II, AES-256 encryption, zero-trust architecture' },
  { icon: Cloud, title: 'Cloud Infrastructure', desc: 'AWS, Azure, GCP with 99.99% uptime SLA guarantee' },
  { icon: Cpu, title: 'AI & Machine Learning', desc: 'Custom models, NLP, computer vision, predictive analytics' },
  { icon: Globe, title: 'Global Edge Network', desc: '200+ points of presence, sub-10ms latency worldwide' },
  { icon: Database, title: 'Data Analytics', desc: 'Real-time dashboards, business intelligence, reporting' },
  { icon: Lock, title: 'Compliance Ready', desc: 'GDPR, Kenya DPA, ISO 27001, audit logs' },
  { icon: Server, title: 'Scalable Architecture', desc: 'Auto-scaling, load balancing, disaster recovery' },
  { icon: Wifi, title: 'API Platform', desc: 'REST, GraphQL, webhooks, 500+ pre-built connectors' },
]

// ============================================================
// INDUSTRY SOLUTIONS
// ============================================================
const industries = [
  { icon: Landmark, name: 'Government', desc: 'Digital transformation for public sector' },
  { icon: Heart, name: 'Healthcare', desc: 'Hospital management and telemedicine' },
  { icon: GraduationCap, name: 'Education', desc: 'Learning management systems' },
  { icon: Factory, name: 'Manufacturing', desc: 'IIoT and smart factory solutions' },
  { icon: Truck, name: 'Logistics', desc: 'Fleet management and tracking' },
  { icon: Store, name: 'Retail', desc: 'POS and inventory management' },
  { icon: Building2, name: 'Real Estate', desc: 'Property management platforms' },
  { icon: Plane, name: 'Aviation', desc: 'Maintenance and operations systems' },
  { icon: Ship, name: 'Shipping', desc: 'Port and vessel management' },
  { icon: Briefcase, name: 'Professional Services', desc: 'Practice management solutions' },
  { icon: Smartphone, name: 'Telecom', desc: 'Network management and billing' },
  { icon: Palette, name: 'Media', desc: 'Content management and distribution' },
]

// ============================================================
// HOMEPAGE
// ============================================================
export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  return (
    <div className="overflow-hidden">
      {/* ========================================== HERO SECTION ========================================== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.4) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2], x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-3xl" />

        {/* Rotating Globe Rings */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-blue-500/8">
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-8 rounded-full border border-purple-500/8" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-16 rounded-full border border-cyan-500/8" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-24 rounded-full border border-blue-400/5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <motion.div key={angle}
              className="absolute w-3 h-3 bg-blue-500 rounded-full"
              style={{ top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 340}px)`, left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 340}px)`, transform: 'translate(-50%, -50%)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: angle / 100 }} />
          ))}
        </motion.div>

        {/* Floating Tech Icons */}
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
            <motion.div key={index}
              className="absolute p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
              style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
              animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: item.delay, ease: 'easeInOut' }}>
              <Icon className="w-6 h-6 text-blue-400" />
            </motion.div>
          )
        })}

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Enterprise AI Platform</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-400">Production Ready</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Building the{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Intelligent Operating System
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              For Governments, Global Enterprises, Financial Institutions, Healthcare Systems, 
              Universities, and the Industries of Tomorrow.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-2xl shadow-2xl shadow-blue-500/25 font-semibold group">
                  Start a Project <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10 backdrop-blur-xl font-semibold">
                  Our Services
                </Button>
              </Link>
            </motion.div>

            {/* MOVING NUMBERS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatedStat value={450000} suffix="+" prefix="" label="Active Users" icon={Users} />
              <AnimatedStat value={100} suffix="+" prefix="" label="Countries Served" icon={Globe} />
              <AnimatedStat value={500} suffix="+" prefix="" label="Engineers" icon={Cpu} />
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

      {/* ========================================== REAL SERVICES WITH IMAGES ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Solutions for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Every Industry</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              Custom-built software and AI solutions tailored to your specific industry needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {servicesData.map((service, index) => (
              <motion.div key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer">
                <Link href={service.href}>
                  <div className="relative h-48 overflow-hidden">
                    <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-blue-500/30 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg">{service.title}</h3>
                      <p className="text-white/70 text-xs mt-1">{service.desc}</p>
                      <ArrowUpRight className="absolute top-3 right-3 w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== ENTERPRISE FEATURES ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Features</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Built for scale, security, and performance</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enterpriseFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all text-center">
                  <Icon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================== ENTERPRISE ARCHITECTURE ========================================== */}
      <EnterpriseArchitecture />

      {/* ========================================== AI CAPABILITIES ========================================== */}
      <AICapabilities />

      {/* ========================================== ENTERPRISE AI PLATFORM IMAGE ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">AI Platform</span>
            </h2>
          </div>
          <div className="relative rounded-3xl overflow-hidden border shadow-2xl">
            <Image src="/images/intelli-systems.png" alt="IntelliWavve Enterprise AI Platform" width={1200} height={600} className="w-full object-cover" priority />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="text-2xl font-bold">IntelliWavve Enterprise AI Ecosystem</h3>
              <p className="text-white/80">One unified platform for AI, automation, and enterprise operations</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== INDUSTRY SOLUTIONS ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Industries{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">We Serve</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Specialized solutions for every sector</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {industries.map((industry, index) => {
              const Icon = industry.icon
              return (
                <motion.div key={industry.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-center cursor-default">
                  <Icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-sm">{industry.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{industry.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================== GROW FASTER ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Scale Faster with AI Automation</h2>
              <p className="text-xl text-muted-foreground mb-8">Companies using IntelliWavve grow faster by automating operations, reducing costs, and making data-driven decisions.</p>
              <div className="space-y-3 mb-8">
                {['Cost reduction', 'Faster delivery', 'Customer satisfaction', '24/7 AI support'].map((item) => (
                  <div key={item} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span>{item}</span></div>
                ))}
              </div>
              <Link href="/contact"><Button size="lg">Start Scaling <ArrowRight className="ml-2" /></Button></Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image src="/images/grow-faster.jpeg" alt="Scale faster" width={600} height={400} className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== MORE SECTIONS ========================================== */}
      <DigitalTwin />
      <WorldMap />
      <GlobalInfrastructure />
      <ExecutiveROI />
      <EnterpriseTrust />
      <MissionControl />

      {/* ========================================== DASHBOARD ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-6xl font-bold mb-4">Enterprise Analytics</h2></div>
          <EnterpriseDashboard />
        </div>
      </section>

      {/* ========================================== AI PROPOSAL ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12"><h2 className="text-4xl font-bold mb-4">Get Your Custom Proposal</h2></div>
          <div className="max-w-2xl mx-auto"><AIProposalGenerator /></div>
        </div>
      </section>

      {/* ========================================== CTA ========================================== */}
      <section className="py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to Transform Your Enterprise?</h2>
          <p className="text-xl text-white/80 mb-10">Join organizations that trust IntelliWavve.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact"><Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-7 text-lg rounded-2xl font-bold shadow-2xl group">Schedule a Demo <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Button></Link>
            <Link href="/pricing"><Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-2xl border-2 border-white/40 text-white hover:bg-white/10 font-bold">View Pricing</Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}