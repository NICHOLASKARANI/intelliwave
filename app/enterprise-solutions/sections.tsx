'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import {
  Building2, Users, BarChart3, HeadphonesIcon, ArrowRight,
  Cpu, Shield, Cloud, Zap, Globe, CheckCircle2, TrendingUp, Award
} from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'

const solutions = [
  { icon: Building2, title: 'Digital Transformation', desc: 'End-to-end transformation strategy and implementation for enterprise-scale operations.' },
  { icon: BarChart3, title: 'Custom ERP Systems', desc: 'Custom ERP tailored precisely to your workflows, with full tenant isolation and compliance.' },
  { icon: Users, title: 'IT Consulting', desc: 'Strategic technology consulting for modernization, migration, and cost optimization.' },
  { icon: HeadphonesIcon, title: 'Managed Services', desc: 'Ongoing support, 24/7 monitoring, maintenance, and continuous optimization.' },
]

const capabilities = [
  { icon: Cpu, title: 'AI & Machine Learning', desc: 'Custom AI models, LLM integration, and automation for your specific business processes.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 aligned, end-to-end encryption, RBAC, and compliance for regulated industries.' },
  { icon: Cloud, title: 'Cloud Infrastructure', desc: 'AWS, GCP, Azure, and Vercel deployments with global edge networks and 99.99% SLA.' },
]

const stats: Array<{ value: string; label: string; isDecimal?: boolean; isStatic?: boolean }> = [
  { value: '500+', label: 'Enterprise Clients' },
  { value: '100+', label: 'Countries Served' },
  { value: '99.99%', label: 'Uptime SLA', isDecimal: true },
  { value: '24/7', label: 'Support Coverage', isStatic: true },
]

const pillars = [
  'Consultation-first approach — no sales pressure',
  'Dedicated enterprise account team',
  'Full source code ownership on delivery',
  '12-month post-launch support included',
]

function StatValue({ stat }: { stat: { value: string; label: string; isDecimal?: boolean; isStatic?: boolean } }) {
  if (stat.isStatic) return <>{stat.value}</>
  if (stat.isDecimal) {
    const numeric = parseFloat(stat.value.replace(/[^0-9.]/g, ''))
    const suffix = stat.value.replace(/[0-9.]/g, '')
    return <AnimatedCounter target={numeric} decimals={2} suffix={suffix} />
  }
  const numeric = parseInt(stat.value.replace(/[^0-9]/g, ''), 10)
  const suffix = stat.value.replace(/[0-9]/g, '')
  return <AnimatedCounter target={numeric} suffix={suffix} />
}

export function EnterpriseSolutionsSections() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" /> Enterprise Solutions
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Enterprise <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Solutions</span> for the Modern Organization
              </h1>
              <p className="text-lg md:text-xl text-neutral-300 mb-8">
                Digital transformation, IT consulting, AI engineering, and managed services for large organizations — built on enterprise-grade security and delivered by a dedicated team.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-500 text-white group w-full sm:w-auto">
                    Discuss Your Needs <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                    View Pricing
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Full source code ownership</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> 12-month support</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Dedicated team</span>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20">
                <Image
                  src="/images/enterprise-solutions.jpg"
                  alt="Enterprise Solutions - Digital Transformation Teams"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-bold text-lg">Digital Transformation Teams</p>
                  <p className="text-white/70 text-sm">Modernizing enterprise technology worldwide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-2">
                  <StatValue stat={stat} />
                </p>
                <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
              What We Deliver
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400">
              Four core capabilities that cover the full enterprise technology lifecycle.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {solutions.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="group p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500/50 hover:shadow-xl transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="py-20 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
              Enterprise-Grade Capabilities
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400">
              Built for organizations that cannot compromise on quality, security, or scale.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {capabilities.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-purple-500/50 transition-all">
                  <Icon className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4" />
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
                <Award className="w-4 h-4" /> Why Enterprises Choose IntelliWavve
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
                A partner, not a vendor
              </h2>
              <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-8">
                We work alongside your team through every phase — from strategy to launch to long-term optimization. No hand-offs, no surprises.
              </p>
              <ul className="space-y-4">
                {pillars.map((pillar, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300">{pillar}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl font-bold mb-1"><AnimatedCounter target={60} suffix="%" /></p>
                <p className="text-sm text-white/80">Average efficiency gain</p>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                <Zap className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl font-bold mb-1"><AnimatedCounter target={2} suffix="x" /></p>
                <p className="text-sm text-white/80">Faster time-to-market</p>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <Globe className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl font-bold mb-1"><AnimatedCounter target={100} suffix="+" /></p>
                <p className="text-sm text-white/80">Countries deployed</p>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white">
                <Shield className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl font-bold mb-1">0</p>
                <p className="text-sm text-white/80">Security incidents</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Enterprise?
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Tell us about your project. We'll respond with a preliminary assessment within 24 hours — free of charge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-6 text-lg font-bold shadow-2xl group">
                Schedule a Consultation <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2 border-white/30 text-white hover:bg-white/10 font-bold">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}