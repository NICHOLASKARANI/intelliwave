// app/page.tsx (Replace entire file)
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card" // Ensure this import is correct
import { 
  ArrowRight, Sparkles, Zap, Globe, Users, Code2, Cpu,
  CheckCircle, Star, Clock, HeadphonesIcon, Rocket, Award,
  Shield, Cloud, TrendingUp, BarChart3, LineChart, ChevronRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Import new features (will be created next)
import { AIDemoSandbox } from '@/components/features/ai-demo-sandbox'
import { GlobalActivityFeed } from '@/components/features/global-activity-feed'
import { ProjectCommandCenter } from '@/components/features/project-command-center'
import { SecurityPavilion } from '@/components/features/security-pavilion'
import { CodingAnimation } from '@/components/features/coding-animation'
import { InstitutionLogos } from '@/components/features/institution-logos'
// New Team Page Imports
import { MissionVisionSection } from '@/components/sections/mission-vision-section'
import { ExecutiveInsightsSection } from '@/components/sections/executive-insights-section'
import { CorporateTrainingSection } from '@/components/sections/corporate-training-section'
import { HRServicesSection } from '@/components/sections/hr-services-section'
import { AIMLShowcase } from '@/components/features/ai-ml-showcase'

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(end * eased))
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, isInView])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

const services = [
  { icon: Cpu, title: 'AI Development', color: 'from-blue-500 to-cyan-500' },
  { icon: Globe, title: 'Web Development', color: 'from-purple-500 to-pink-500' },
  { icon: Cloud, title: 'Cloud Infrastructure', color: 'from-cyan-500 to-blue-500' },
  { icon: Shield, title: 'Cybersecurity', color: 'from-green-500 to-emerald-500' },
  { icon: Code2, title: 'SaaS Platforms', color: 'from-orange-500 to-red-500' },
  { icon: Zap, title: 'AI Automation', color: 'from-yellow-500 to-orange-500' },
]

const stats = [
  { icon: Users, value: 450000, suffix: '+', label: 'Active Users' },
  { icon: Globe, value: 100, suffix: '+', label: 'Countries' },
  { icon: Code2, value: 500, suffix: '+', label: 'AI Engineers' },
  { icon: Award, value: 10000, suffix: '+', label: 'Projects' },
]

const partners = ['Microsoft', 'Tesla', 'NVIDIA', 'Meta', 'SpaceX', 'GST']

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 102 255 / 0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <motion.div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
          <motion.div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.3, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} />
        </div>

        <div className="container relative mx-auto px-4 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Africa&apos;s #1 AI Company</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 backdrop-blur-xl border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-500">500+ Developers Ready</span>
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-bold text-5xl md:text-7xl lg:text-8xl leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-accent">Engineering</span><br />
                the Future<br />
                with AI
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-xl md:text-2xl text-muted-foreground max-w-xl">
                Building Africa&apos;s Global AI Giant. Enterprise SaaS, Cloud Infrastructure, AI Agents, and Custom Software Solutions.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-4 gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 text-2xl md:text-3xl font-bold text-primary">
                        <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  )
                })}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact">
                  <Button size="lg" className="group bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg">
                    Start Your Project
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg backdrop-blur-xl border-2">
                    <Rocket className="mr-2" /> Explore Services
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.5 }} className="relative hidden lg:block">
              <CodingAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== GLOBAL ACTIVITY FEED ========== */}
      <section className="container py-6">
        <GlobalActivityFeed />
      </section>

      {/* ========== PARTNERS BAR ========== */}
      <section className="py-12 border-y bg-secondary/5 backdrop-blur-xl">
        <div className="container">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-muted-foreground mb-6">
            TRUSTED BY INDUSTRY LEADERS
          </motion.p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {partners.map((partner, index) => (
              <motion.div key={partner} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SERVICES SECTION ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Services</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Comprehensive AI-powered solutions for modern enterprises</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div key={service.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ scale: 1.02, y: -5 }} className="group relative p-6 rounded-2xl border bg-background/50 backdrop-blur-xl hover:border-primary/50 transition-all cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <Link href="/services" className="inline-flex items-center text-primary hover:underline text-sm font-medium">
                      Learn more <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== AI INTERACTIVE TOOLS ========== */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Experience Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">AI Engine</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">See the power of our AI in action — no signup required</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <AIDemoSandbox />
            <AIDemoSandbox /> {/* Temporary placeholder */}
          </div>
        </div>
      </section>

      {/* AI/ML Features Showcase */}
<section className="py-24 bg-gradient-to-b from-secondary/5 to-background">
  <div className="container">
    <div className="text-center mb-12">
      <h2 className="text-4xl md:text-5xl font-bold mb-4">
        AI & ML{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Capabilities
        </span>
      </h2>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Experience our intelligent automation in real-time
      </p>
    </div>
    <AIMLShowcase />
  </div>
</section>

      {/* ========== PROJECT COMMAND CENTER ========== */}
      <section className="py-24">
        <div className="container">
          <ProjectCommandCenter />
        </div>
      </section>

      {/* ========== MISSION & VISION ========== */}
      <section className="py-24 bg-gradient-to-b from-secondary/5 to-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Mission & Vision</span>
            </h2>
          </div>
          <MissionVisionSection />
        </div>
      </section>

      {/* ========== EXECUTIVE INSIGHTS ========== */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container">
          <ExecutiveInsightsSection />
        </div>
      </section>

      {/* ========== SECURITY PAVILION ========== */}
      <section className="py-24">
        <div className="container">
          <SecurityPavilion />
        </div>
      </section>

      {/* ========== CORPORATE TRAINING ========== */}
      <section className="py-24 bg-gradient-to-b from-secondary/5 to-background">
        <div className="container">
          <CorporateTrainingSection />
        </div>
      </section>

      {/* ========== HR SERVICES ========== */}
      <section className="py-24">
        <div className="container">
          <HRServicesSection />
        </div>
      </section>

      {/* ========== INSTITUTION LOGOS ========== */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container">
          <InstitutionLogos />
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
        <div className="container relative text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Build the Future</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 450,000+ businesses already growing with Intelliwave. Our 500+ AI engineers are ready to support your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg group">
                  Get Free Consultation
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg backdrop-blur-xl">
                  <HeadphonesIcon className="mr-2" /> WhatsApp: +254 714 694 493
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}