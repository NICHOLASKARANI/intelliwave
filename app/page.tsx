'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { TrustBadges } from '@/components/sections/trust-badges'
import { RealCaseStudies } from '@/components/sections/real-case-studies'
import { EnterpriseDashboard } from '@/components/features/enterprise-dashboard'
import { ProductShowcase } from '@/components/sections/product-showcase'
import { AIProposalGenerator } from '@/components/features/ai-proposal-generator'
import { GlobalActivityFeed } from '@/components/features/global-activity-feed'
import { RoboticsInnovation } from '@/components/sections/robotics-innovation'
import { EnterpriseStats } from '@/components/sections/enterprise-stats'
import { EnterpriseTrust } from '@/components/sections/enterprise-trust'
import { AICapabilities } from '@/components/sections/ai-capabilities'
import { CinematicEarth } from '@/components/sections/cinematic-earth'
import { MissionControl } from '@/components/sections/mission-control'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ========== CINEMATIC EARTH HERO ========== */}
      <CinematicEarth />

      {/* ========== ENTERPRISE STATS ========== */}
      <EnterpriseStats />

      {/* ========== MISSION CONTROL ========== */}
      <MissionControl />

      {/* ========== TRUST BADGES (Compliance & Security) ========== */}
      <TrustBadges />

      {/* ========== GLOBAL ACTIVITY FEED ========== */}
      <section className="py-6 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlobalActivityFeed />
        </div>
      </section>

      {/* ========== AI CAPABILITIES ========== */}
      <AICapabilities />

      {/* ========== ENTERPRISE AI PLATFORM SHOWCASE ========== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Enterprise{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">AI Platform</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              A complete AI ecosystem powering governments, banks, hospitals, and global enterprises.
            </p>
          </div>

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
        </div>
      </section>

      {/* ========== GROW FASTER SECTION ========== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Scale Faster with{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">AI Automation</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Companies using IntelliWave grow 3x faster by automating operations, reducing costs, 
                and making data-driven decisions in real-time.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  '40% cost reduction in first 6 months',
                  '3x faster project delivery',
                  '99.9% customer satisfaction',
                  '24/7 AI-powered support'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button size="lg" className="group">
                  Start Scaling <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
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

      {/* ========== TRADERS & FINANCIAL SOLUTIONS ========== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image
                src="/images/Traders.jpeg"
                alt="IntelliWave AI-powered financial trading and market analysis solutions"
                width={600}
                height={400}
                className="w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                AI-Powered{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Financial Solutions</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Real-time market analysis, predictive trading algorithms, and financial intelligence 
                systems that give your business a competitive edge in global markets.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Real-time market data processing',
                  'AI-driven trading strategies',
                  'Risk analysis & compliance',
                  'Portfolio optimization'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/contact">
                <Button size="lg" className="group">
                  Explore Financial AI <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SATELLITE & SPACE TECHNOLOGY ========== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Satellite &{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Space Systems</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Advanced satellite data processing, space technology integration, and aerospace 
                AI systems engineered for the next frontier of innovation.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Satellite data analysis',
                  'Aerospace AI systems',
                  'Remote sensing technology',
                  'Space communication infrastructure'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/innovation-lab">
                <Button size="lg" className="group">
                  Explore Space Tech <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image
                src="/images/Satelites.jpeg"
                alt="IntelliWave satellite technology and space systems AI solutions"
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
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">UI/UX Design</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Beautiful, intuitive interfaces designed for productivity. Every pixel crafted for enterprise users who demand excellence.
              </p>
              <Link href="/portfolio">
                <Button size="lg" variant="outline" className="group">
                  View Our Work <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ENTERPRISE TRUST ========== */}
      <EnterpriseTrust />

      {/* ========== PRODUCT SHOWCASE ========== */}
      <ProductShowcase />

      {/* ========== GREAT RESULTS SECTION ========== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
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
                <Button size="lg" className="group">
                  See Case Studies <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
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