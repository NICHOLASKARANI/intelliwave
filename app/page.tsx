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
import { EnterpriseArchitecture } from '@/components/sections/enterprise-architecture'
import { DigitalTwin } from '@/components/sections/digital-twin'
import { GlobalInfrastructure } from '@/components/sections/global-infrastructure'
import { ExecutiveROI } from '@/components/sections/executive-roi'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Shield, Globe, Cpu, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ========================================== 1. CINEMATIC EARTH HERO ========================================== */}
      <CinematicEarth />

      {/* ========================================== 2. ENTERPRISE STATS ========================================== */}
      <EnterpriseStats />

      {/* ========================================== 3. MISSION CONTROL ========================================== */}
      <MissionControl />

      {/* ========================================== 4. TRUST BADGES ========================================== */}
      <TrustBadges />

      {/* ========================================== 5. GLOBAL ACTIVITY FEED ========================================== */}
      <section className="py-6 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlobalActivityFeed />
        </div>
      </section>

      {/* ========================================== 6. ENTERPRISE ARCHITECTURE ========================================== */}
      <EnterpriseArchitecture />

      {/* ========================================== 7. AI CAPABILITIES ========================================== */}
      <AICapabilities />

      {/* ========================================== 8. DIGITAL TWIN ========================================== */}
      <DigitalTwin />

      {/* ========================================== 9. ENTERPRISE AI PLATFORM ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-sm font-medium mb-6">
              <Cpu className="w-4 h-4" /> Enterprise AI Platform
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Purpose-Built for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Enterprise Scale</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              A complete AI ecosystem powering governments, banks, hospitals, and global enterprises.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl">
            <Image
              src="/images/intelli-systems.png"
              alt="IntelliWave Enterprise AI Platform"
              width={1200}
              height={600}
              className="w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">IntelliWave Enterprise AI Ecosystem</h3>
              <p className="text-white/80 text-lg">One unified platform for AI, automation, and enterprise operations</p>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Cpu, label: 'AI Agents', desc: 'Autonomous assistants' },
              { icon: Shield, label: 'Zero-Trust Security', desc: 'Bank-grade protection' },
              { icon: Globe, label: 'Global Edge', desc: '200+ locations' },
              { icon: TrendingUp, label: 'Real-time Analytics', desc: 'Live dashboards' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="text-center p-4 rounded-xl border bg-background/50 hover:shadow-md transition-shadow">
                  <Icon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <div className="font-bold text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========================================== 10. GROW FASTER ========================================== */}
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
              <p className="text-xl text-muted-foreground mb-8">
                Companies using IntelliWave grow 3x faster by automating operations, reducing costs, and making data-driven decisions.
              </p>
              <div className="space-y-3 mb-8">
                {['40% cost reduction in first 6 months', '3x faster project delivery', '99.9% customer satisfaction', '24/7 AI-powered support'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/contact"><Button size="lg" className="group">Start Scaling <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image src="/images/grow-faster.jpeg" alt="Scale faster with IntelliWave" width={600} height={400} className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 11. TRADERS & FINANCIAL ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image src="/images/Traders.jpeg" alt="AI Financial Solutions" width={600} height={400} className="w-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4" /> Financial Intelligence
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                AI-Powered{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Financial Solutions</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">Real-time market analysis and predictive trading algorithms for global markets.</p>
              <div className="space-y-3 mb-8">
                {['Real-time market data', 'AI trading strategies', 'Risk analysis & compliance', 'Portfolio optimization'].map((item) => (
                  <div key={item} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /><span>{item}</span></div>
                ))}
              </div>
              <Link href="/contact"><Button size="lg">Explore Financial AI <ArrowRight className="ml-2" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 12. SATELLITE & SPACE ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-sm font-medium mb-6">
                <Globe className="w-4 h-4" /> Space Technology
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Satellite &{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Space Systems</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">Advanced satellite data processing and aerospace AI systems.</p>
              <div className="space-y-3 mb-8">
                {['Satellite data analysis', 'Aerospace AI systems', 'Remote sensing', 'Space communication'].map((item) => (
                  <div key={item} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-purple-500" /><span>{item}</span></div>
                ))}
              </div>
              <Link href="/innovation-lab"><Button size="lg">Explore Space Tech <ArrowRight className="ml-2" /></Button></Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image src="/images/Satelites.jpeg" alt="Space Technology" width={600} height={400} className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 13. EXECUTIVE ROI ========================================== */}
      <ExecutiveROI />

      {/* ========================================== 14. GLOBAL INFRASTRUCTURE ========================================== */}
      <GlobalInfrastructure />

      {/* ========================================== 15. ROBOTICS INNOVATION ========================================== */}
      <RoboticsInnovation />

      {/* ========================================== 16. UI/UX EXCELLENCE ========================================== */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden border shadow-xl order-2 lg:order-1">
              <Image src="/images/ui.png" alt="Enterprise UI/UX" width={600} height={400} className="w-full object-cover" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">UI/UX Design</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">Beautiful, intuitive interfaces designed for productivity at enterprise scale.</p>
              <Link href="/portfolio"><Button size="lg" variant="outline">View Our Work <ArrowRight className="ml-2" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 17. ENTERPRISE TRUST ========================================== */}
      <EnterpriseTrust />

      {/* ========================================== 18. PRODUCT SHOWCASE ========================================== */}
      <ProductShowcase />

      {/* ========================================== 19. GREAT RESULTS ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Delivering{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Exceptional Results</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">10,000+ projects delivered across 100+ countries with 99.7% client satisfaction.</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[{ value: '10K+', label: 'Projects' }, { value: '99.7%', label: 'Satisfaction' }, { value: '450K+', label: 'Users' }].map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              <Link href="/case-studies"><Button size="lg">See Case Studies <ArrowRight className="ml-2" /></Button></Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden border shadow-xl">
              <Image src="/images/great.jpeg" alt="Exceptional Results" width={600} height={400} className="w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== 20. ENTERPRISE DASHBOARD ========================================== */}
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

      {/* ========================================== 21. REAL CASE STUDIES ========================================== */}
      <RealCaseStudies />

      {/* ========================================== 22. AI PROPOSAL GENERATOR ========================================== */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Custom Proposal</span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Generate a professional project proposal in seconds</p>
          </div>
          <div className="max-w-2xl mx-auto"><AIProposalGenerator /></div>
        </div>
      </section>

      {/* ========================================== 23. FINAL CTA ========================================== */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Enterprise?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join 450,000+ businesses that trust IntelliWave for enterprise AI solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-neutral-100 px-8 py-6 text-lg rounded-2xl font-bold">
                Schedule a Demo <ArrowRight className="ml-2 w-5 h-5" />
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