'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { TrustBadges } from '@/components/sections/trust-badges'
import { ClientLogos } from '@/components/sections/client-logos'
import { RealCaseStudies } from '@/components/sections/real-case-studies'
import { EnterpriseDashboard } from '@/components/features/enterprise-dashboard'
import { ProductShowcase } from '@/components/sections/product-showcase'
import { AIProposalGenerator } from '@/components/features/ai-proposal-generator'
import { GlobalActivityFeed } from '@/components/features/global-activity-feed'
import { RoboticsInnovation } from '@/components/sections/robotics-innovation'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Shield, Zap, Globe, Cpu, Bot, Cloud, 
  Code2, LineChart, CheckCircle, Star 
} from 'lucide-react'
import Link from 'next/link'

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
              transition={{ duration: 0.8 }}
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
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Custom AI systems, intelligent automation, SaaS platforms, and cloud infrastructure 
              designed to accelerate growth. Trusted globally.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-3xl mx-auto"
            >
              {[
                { end: 450000, suffix: "+", label: "Active Users" },
                { end: 100, suffix: "+", label: "Countries" },
                { end: 500, suffix: "+", label: "AI Engineers" },
                { end: 10000, suffix: "+", label: "Projects" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white">
                    <AnimatedCounter end={stat.end} suffix={stat.suffix} duration={2500} />
                  </div>
                  <div className="text-sm text-neutral-400 mt-2">{stat.label}</div>
                </motion.div>
              ))}
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

      {/* ========== ENTERPRISE AI PLATFORM SHOWCASE ========== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
              <Cpu className="w-4 h-4" /> Enterprise AI Platform
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Purpose-Built for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Enterprise Scale</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              A complete AI ecosystem designed for global enterprises, not just another software agency.
            </p>
          </div>

          {/* Main Platform Image */}
          <div className="relative rounded-3xl overflow-hidden border shadow-2xl mb-12">
            <Image
              src="/images/intelli-systems.png"
              alt="IntelliWave Enterprise AI Platform - Complete ecosystem for global enterprises"
              width={1200}
              height={600}
              className="w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">IntelliWave Enterprise AI Ecosystem</h3>
              <p className="text-white/80">One unified platform for AI, automation, and enterprise operations</p>
            </div>
          </div>

          {/* Platform Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: 'AI Agents', desc: 'Custom AI agents that automate complex workflows' },
              { icon: Cloud, title: 'Cloud Native', desc: 'Deploy globally with 99.99% uptime SLA' },
              { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2, ISO 27001, bank-grade encryption' },
              { icon: LineChart, title: 'Real-time Analytics', desc: 'Live dashboards with AI-powered insights' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <motion.div key={item.title} whileHover={{ y: -4 }}
                  className="p-6 rounded-2xl border bg-background/50 hover:border-indigo-300 hover:shadow-lg transition-all text-center">
                  <Icon className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== GROW FASTER SECTION WITH IMAGE ========== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" /> Accelerate Growth
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Scale Faster with{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">AI Automation</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Companies using IntelliWave grow 3x faster by automating operations, reducing costs, 
                and making data-driven decisions in real-time.
              </p>
              <div className="space-y-3 mb-8">
                {['40% cost reduction in first 6 months', '3x faster project delivery', '99.9% customer satisfaction', '24/7 AI-powered support'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button size="lg" className="group">Start Scaling <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button>
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image
                src="/images/grow-faster.jpeg"
                alt="Scale your business faster with IntelliWave AI automation platform"
                width={600}
                height={400}
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== ROBOTICS & AI INNOVATION ========== */}
      <RoboticsInnovation />

      {/* ========== UI/UX EXCELLENCE SECTION ========== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border shadow-xl order-2 lg:order-1">
              <Image
                src="/images/ui.png"
                alt="IntelliWave enterprise dashboard with premium UI/UX design"
                width={600}
                height={400}
                className="w-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium mb-6">
                <Star className="w-4 h-4" /> Premium Design
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">UI/UX Design</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Beautiful, intuitive interfaces designed for productivity. Every pixel crafted for enterprise users who demand excellence.
              </p>
              <Link href="/portfolio">
                <Button size="lg" variant="outline" className="group">View Our Work <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRODUCT SHOWCASE ========== */}
      <ProductShowcase />

      {/* ========== GREAT RESULTS SECTION ========== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6">
                <Globe className="w-4 h-4" /> Proven Results
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Delivering{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Exceptional Results</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                10,000+ projects delivered across 100+ countries with 99.7% client satisfaction rate.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { value: '10K+', label: 'Projects' },
                  { value: '99.7%', label: 'Satisfaction' },
                  { value: '450K+', label: 'Users' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              <Link href="/case-studies">
                <Button size="lg" className="group">See Case Studies <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button>
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image
                src="/images/great.jpeg"
                alt="IntelliWave delivering exceptional enterprise results globally"
                width={600}
                height={400}
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== ENTERPRISE DASHBOARD ========== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Enterprise-Grade{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Analytics</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Real-time business intelligence at your fingertips</p>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Custom Proposal</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Generate a professional project proposal in seconds</p>
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